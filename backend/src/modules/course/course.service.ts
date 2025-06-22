import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';

import { Course } from './entities/course.entity';
import { GradeComponent } from './entities/grade-component.entity';
import { GradeBand } from './entities/grade-band.entity';
import { User, UserRole } from '../user/entities/user.entity';
import { Enrollment, EnrollmentStatus } from '../user/entities/enrollment.entity';
import {
  CreateCourseDto,
  UpdateCourseDto,
  CreateGradeComponentDto,
  CreateGradeBandDto
} from './dto/course.dto';

@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(GradeComponent)
    private gradeComponentRepository: Repository<GradeComponent>,
    @InjectRepository(GradeBand)
    private gradeBandRepository: Repository<GradeBand>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>
  ) {}

  async createCourse(createCourseDto: CreateCourseDto, professor: User): Promise<Course> {
    if (professor.role !== UserRole.PROFESSOR) {
      throw new ForbiddenException('Only professors can create courses');
    }

    // Extract the nested objects before creating the course
    const { gradeComponents, gradeBands, ...courseData } = createCourseDto;

    const course = this.courseRepository.create({
      ...courseData,
      professor
    });

    const savedCourse = await this.courseRepository.save(course);

    // Create grade components if provided
    if (gradeComponents && gradeComponents.length > 0) {
      const gradeComponentEntities = gradeComponents.map((component) =>
        this.gradeComponentRepository.create({
          ...component,
          course: savedCourse
        })
      );
      await this.gradeComponentRepository.save(gradeComponentEntities);
    }

    // Create grade bands if provided
    if (gradeBands && gradeBands.length > 0) {
      const gradeBandEntities = gradeBands.map((band) =>
        this.gradeBandRepository.create({
          ...band,
          course: savedCourse
        })
      );
      await this.gradeBandRepository.save(gradeBandEntities);
    }

    return this.findById(savedCourse.id);
  }

  async findAll(): Promise<Course[]> {
    const courses = await this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.professor', 'professor')
      .leftJoinAndSelect('course.gradeComponents', 'gradeComponents')
      .leftJoinAndSelect('course.gradeBands', 'gradeBands')
      .loadRelationCountAndMap('course.enrollmentCount', 'course.enrollments', 'enrollment', (qb) =>
        qb.where('enrollment.status = :status', { status: EnrollmentStatus.ACTIVE })
      )
      .loadRelationCountAndMap('course.assignmentCount', 'course.assignments')
      .where('course.isActive = :isActive', { isActive: true })
      .getMany();

    return courses;
  }

  async findById(id: string): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: [
        'professor',
        'gradeComponents',
        'gradeBands',
        'enrollments',
        'enrollments.student'
      ]
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  async findByProfessor(professorId: string): Promise<Course[]> {
    const courses = await this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.professor', 'professor')
      .leftJoinAndSelect('course.gradeComponents', 'gradeComponents')
      .leftJoinAndSelect('course.gradeBands', 'gradeBands')
      .loadRelationCountAndMap('course.enrollmentCount', 'course.enrollments', 'enrollment', (qb) =>
        qb.where('enrollment.status = :status', { status: EnrollmentStatus.ACTIVE })
      )
      .loadRelationCountAndMap('course.assignmentCount', 'course.assignments')
      .where('course.professor.id = :professorId', { professorId })
      .andWhere('course.isActive = :isActive', { isActive: true })
      .getMany();

    return courses;
  }

  async findEnrolledCourses(studentId: string): Promise<Course[]> {
    const courses = await this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.professor', 'professor')
      .leftJoinAndSelect('course.gradeComponents', 'gradeComponents')
      .leftJoinAndSelect('course.gradeBands', 'gradeBands')
      .leftJoin('course.enrollments', 'enrollments')
      .loadRelationCountAndMap('course.enrollmentCount', 'course.enrollments', 'enrollment', (qb) =>
        qb.where('enrollment.status = :enrollmentStatus', {
          enrollmentStatus: EnrollmentStatus.ACTIVE
        })
      )
      .loadRelationCountAndMap('course.assignmentCount', 'course.assignments')
      .where('enrollments.student.id = :studentId', { studentId })
      .andWhere('enrollments.status = :status', { status: EnrollmentStatus.ACTIVE })
      .andWhere('course.isActive = :isActive', { isActive: true })
      .getMany();

    return courses;
  }

  async updateCourse(id: string, updateCourseDto: UpdateCourseDto, user: User): Promise<Course> {
    const course = await this.findById(id);

    if (course.professor.id !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only update your own courses');
    }

    Object.assign(course, updateCourseDto);
    await this.courseRepository.save(course);

    return this.findById(id);
  }

  async deleteCourse(id: string, user: User): Promise<void> {
    const course = await this.findById(id);

    if (course.professor.id !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only delete your own courses');
    }

    course.isActive = false;
    await this.courseRepository.save(course);
  }

  async uploadFile(
    courseId: string,
    file: Express.Multer.File,
    user: User
  ): Promise<{ filePath: string }> {
    const course = await this.findById(courseId);

    if (course.professor.id !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only upload files to your own courses');
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = extname(file.originalname);
    const filename = `${uuidv4()}${fileExtension}`;
    const filePath = `${uploadDir}/${filename}`;

    // Save file
    fs.writeFileSync(filePath, file.buffer);

    return { filePath: `/uploads/${filename}` };
  }

  async addGradeComponent(
    courseId: string,
    componentData: CreateGradeComponentDto,
    user: User
  ): Promise<GradeComponent> {
    const course = await this.findById(courseId);

    if (course.professor.id !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only modify your own courses');
    }

    const gradeComponent = this.gradeComponentRepository.create({
      ...componentData,
      course
    });

    const savedComponent = await this.gradeComponentRepository.save(gradeComponent);
    return Array.isArray(savedComponent) ? savedComponent[0] : savedComponent;
  }

  async addGradeBand(
    courseId: string,
    bandData: CreateGradeBandDto,
    user: User
  ): Promise<GradeBand> {
    const course = await this.findById(courseId);

    if (course.professor.id !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only modify your own courses');
    }

    // Handle mapping from 'grade' to 'gradeValue' if needed
    // Frontend sends 'grade', backend expects 'gradeValue'
    const gradeValue = bandData.grade !== undefined ? bandData.grade : bandData.gradeValue;

    if (gradeValue === undefined) {
      throw new Error('Either grade or gradeValue must be provided');
    }

    // Auto-generate gradeLetter if not provided
    let gradeLetter = bandData.gradeLetter;
    if (!gradeLetter) {
      gradeLetter = this.generateGradeLetter(gradeValue);
    }

    const gradeBand = this.gradeBandRepository.create({
      minScore: bandData.minScore,
      maxScore: bandData.maxScore,
      gradeValue,
      gradeLetter,
      course
    });

    const savedBand = await this.gradeBandRepository.save(gradeBand);
    return Array.isArray(savedBand) ? savedBand[0] : savedBand;
  }

  private generateGradeLetter(gradeValue: number): string {
    if (gradeValue >= 9) return 'A';
    if (gradeValue >= 8) return 'B';
    if (gradeValue >= 7) return 'C';
    if (gradeValue >= 6) return 'D';
    if (gradeValue >= 5) return 'E';
    return 'F';
  }

  async calculateProjectedGrade(courseId: string, studentId: string): Promise<any> {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
      relations: ['gradeComponents', 'gradeBands']
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // This would typically fetch the student's grades for this course
    // For now, return a placeholder structure
    return {
      courseId,
      studentId,
      components: course.gradeComponents.map((component) => ({
        id: component.id,
        name: component.name,
        type: component.type,
        weight: component.weight,
        currentScore: 0, // Would be calculated from actual grades
        projectedScore: 0 // Would be calculated based on remaining assignments
      })),
      currentGrade: 0,
      projectedGrade: 0,
      passingStatus: 'unknown',
      gradeBand: null
    };
  }

  async getCourseStudents(courseId: string, user: User): Promise<User[]> {
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

    // Return only active enrollments
    return course.enrollments
      .filter((enrollment) => enrollment.status === EnrollmentStatus.ACTIVE)
      .map((enrollment) => enrollment.student);
  }
}
