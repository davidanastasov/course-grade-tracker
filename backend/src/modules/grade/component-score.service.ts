import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ComponentScore } from './entities/component-score.entity';
import { GradeComponent } from '../course/entities/grade-component.entity';
import { Course } from '../course/entities/course.entity';
import { User, UserRole } from '../user/entities/user.entity';
import { Enrollment, EnrollmentStatus } from '../user/entities/enrollment.entity';
import {
  CreateComponentScoreDto,
  UpdateComponentScoreDto,
  ComponentScoreResponseDto,
  ComponentProgressDto
} from './dto/component-score.dto';

@Injectable()
export class ComponentScoreService {
  constructor(
    @InjectRepository(ComponentScore)
    private componentScoreRepository: Repository<ComponentScore>,
    @InjectRepository(GradeComponent)
    private gradeComponentRepository: Repository<GradeComponent>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>
  ) {}

  async createComponentScore(
    createComponentScoreDto: CreateComponentScoreDto,
    student: User
  ): Promise<ComponentScore> {
    const { gradeComponentId, courseId, pointsEarned, ...scoreData } = createComponentScoreDto;

    // Verify grade component exists
    const gradeComponent = await this.gradeComponentRepository.findOne({
      where: { id: gradeComponentId },
      relations: ['course']
    });

    if (!gradeComponent) {
      throw new NotFoundException('Grade component not found');
    }

    // Verify course exists
    const course = await this.courseRepository.findOne({
      where: { id: courseId }
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check if grade component belongs to the course
    if (gradeComponent.course.id !== courseId) {
      throw new ForbiddenException('Grade component does not belong to the specified course');
    }

    // Verify student is enrolled in the course
    const enrollment = await this.enrollmentRepository.findOne({
      where: {
        student: { id: student.id },
        course: { id: courseId },
        status: EnrollmentStatus.ACTIVE
      }
    });

    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled in this course');
    }

    // Validate points earned doesn't exceed total points
    if (pointsEarned > gradeComponent.totalPoints) {
      throw new BadRequestException(
        `Points earned (${pointsEarned}) cannot exceed total points (${gradeComponent.totalPoints})`
      );
    }

    // Check if score already exists for this student and grade component
    const existingScore = await this.componentScoreRepository.findOne({
      where: {
        student: { id: student.id },
        gradeComponent: { id: gradeComponentId }
      }
    });

    if (existingScore) {
      throw new ConflictException('Score already exists for this grade component');
    }

    // Create component score
    const componentScore = this.componentScoreRepository.create({
      pointsEarned,
      ...scoreData,
      student,
      gradeComponent,
      course
    });

    return this.componentScoreRepository.save(componentScore);
  }

  async findByStudent(studentId: string): Promise<ComponentScoreResponseDto[]> {
    const scores = await this.componentScoreRepository.find({
      where: { student: { id: studentId } },
      relations: ['student', 'gradeComponent', 'course'],
      order: { createdAt: 'DESC' }
    });

    return scores.map(this.mapToResponseDto);
  }

  async findByCourse(courseId: string): Promise<ComponentScoreResponseDto[]> {
    const scores = await this.componentScoreRepository.find({
      where: { course: { id: courseId } },
      relations: ['student', 'gradeComponent', 'course'],
      order: { createdAt: 'DESC' }
    });

    return scores.map(this.mapToResponseDto);
  }

  async findByStudentAndCourse(
    studentId: string,
    courseId: string
  ): Promise<ComponentScoreResponseDto[]> {
    const scores = await this.componentScoreRepository.find({
      where: {
        student: { id: studentId },
        course: { id: courseId }
      },
      relations: ['student', 'gradeComponent', 'course'],
      order: { createdAt: 'DESC' }
    });

    return scores.map(this.mapToResponseDto);
  }

  async getComponentProgress(studentId: string, courseId: string): Promise<ComponentProgressDto[]> {
    // Get all grade components for the course
    const gradeComponents = await this.gradeComponentRepository.find({
      where: { course: { id: courseId } },
      order: { category: 'ASC', name: 'ASC' }
    });

    // Get all component scores for the student in this course
    const componentScores = await this.componentScoreRepository.find({
      where: {
        student: { id: studentId },
        course: { id: courseId }
      },
      relations: ['gradeComponent']
    });

    return gradeComponents.map((component) => {
      const currentScore = componentScores.find(
        (score) => score.gradeComponent.id === component.id
      );

      const pointsEarned = currentScore?.pointsEarned || 0;
      const progressPercentage = (pointsEarned / component.totalPoints) * 100;
      const isPassingMinimum = pointsEarned >= component.minimumScore;
      const pointsNeededToPass = Math.max(0, component.minimumScore - pointsEarned);

      return {
        gradeComponent: {
          id: component.id,
          name: component.name,
          category: component.category,
          weight: component.weight,
          minimumScore: component.minimumScore,
          totalPoints: component.totalPoints,
          isMandatory: component.isMandatory
        },
        currentScore: currentScore ? this.mapToResponseDto(currentScore) : null,
        progressPercentage,
        isPassingMinimum,
        pointsNeededToPass
      };
    });
  }

  async updateComponentScore(
    id: string,
    updateComponentScoreDto: UpdateComponentScoreDto,
    user: User
  ): Promise<ComponentScore> {
    const componentScore = await this.componentScoreRepository.findOne({
      where: { id },
      relations: ['student', 'gradeComponent', 'course']
    });

    if (!componentScore) {
      throw new NotFoundException('Component score not found');
    }

    // Students can only update their own scores
    if (user.role === UserRole.STUDENT && componentScore.student.id !== user.id) {
      throw new ForbiddenException('You can only update your own scores');
    }

    // Professors can update scores for their courses
    if (user.role === UserRole.PROFESSOR) {
      const course = await this.courseRepository.findOne({
        where: { id: componentScore.course.id },
        relations: ['professor']
      });

      if (course.professor.id !== user.id) {
        throw new ForbiddenException('You can only update scores for your own courses');
      }
    }

    // Validate points earned doesn't exceed total points
    if (updateComponentScoreDto.pointsEarned !== undefined) {
      if (updateComponentScoreDto.pointsEarned > componentScore.gradeComponent.totalPoints) {
        throw new BadRequestException(
          `Points earned (${updateComponentScoreDto.pointsEarned}) cannot exceed total points (${componentScore.gradeComponent.totalPoints})`
        );
      }
    }

    Object.assign(componentScore, updateComponentScoreDto);
    return this.componentScoreRepository.save(componentScore);
  }

  async deleteComponentScore(id: string, user: User): Promise<void> {
    const componentScore = await this.componentScoreRepository.findOne({
      where: { id },
      relations: ['student', 'course']
    });

    if (!componentScore) {
      throw new NotFoundException('Component score not found');
    }

    // Students can only delete their own scores
    if (user.role === UserRole.STUDENT && componentScore.student.id !== user.id) {
      throw new ForbiddenException('You can only delete your own scores');
    }

    // Professors can delete scores for their courses
    if (user.role === UserRole.PROFESSOR) {
      const course = await this.courseRepository.findOne({
        where: { id: componentScore.course.id },
        relations: ['professor']
      });

      if (course.professor.id !== user.id) {
        throw new ForbiddenException('You can only delete scores for your own courses');
      }
    }

    await this.componentScoreRepository.remove(componentScore);
  }

  private mapToResponseDto(componentScore: ComponentScore): ComponentScoreResponseDto {
    return {
      id: componentScore.id,
      pointsEarned: componentScore.pointsEarned,
      feedback: componentScore.feedback,
      isSubmitted: componentScore.isSubmitted,
      isGraded: componentScore.isGraded,
      createdAt: componentScore.createdAt,
      updatedAt: componentScore.updatedAt,
      student: {
        id: componentScore.student.id,
        firstName: componentScore.student.firstName,
        lastName: componentScore.student.lastName,
        username: componentScore.student.username
      },
      gradeComponent: {
        id: componentScore.gradeComponent.id,
        name: componentScore.gradeComponent.name,
        category: componentScore.gradeComponent.category,
        weight: componentScore.gradeComponent.weight,
        minimumScore: componentScore.gradeComponent.minimumScore,
        totalPoints: componentScore.gradeComponent.totalPoints,
        isMandatory: componentScore.gradeComponent.isMandatory
      },
      course: {
        id: componentScore.course.id,
        code: componentScore.course.code,
        name: componentScore.course.name
      }
    };
  }
}
