import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { ComponentScore, ComponentScoreDocument } from './entities/component-score.entity';
import { GradeComponent, GradeComponentDocument } from '../course/entities/grade-component.entity';
import { Course, CourseDocument } from '../course/entities/course.entity';
import { User, UserDocument, UserRole } from '../user/entities/user.entity';
import {
  Enrollment,
  EnrollmentDocument,
  EnrollmentStatus
} from '../user/entities/enrollment.entity';
import {
  CreateComponentScoreDto,
  UpdateComponentScoreDto,
  ComponentScoreResponseDto
} from './dto/component-score.dto';

@Injectable()
export class ComponentScoreService {
  constructor(
    @InjectModel(ComponentScore.name)
    private componentScoreModel: Model<ComponentScoreDocument>,
    @InjectModel(GradeComponent.name)
    private gradeComponentModel: Model<GradeComponentDocument>,
    @InjectModel(Course.name)
    private courseModel: Model<CourseDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>
  ) {}

  async createComponentScore(
    createComponentScoreDto: CreateComponentScoreDto,
    student: User
  ): Promise<ComponentScore> {
    const { gradeComponentId, courseId, pointsEarned, ...scoreData } = createComponentScoreDto;

    // Verify grade component exists
    const gradeComponent = await this.gradeComponentModel
      .findById(gradeComponentId)
      .populate('course');
    if (!gradeComponent) {
      throw new NotFoundException('Grade component not found');
    }

    // Verify course exists
    const course = await this.courseModel.findById(courseId);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Verify student is enrolled
    const enrollment = await this.enrollmentModel.findOne({
      student: student._id,
      course: courseId,
      status: EnrollmentStatus.ACTIVE
    });
    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled in this course');
    }

    // Check for existing score
    const existing = await this.componentScoreModel.findOne({
      student: student._id,
      gradeComponent: gradeComponentId
    });
    if (existing) {
      throw new ConflictException('Component score already exists');
    }

    // Validate points earned
    if (pointsEarned < 0 || pointsEarned > gradeComponent.totalPoints) {
      throw new BadRequestException(
        `Points earned must be between 0 and ${gradeComponent.totalPoints}`
      );
    }

    const componentScore = new this.componentScoreModel({
      student: student._id,
      gradeComponent: gradeComponentId,
      course: courseId,
      pointsEarned,
      ...scoreData
    });

