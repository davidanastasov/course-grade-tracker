import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Grade } from './entities/grade.entity';
import { Assignment } from '../assignment/entities/assignment.entity';
import { Course } from '../course/entities/course.entity';
import { User, UserRole } from '../user/entities/user.entity';
import { Enrollment, EnrollmentStatus } from '../user/entities/enrollment.entity';
import {
  CreateGradeDto,
  UpdateGradeDto,
  GradeResponseDto,
  ProjectedGradeDto
} from './dto/grade.dto';

@Injectable()
export class GradeService {
  constructor(
    @InjectRepository(Grade)
    private gradeRepository: Repository<Grade>,
    @InjectRepository(Assignment)
    private assignmentRepository: Repository<Assignment>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>
  ) {}

  async createGrade(createGradeDto: CreateGradeDto, student: User): Promise<Grade> {
    const { assignmentId, courseId, ...gradeData } = createGradeDto;

    // Verify assignment exists
    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
      relations: ['course']
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Verify course exists
    const course = await this.courseRepository.findOne({
      where: { id: courseId }
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check if assignment belongs to the course
    if (assignment.course.id !== courseId) {
      throw new ForbiddenException('Assignment does not belong to the specified course');
    }

    // Check if grade already exists for this student and assignment
    const existingGrade = await this.gradeRepository.findOne({
      where: {
        student: { id: student.id },
        assignment: { id: assignmentId }
      }
    });

    if (existingGrade) {
      throw new ConflictException('Grade already exists for this assignment');
    }

    // Create grade
    const grade = this.gradeRepository.create({
      ...gradeData,
      maxScore: gradeData.maxScore || assignment.maxScore,
      student,
      assignment,
      course
    });

    return this.gradeRepository.save(grade);
  }

  async findAll(): Promise<GradeResponseDto[]> {
    const grades = await this.gradeRepository.find({
      relations: ['student', 'assignment', 'course'],
      order: { createdAt: 'DESC' }
    });

    return grades.map(this.mapToResponseDto);
  }

  async findById(id: string): Promise<GradeResponseDto> {
    const grade = await this.gradeRepository.findOne({
      where: { id },
      relations: ['student', 'assignment', 'course']
    });

    if (!grade) {
      throw new NotFoundException('Grade not found');
    }

    return this.mapToResponseDto(grade);
  }

  async findByStudent(studentId: string): Promise<GradeResponseDto[]> {
    const grades = await this.gradeRepository.find({
      where: { student: { id: studentId } },
      relations: ['student', 'assignment', 'course'],
      order: { createdAt: 'DESC' }
    });

    return grades.map(this.mapToResponseDto);
  }

  async findByCourse(courseId: string): Promise<GradeResponseDto[]> {
    const grades = await this.gradeRepository.find({
      where: { course: { id: courseId } },
      relations: ['student', 'assignment', 'course'],
      order: { createdAt: 'DESC' }
    });

    return grades.map(this.mapToResponseDto);
  }

  async findByStudentAndCourse(studentId: string, courseId: string): Promise<GradeResponseDto[]> {
    const grades = await this.gradeRepository.find({
      where: {
        student: { id: studentId },
        course: { id: courseId }
      },
      relations: ['student', 'assignment', 'course'],
      order: { createdAt: 'DESC' }
    });

    return grades.map(this.mapToResponseDto);
  }

  async updateGrade(id: string, updateGradeDto: UpdateGradeDto, user: User): Promise<Grade> {
    const grade = await this.gradeRepository.findOne({
      where: { id },
      relations: ['student', 'assignment', 'assignment.createdBy']
    });

    if (!grade) {
      throw new NotFoundException('Grade not found');
    }

    // Students can only update their own grades, professors can update grades for their assignments
    if (user.role === UserRole.STUDENT && grade.student.id !== user.id) {
      throw new ForbiddenException('You can only update your own grades');
    }

    if (user.role === UserRole.PROFESSOR && grade.assignment.createdBy.id !== user.id) {
      throw new ForbiddenException('You can only update grades for your own assignments');
    }

    Object.assign(grade, updateGradeDto);
    return this.gradeRepository.save(grade);
  }

  async deleteGrade(id: string, user: User): Promise<void> {
    const grade = await this.gradeRepository.findOne({
      where: { id },
      relations: ['student', 'assignment', 'assignment.createdBy']
    });

    if (!grade) {
      throw new NotFoundException('Grade not found');
    }

    // Only students can delete their own grades or professors can delete grades for their assignments
    if (user.role === UserRole.STUDENT && grade.student.id !== user.id) {
      throw new ForbiddenException('You can only delete your own grades');
    }

    if (user.role === UserRole.PROFESSOR && grade.assignment.createdBy.id !== user.id) {
      throw new ForbiddenException('You can only delete grades for your own assignments');
    }

    await this.gradeRepository.remove(grade);
  }

  async calculateProjectedGrade(studentId: string, courseId: string): Promise<ProjectedGradeDto> {
    // Get course with grade components and grade bands
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
      relations: ['gradeComponents', 'gradeBands']
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Get all assignments for the course
    const assignments = await this.assignmentRepository.find({
      where: { course: { id: courseId } }
    });

    // Get all grades for the student in this course
    const grades = await this.gradeRepository.find({
      where: {
        student: { id: studentId },
        course: { id: courseId }
      },
      relations: ['assignment']
    });

    // Calculate current grade and projection
    let totalWeightedScore = 0;
    let totalWeight = 0;
    let currentGrade = 0;

    const componentStats = course.gradeComponents.map((component) => {
      const componentAssignments = assignments.filter(
        (a) => a.type.toString() === component.type.toString()
      );
      const componentGrades = grades.filter((g) =>
        componentAssignments.some((a) => a.id === g.assignment.id)
      );

      const completedScore = componentGrades.reduce((sum, grade) => {
        return sum + (grade.score / grade.maxScore) * 100;
      }, 0);

      const averageScore = componentGrades.length > 0 ? completedScore / componentGrades.length : 0;

      totalWeightedScore += averageScore * (component.weight / 100);
      totalWeight += component.weight;

      return {
        id: component.id,
        name: component.name,
        type: component.type,
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
      (band) => currentGrade >= band.minScore && currentGrade <= band.maxScore
    );

    return {
      courseId,
      currentGrade,
      projectedGrade,
      passingStatus,
      gradeBand: gradeBand
        ? {
            gradeValue: gradeBand.gradeValue,
            gradeLetter: gradeBand.gradeLetter
          }
        : null,
      components: componentStats
    };
  }

  private mapToResponseDto(grade: Grade): GradeResponseDto {
    return {
      id: grade.id,
      score: grade.score,
      maxScore: grade.maxScore,
      feedback: grade.feedback,
      isSubmitted: grade.isSubmitted,
      isGraded: grade.isGraded,
      createdAt: grade.createdAt,
      updatedAt: grade.updatedAt,
      student: {
        id: grade.student.id,
        firstName: grade.student.firstName,
        lastName: grade.student.lastName,
        username: grade.student.username
      },
      assignment: {
        id: grade.assignment.id,
        title: grade.assignment.title,
        type: grade.assignment.type,
        maxScore: grade.assignment.maxScore,
        weight: grade.assignment.weight
      },
      course: {
        id: grade.course.id,
        code: grade.course.code,
        name: grade.course.name
      }
    };
  }

  async getGradesSummary(courseId: string, user: User): Promise<any[]> {
    // First verify the user has access to this course
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
      relations: ['professor', 'enrollments', 'enrollments.student']
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check authorization
    if (user.role !== UserRole.ADMIN && course.professor.id !== user.id) {
      throw new ForbiddenException('You do not have access to this course');
    }

    // Get grades summary for all enrolled students
    const activeEnrollments = course.enrollments.filter(
      (enrollment) => enrollment.status === EnrollmentStatus.ACTIVE
    );

    const summaries = await Promise.all(
      activeEnrollments.map(async (enrollment) => {
        try {
          const projectedGrade = await this.calculateProjectedGrade(
            enrollment.student.id,
            courseId
          );
          return {
            student: enrollment.student,
            ...projectedGrade
          };
        } catch (error) {
          return {
            student: enrollment.student,
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
