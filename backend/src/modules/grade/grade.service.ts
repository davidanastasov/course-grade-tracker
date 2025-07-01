import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Grade, GradeDocument } from './entities/grade.entity';
import { Assignment, AssignmentDocument } from '../assignment/entities/assignment.entity';
import { Course, CourseDocument } from '../course/entities/course.entity';
import { User, UserDocument, UserRole } from '../user/entities/user.entity';
import {
  Enrollment,
  EnrollmentDocument,
  EnrollmentStatus
} from '../user/entities/enrollment.entity';
import {
  CreateGradeDto,
  UpdateGradeDto,
  GradeResponseDto,
  ProjectedGradeDto
} from './dto/grade.dto';

interface GradeSummary {
  student: User;
  currentGrade: number;
  projectedGrade: number;
  isEligible?: boolean;
  status?: string;
  courseId?: string;
  passingStatus?: string;
  gradeBand?: any;
  components?: any[];
}

@Injectable()
export class GradeService {
  constructor(
    @InjectModel(Grade.name)
    private gradeModel: Model<GradeDocument>,
    @InjectModel(Assignment.name)
    private assignmentModel: Model<AssignmentDocument>,
    @InjectModel(Course.name)
    private courseModel: Model<CourseDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>
  ) {}

  async createGrade(createGradeDto: CreateGradeDto, student: User): Promise<Grade> {
    const { assignmentId, courseId, ...gradeData } = createGradeDto;

    if (!Types.ObjectId.isValid(assignmentId) || !Types.ObjectId.isValid(courseId)) {
      throw new NotFoundException('Invalid assignment or course ID');
    }

    // Verify assignment exists
    const assignment = await this.assignmentModel.findById(assignmentId).populate('course').exec();

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Verify course exists
    const course = await this.courseModel.findById(courseId).exec();

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check if assignment belongs to the course
    if (assignment.course._id.toString() !== courseId) {
      throw new ForbiddenException('Assignment does not belong to the specified course');
    }

    // Check if grade already exists for this student and assignment
    const existingGrade = await this.gradeModel
      .findOne({
        student: student._id,
        assignment: assignmentId
      })
      .exec();

    if (existingGrade) {
      throw new ConflictException('Grade already exists for this assignment');
    }

    // Create grade
    const grade = new this.gradeModel({
      ...gradeData,
      maxScore: gradeData.maxScore || assignment.maxScore,
      student: student._id,
      assignment: assignmentId,
      course: courseId
    });

    return await grade.save();
  }

  async findAll(): Promise<GradeResponseDto[]> {
    const grades = await this.gradeModel
      .find()
      .populate('student')
      .populate('assignment')
      .populate('course')
      .sort({ createdAt: -1 })
      .exec();

    return grades.map(this.mapToResponseDto);
  }