    return componentScore.save();
  }

  async findAll(user: User): Promise<ComponentScoreResponseDto[]> {
    let scores: ComponentScore[];

    if (user.role === UserRole.ADMIN) {
      scores = await this.componentScoreModel
        .find()
        .populate('student gradeComponent course')
        .sort({ createdAt: -1 });
    } else if (user.role === UserRole.PROFESSOR) {
      // Find courses taught by this professor
      const courses = await this.courseModel.find({ professor: user._id });
      const courseIds = courses.map((course) => course._id);

      scores = await this.componentScoreModel
        .find({ course: { $in: courseIds } })
        .populate('student gradeComponent course')
        .sort({ createdAt: -1 });
    } else {
      scores = await this.componentScoreModel
        .find({ student: user._id })
        .populate('student gradeComponent course')
        .sort({ createdAt: -1 });
    }

    return scores.map(this.mapToResponseDto);
  }

  async findById(id: string, user: User): Promise<ComponentScoreResponseDto> {
    const score = await this.componentScoreModel
      .findById(id)
      .populate('student gradeComponent course');

    if (!score) {
      throw new NotFoundException('Component score not found');
    }

    // Check authorization
    let hasAccess = false;
    if (user.role === UserRole.ADMIN) {
      hasAccess = true;
    } else if (user.role === UserRole.PROFESSOR) {
      hasAccess = (score.course as any).professor._id.toString() === user._id.toString();
    } else {
      hasAccess = score.student._id.toString() === user._id.toString();
    }

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this component score');
    }

    return this.mapToResponseDto(score);
  }

  async updateComponentScore(
    id: string,
    updateComponentScoreDto: UpdateComponentScoreDto,
    user: User
  ): Promise<ComponentScore> {
    const score = await this.componentScoreModel.findById(id).populate('gradeComponent course');

    if (!score) {
      throw new NotFoundException('Component score not found');
    }

    // Only professors can update scores
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.PROFESSOR) {
      throw new ForbiddenException('Only professors can update component scores');
    }

    if (user.role === UserRole.PROFESSOR) {
      if ((score.course as any).professor._id.toString() !== user._id.toString()) {
        throw new ForbiddenException('You can only update scores for your own courses');
      }
    }

    // Validate points earned if provided
    const { pointsEarned } = updateComponentScoreDto;
    if (pointsEarned !== undefined) {
      const gradeComponent = score.gradeComponent as any;
      if (pointsEarned < 0 || pointsEarned > gradeComponent.totalPoints) {
        throw new BadRequestException(
          `Points earned must be between 0 and ${gradeComponent.totalPoints}`
        );
      }
    }

    Object.assign(score, updateComponentScoreDto);
    return score.save();
  }

  async deleteComponentScore(id: string, user: User): Promise<void> {
    const score = await this.componentScoreModel.findById(id).populate('course');

    if (!score) {
      throw new NotFoundException('Component score not found');
    }

    // Only professors can delete scores
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.PROFESSOR) {
      throw new ForbiddenException('Only professors can delete component scores');
    }

    if (user.role === UserRole.PROFESSOR) {
      if ((score.course as any).professor._id.toString() !== user._id.toString()) {
        throw new ForbiddenException('You can only delete scores for your own courses');
      }
    }

    await this.componentScoreModel.findByIdAndDelete(id);
  }

  private mapToResponseDto(score: ComponentScore): ComponentScoreResponseDto {
    return {
      id: score._id?.toString() || (score as any).id?.toString(),
      pointsEarned: score.pointsEarned,
      feedback: score.feedback || '',
      isSubmitted: score.isSubmitted !== undefined ? score.isSubmitted : true,
      isGraded: score.isGraded !== undefined ? score.isGraded : false,
      createdAt: (score as any).createdAt,
      updatedAt: (score as any).updatedAt,
      student:
        score.student && typeof score.student === 'object'
          ? {
              id: (score.student as any)._id?.toString() || (score.student as any).id?.toString(),
              firstName: (score.student as any).firstName,
              lastName: (score.student as any).lastName,
              username: (score.student as any).username
            }
          : undefined,
      gradeComponent:
        score.gradeComponent && typeof score.gradeComponent === 'object'
          ? {
              id:
                (score.gradeComponent as any)._id?.toString() ||
                (score.gradeComponent as any).id?.toString(),
              name: (score.gradeComponent as any).name,
              category: (score.gradeComponent as any).category,
              weight: (score.gradeComponent as any).weight,
              totalPoints: (score.gradeComponent as any).totalPoints,
              minimumScore: (score.gradeComponent as any).minimumScore,
              isMandatory: (score.gradeComponent as any).isMandatory
            }
          : undefined,
      course:
        score.course && typeof score.course === 'object'
          ? {
              id: (score.course as any)._id?.toString() || (score.course as any).id?.toString(),
              code: (score.course as any).code,
              name: (score.course as any).name
            }
          : undefined
    };
  }

  async findByStudent(studentId: string): Promise<ComponentScoreResponseDto[]> {
    const scores = await this.componentScoreModel
      .find({ student: studentId })
      .populate('gradeComponent course')
      .sort({ createdAt: -1 });

    return scores.map(this.mapToResponseDto);
  }

  async findByStudentAndCourse(
    studentId: string,
    courseId: string
  ): Promise<ComponentScoreResponseDto[]> {
    const scores = await this.componentScoreModel
      .find({
        student: studentId,
        course: courseId
      })
      .populate('gradeComponent course')
      .sort({ createdAt: -1 });

    return scores.map(this.mapToResponseDto);
  }

  async findByCourse(courseId: string): Promise<ComponentScoreResponseDto[]> {
    const scores = await this.componentScoreModel
      .find({ course: courseId })
      .populate('student gradeComponent')
      .sort({ createdAt: -1 });

    return scores.map(this.mapToResponseDto);
  }

  async getComponentProgress(studentId: string, courseId: string): Promise<any> {
    const scores = await this.componentScoreModel
      .find({
        student: studentId,
        course: courseId
      })
      .populate('gradeComponent');

    // Calculate progress based on scores
    const progress = {
      totalComponents: scores.length,
      completedComponents: scores.filter((score) => score.pointsEarned > 0).length,
      totalPointsEarned: scores.reduce((sum, score) => sum + score.pointsEarned, 0),
      totalPossiblePoints: scores.reduce((sum, score) => {
        const component = score.gradeComponent as any;
        return sum + (component.totalPoints || 0);
      }, 0)
    };

    (progress as any).percentage =
      progress.totalPossiblePoints > 0
        ? (progress.totalPointsEarned / progress.totalPossiblePoints) * 100
        : 0;

    return progress;
  }
}
