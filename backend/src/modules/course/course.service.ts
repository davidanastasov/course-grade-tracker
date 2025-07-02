import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Course, CourseDocument } from './entities/course.entity';
import { GradeComponent, GradeComponentDocument } from './entities/grade-component.entity';
import { GradeBand, GradeBandDocument } from './entities/grade-band.entity';
import { User, UserDocument, UserRole } from '../user/entities/user.entity';
import {
  Enrollment,
  EnrollmentDocument,
  EnrollmentStatus
} from '../user/entities/enrollment.entity';
import {
  CreateCourseDto,
  UpdateCourseDto,
  CreateGradeComponentDto,
  CreateGradeBandDto
} from './dto/course.dto';

@Injectable()
export class CourseService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(GradeComponent.name) private gradeComponentModel: Model<GradeComponentDocument>,
    @InjectModel(GradeBand.name) private gradeBandModel: Model<GradeBandDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Enrollment.name) private enrollmentModel: Model<EnrollmentDocument>
  ) {}

  async createCourse(createCourseDto: CreateCourseDto, professor: User): Promise<Course> {
    if (professor.role !== UserRole.PROFESSOR) {
      throw new ForbiddenException('Only professors can create courses');
    }

    // Extract the nested objects before creating the course
    const { gradeComponents, gradeBands, ...courseData } = createCourseDto;

    const course = new this.courseModel({
      ...courseData,
      professor: professor._id
    });

    const savedCourse = await course.save();

    // Create grade components if provided
    if (gradeComponents && gradeComponents.length > 0) {
      const gradeComponentEntities = gradeComponents.map((component) => ({
        ...component,
        course: savedCourse._id
      }));
      await this.gradeComponentModel.insertMany(gradeComponentEntities);
    }

    // Create grade bands if provided
    if (gradeBands && gradeBands.length > 0) {
      const gradeBandEntities = gradeBands.map((band) => ({
        ...band,
        course: savedCourse._id
      }));
      await this.gradeBandModel.insertMany(gradeBandEntities);
    }

    return this.findById(savedCourse._id.toString());
  }

  private transformCourseResponse(course: Course): Course {
    // Transform is not needed for Mongoose as relationships are properly handled
    return course;
  }

  private transformCoursesResponse(courses: Course[]): Course[] {
    return courses.map((course) => this.transformCourseResponse(course));
  }

  async findAll(): Promise<Course[]> {
    const courses = await this.courseModel
      .find({ isActive: true })
      .populate('professor')
      .populate('gradeComponents')
      .populate('gradeBands')
      .sort({ createdAt: -1 });

    // Add counts using aggregation
    const coursesWithCounts = await Promise.all(
      courses.map(async (course) => {
        const enrollmentCount = await this.enrollmentModel.countDocuments({
          course: course._id.toString(),
          status: EnrollmentStatus.ACTIVE
        });

        const assignmentCount = await this.courseModel.aggregate([
          { $match: { _id: course._id } },
          {
            $lookup: {
              from: 'assignments',
              localField: '_id',
              foreignField: 'course',
              as: 'assignments'
            }
          },
          { $project: { assignmentCount: { $size: '$assignments' } } }
        ]);

        const courseObj = course.toObject({ virtuals: true });
        courseObj.enrollmentCount = enrollmentCount;
        courseObj.assignmentCount = assignmentCount[0]?.assignmentCount || 0;
        return courseObj as Course;
      })
    );

    return this.transformCoursesResponse(coursesWithCounts);
  }

  async findById(id: string): Promise<Course> {
    const course = await this.courseModel
      .findById(id)
      .populate('professor')
      .populate('gradeComponents')
      .populate('gradeBands')
      .populate({
        path: 'enrollments',
        populate: { path: 'student' },
        match: { status: EnrollmentStatus.ACTIVE }
      });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Convert to object with virtuals included
    return course.toObject({ virtuals: true });
  }

  async findByProfessor(professorId: string): Promise<Course[]> {
    // Convert string to ObjectId for proper MongoDB query
    const professorObjectId = new Types.ObjectId(professorId);

    const courses = await this.courseModel
      .find({ professor: professorObjectId, isActive: true })
      .populate('professor')
      .populate('gradeComponents')
      .populate('gradeBands')
      .sort({ createdAt: -1 });

    // Add counts using aggregation
    const coursesWithCounts = await Promise.all(
      courses.map(async (course) => {
        const enrollmentCount = await this.enrollmentModel.countDocuments({
          course: course._id.toString(),
          status: EnrollmentStatus.ACTIVE
        });

        const assignmentCount = await this.courseModel.aggregate([
          { $match: { _id: course._id } },
          {
            $lookup: {
              from: 'assignments',
              localField: '_id',
              foreignField: 'course',
              as: 'assignments'
            }
          },
          { $project: { assignmentCount: { $size: '$assignments' } } }
        ]);

        const courseObj = course.toObject();
        courseObj.enrollmentCount = enrollmentCount;
        courseObj.assignmentCount = assignmentCount[0]?.assignmentCount || 0;
        return courseObj as Course;
      })
    );

    return this.transformCoursesResponse(coursesWithCounts);
  }

  async findEnrolledCourses(studentId: string): Promise<Course[]> {
    // First get all active enrollments for this student
    const enrollments = await this.enrollmentModel
      .find({ student: studentId, status: EnrollmentStatus.ACTIVE })
      .populate({
        path: 'course',
        populate: [{ path: 'professor' }, { path: 'gradeComponents' }, { path: 'gradeBands' }]
      });

    const courses = enrollments
      .map((enrollment) => enrollment.course as unknown as Course)
      .filter((course) => course && course.isActive);

    // Add counts for each course
    const coursesWithCounts = await Promise.all(
      courses.map(async (course) => {
        const enrollmentCount = await this.enrollmentModel.countDocuments({
          course: course._id.toString(),
          status: EnrollmentStatus.ACTIVE
        });

        const assignmentCount = await this.courseModel.aggregate([
          { $match: { _id: course._id } },
          {
            $lookup: {
              from: 'assignments',
              localField: '_id',
              foreignField: 'course',
              as: 'assignments'
            }
          },
          { $project: { assignmentCount: { $size: '$assignments' } } }
        ]);

        const courseObj = course.toObject ? course.toObject() : course;
        courseObj.enrollmentCount = enrollmentCount;
        courseObj.assignmentCount = assignmentCount[0]?.assignmentCount || 0;
        return courseObj as Course;
      })
    );

    return this.transformCoursesResponse(coursesWithCounts);
  }

  async updateCourse(id: string, updateCourseDto: UpdateCourseDto, user: User): Promise<Course> {
    const course = await this.findById(id);

    const professorId = course.professor?._id || course.professor;
    const userId = user._id || user.id;

    if (professorId?.toString() !== userId?.toString() && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only update your own courses');
    }

    await this.courseModel.findByIdAndUpdate(id, updateCourseDto, { new: true });

    return this.findById(id);
  }

  async deleteCourse(id: string, user: User): Promise<void> {
    const course = await this.findById(id);

    const professorId = course.professor?._id || course.professor;
    const userId = user._id || user.id;

    if (professorId?.toString() !== userId?.toString() && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only delete your own courses');
    }

    await this.courseModel.findByIdAndUpdate(id, { isActive: false });
  }

  async addGradeComponent(
    courseId: string,
    componentData: CreateGradeComponentDto,
    user: User
  ): Promise<GradeComponent> {
    const course = await this.findById(courseId);

    const professorId = course.professor?._id || course.professor;
    const userId = user._id || user.id;

    if (professorId?.toString() !== userId?.toString() && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only modify your own courses');
    }

    const gradeComponent = new this.gradeComponentModel({
      ...componentData,
      course: course._id
    });

    return gradeComponent.save();
  }

  async addGradeBand(
    courseId: string,
    bandData: CreateGradeBandDto,
    user: User
  ): Promise<GradeBand> {
    const course = await this.findById(courseId);

    const professorId = course.professor?._id || course.professor;
    const userId = user._id || user.id;

    if (professorId?.toString() !== userId?.toString() && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only modify your own courses');
    }

    // Handle mapping from 'grade' to 'gradeValue' if needed
    // Frontend sends 'grade', backend expects 'gradeValue'
    const gradeValue = bandData.grade !== undefined ? bandData.grade : bandData.gradeValue;

    if (gradeValue === undefined) {
      throw new Error('Either grade or gradeValue must be provided');
    }

    const gradeBand = new this.gradeBandModel({
      minScore: bandData.minScore,
      maxScore: bandData.maxScore,
      gradeValue,
      course: course._id
    });

    return gradeBand.save();
  }

  async calculateProjectedGrade(
    courseId: string,
    studentId: string
  ): Promise<{
    courseId: string;
    studentId: string;
    components: Array<{
      id: string;
      name: string;
      category: string;
      weight: number;
      currentScore: number;
      projectedScore: number;
    }>;
    currentGrade: number;
    projectedGrade: number;
    passingStatus: string;
    gradeBand: string | null;
  }> {
    const course = await this.courseModel
      .findById(courseId)
      .populate('gradeComponents')
      .populate('gradeBands');

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // This would typically fetch the student's grades for this course
    // For now, return a placeholder structure
    return {
      courseId,
      studentId,
      components:
        (course.gradeComponents as unknown as GradeComponent[])?.map((component) => ({
          id: component._id?.toString() || '',
          name: component.name,
          category: component.category,
          weight: component.weight,
          currentScore: 0, // Would be calculated from actual grades
          projectedScore: 0 // Would be calculated based on remaining assignments
        })) || [],
      currentGrade: 0,
      projectedGrade: 0,
      passingStatus: 'unknown',
      gradeBand: null
    };
  }

  async getCourseStudents(courseId: string, user: User): Promise<User[]> {
    // First verify the user has access to this course
    const course = await this.courseModel.findById(courseId).populate('professor');

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check authorization
    const professorId = course.professor?._id || course.professor;
    const userId = user._id || user.id;

    if (user.role !== UserRole.ADMIN && professorId?.toString() !== userId?.toString()) {
      throw new ForbiddenException('You do not have access to this course');
    }

    // Get active enrollments with populated student data
    const enrollments = await this.enrollmentModel
      .find({ course: courseId, status: EnrollmentStatus.ACTIVE })
      .populate('student');

    // Return only the student objects
    return enrollments.map((enrollment) => enrollment.student as unknown as User);
  }

  // Grade Component CRUD operations
  async updateGradeComponent(
    courseId: string,
    componentId: string,
    componentData: CreateGradeComponentDto,
    user: User
  ): Promise<GradeComponent> {
    const component = await this.gradeComponentModel
      .findOne({ _id: componentId, course: courseId })
      .populate({
        path: 'course',
        populate: { path: 'professor' }
      });

    if (!component) {
      throw new NotFoundException('Grade component not found');
    }

    if (
      user.role !== UserRole.ADMIN &&
      (component.course as unknown as Course).professor.toString() !== user._id.toString()
    ) {
      throw new ForbiddenException('You can only update grade components for your own courses');
    }

    return this.gradeComponentModel.findByIdAndUpdate(componentId, componentData, { new: true });
  }

  async deleteGradeComponent(courseId: string, componentId: string, user: User): Promise<void> {
    const component = await this.gradeComponentModel
      .findOne({ _id: componentId, course: courseId })
      .populate({
        path: 'course',
        populate: { path: 'professor' }
      });

    if (!component) {
      throw new NotFoundException('Grade component not found');
    }

    if (
      user.role !== UserRole.ADMIN &&
      (component.course as unknown as Course).professor.toString() !== user._id.toString()
    ) {
      throw new ForbiddenException('You can only delete grade components for your own courses');
    }

    await this.gradeComponentModel.findByIdAndDelete(componentId);
  }

  // Grade Band CRUD operations
  async updateGradeBand(
    courseId: string,
    bandId: string,
    bandData: CreateGradeBandDto,
    user: User
  ): Promise<GradeBand> {
    const band = await this.gradeBandModel.findOne({ _id: bandId, course: courseId }).populate({
      path: 'course',
      populate: { path: 'professor' }
    });

    if (!band) {
      throw new NotFoundException('Grade band not found');
    }

    if (
      user.role !== UserRole.ADMIN &&
      (band.course as unknown as Course).professor.toString() !== user._id.toString()
    ) {
      throw new ForbiddenException('You can only update grade bands for your own courses');
    }

    return this.gradeBandModel.findByIdAndUpdate(bandId, bandData, { new: true });
  }

  async deleteGradeBand(courseId: string, bandId: string, user: User): Promise<void> {
    const band = await this.gradeBandModel.findOne({ _id: bandId, course: courseId }).populate({
      path: 'course',
      populate: { path: 'professor' }
    });

    if (!band) {
      throw new NotFoundException('Grade band not found');
    }

    if (
      user.role !== UserRole.ADMIN &&
      (band.course as unknown as Course).professor.toString() !== user._id.toString()
    ) {
      throw new ForbiddenException('You can only delete grade bands for your own courses');
    }

    await this.gradeBandModel.findByIdAndDelete(bandId);
  }
}