  async findById(id: string): Promise<GradeResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid grade ID');
    }

    const grade = await this.gradeModel
      .findById(id)
      .populate('student')
      .populate('assignment')
      .populate('course')
      .exec();

    if (!grade) {
      throw new NotFoundException('Grade not found');
    }

    return this.mapToResponseDto(grade);
  }

  async findByStudent(studentId: string): Promise<GradeResponseDto[]> {
    if (!Types.ObjectId.isValid(studentId)) {
      throw new NotFoundException('Invalid student ID');
    }

    const grades = await this.gradeModel
      .find({ student: studentId })
      .populate('student')
      .populate('assignment')
      .populate('course')
      .sort({ createdAt: -1 })
      .exec();

    return grades.map(this.mapToResponseDto);
  }

  async findByCourse(courseId: string): Promise<GradeResponseDto[]> {
    if (!Types.ObjectId.isValid(courseId)) {
      throw new NotFoundException('Invalid course ID');
    }

    const grades = await this.gradeModel
      .find({ course: courseId })
      .populate('student')
      .populate('assignment')
      .populate('course')
      .sort({ createdAt: -1 })
      .exec();

    return grades.map(this.mapToResponseDto);
  }

  async findByStudentAndCourse(studentId: string, courseId: string): Promise<GradeResponseDto[]> {
    if (!Types.ObjectId.isValid(studentId) || !Types.ObjectId.isValid(courseId)) {
      throw new NotFoundException('Invalid student or course ID');
    }

    const grades = await this.gradeModel
      .find({
        student: studentId,
        course: courseId
      })
      .populate('student')
      .populate('assignment')
      .populate('course')
      .sort({ createdAt: -1 })
      .exec();

    return grades.map(this.mapToResponseDto);
  }

  async updateGrade(id: string, updateGradeDto: UpdateGradeDto, user: User): Promise<Grade> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid grade ID');
    }

    const grade = await this.gradeModel
      .findById(id)
      .populate('student')
      .populate({
        path: 'assignment',
        populate: { path: 'createdBy' }
      })
      .exec();

    if (!grade) {
      throw new NotFoundException('Grade not found');
    }

    // Students can only update their own grades, professors can update grades for their assignments
    if (user.role === UserRole.STUDENT && grade.student._id.toString() !== user._id.toString()) {
      throw new ForbiddenException('You can only update your own grades');
    }

    if (
      user.role === UserRole.PROFESSOR &&
      (grade.assignment as any).createdBy._id.toString() !== user._id.toString()
    ) {
      throw new ForbiddenException('You can only update grades for your own assignments');
    }

    return await this.gradeModel.findByIdAndUpdate(id, updateGradeDto, { new: true }).exec();
  }

  async deleteGrade(id: string, user: User): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid grade ID');
    }

    const grade = await this.gradeModel
      .findById(id)
      .populate('student')
      .populate({
        path: 'assignment',
        populate: { path: 'createdBy' }
      })
      .exec();

    if (!grade) {
      throw new NotFoundException('Grade not found');
    }

    // Only students can delete their own grades or professors can delete grades for their assignments
    if (user.role === UserRole.STUDENT && grade.student._id.toString() !== user._id.toString()) {
      throw new ForbiddenException('You can only delete your own grades');
    }

    if (
      user.role === UserRole.PROFESSOR &&
      (grade.assignment as any).createdBy._id.toString() !== user._id.toString()
    ) {
      throw new ForbiddenException('You can only delete grades for your own assignments');
    }

    await this.gradeModel.findByIdAndDelete(id).exec();
  }

  async calculateProjectedGrade(studentId: string, courseId: string): Promise<ProjectedGradeDto> {
    if (!Types.ObjectId.isValid(studentId) || !Types.ObjectId.isValid(courseId)) {
      throw new NotFoundException('Invalid student or course ID');
    }

    // Get course with grade components and grade bands
    const course = await this.courseModel
      .findById(courseId)
      .populate('gradeComponents')
      .populate('gradeBands')
      .exec();

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Get all assignments for the course
    const assignments = await this.assignmentModel.find({ course: courseId }).exec();

    // Get all grades for the student in this course
    const grades = await this.gradeModel
      .find({
        student: studentId,
        course: courseId
      })
      .populate('assignment')
      .exec();

    // Calculate current grade and projection
    let totalWeightedScore = 0;
    let totalWeight = 0;
    let currentGrade = 0;

    // Helper function to map grade component category to assignment type
    const mapCategoryToAssignmentType = (category: string): string[] => {
      switch (category) {
        case 'Lab':
          return ['lab'];
        case 'Assignment':
          return ['assignment'];
        case 'Midterm':
          return ['quiz']; // Midterms are typically quiz-type assignments
        case 'Exam':
          return ['exam'];
        case 'Project':
          return ['project'];
        default:
          return [];
      }
    };

    const componentStats = course.gradeComponents.map((component: any) => {
      const matchingTypes = mapCategoryToAssignmentType(component.category);
      const componentAssignments = assignments.filter((a) =>
        matchingTypes.includes(a.type.toString())
      );
      const componentGrades = grades.filter((g) =>
        componentAssignments.some((a) => a._id.toString() === g.assignment._id.toString())
      );

      const completedScore = componentGrades.reduce((sum, grade) => {
        return sum + (grade.score / grade.maxScore) * 100;
      }, 0);

      const averageScore = componentGrades.length > 0 ? completedScore / componentGrades.length : 0;

      totalWeightedScore += averageScore * (component.weight / 100);
      totalWeight += component.weight;

      return {
        id: component._id.toString(),
        name: component.name,
        category: component.category,
        weight: component.weight,
        currentScore: averageScore,
        maxPossibleScore: 100,
        completedAssignments: componentGrades.length,
        totalAssignments: componentAssignments.length
      };
    });

    if (totalWeight > 0) {
      currentGrade = totalWeightedScore;
    }

    // Calculate projected grade (assume average performance on remaining assignments)
    const projectedGrade = currentGrade; // Simplified projection

    // Determine passing status
    let passingStatus: 'passing' | 'failing' | 'at-risk' | 'unknown' = 'unknown';
    if (projectedGrade >= course.passingGrade) {
      passingStatus = 'passing';
    } else if (projectedGrade < course.passingGrade * 0.8) {
      passingStatus = 'failing';
    } else {
      passingStatus = 'at-risk';
    }

    // Find appropriate grade band
    const gradeBand = course.gradeBands.find(
      (band: any) => currentGrade >= band.minScore && currentGrade <= band.maxScore
    );

    return {
      courseId,
      currentGrade,
      projectedGrade,
      passingStatus,
      gradeBand: gradeBand
        ? {
            gradeValue: (gradeBand as any).gradeValue
          }
        : null,
      components: componentStats
    };
  }

  private mapToResponseDto(grade: any): GradeResponseDto {
    return {
      id: grade._id.toString(),
      score: grade.score,
      maxScore: grade.maxScore,
      feedback: grade.feedback,
      isSubmitted: grade.isSubmitted,
      isGraded: grade.isGraded,
      createdAt: grade.createdAt,
      updatedAt: grade.updatedAt,
      student: {
        id: grade.student._id.toString(),
        firstName: grade.student.firstName,
        lastName: grade.student.lastName,
        username: grade.student.username
      },
      assignment: {
        id: grade.assignment._id.toString(),
        title: grade.assignment.title,
        type: grade.assignment.type,
        maxScore: grade.assignment.maxScore,
        weight: grade.assignment.weight
      },
      course: {
        id: grade.course._id.toString(),
        code: grade.course.code,
        name: grade.course.name
      }
    };
  }

  async getGradesSummary(courseId: string, user: User): Promise<GradeSummary[]> {
    if (!Types.ObjectId.isValid(courseId)) {
      throw new NotFoundException('Invalid course ID');
    }

    // First verify the user has access to this course
    const course = await this.courseModel.findById(courseId).populate('professor').exec();

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check authorization
    if (user.role !== UserRole.ADMIN && course.professor._id.toString() !== user._id.toString()) {
      throw new ForbiddenException('You do not have access to this course');
    }

    // Get active enrollments with student details
    const activeEnrollments = await this.enrollmentModel
      .find({ course: courseId, status: EnrollmentStatus.ACTIVE })
      .populate('student')
      .exec();

    const summaries = await Promise.all(
      activeEnrollments.map(async (enrollment) => {
        try {
          const projectedGrade = await this.calculateProjectedGrade(
            enrollment.student._id.toString(),
            courseId
          );
          return {
            student: enrollment.student as unknown as User,
            ...projectedGrade
          };
        } catch {
          return {
            student: enrollment.student as unknown as User,
            currentGrade: 0,
            projectedGrade: 0,
            isEligible: false,
            status: 'error'
          };
        }
      })
    );

    return summaries;
  }
}
