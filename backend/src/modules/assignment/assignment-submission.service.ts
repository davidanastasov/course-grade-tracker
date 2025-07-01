import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  AssignmentSubmission,
  SubmissionStatus,
  AssignmentSubmissionDocument
} from './entities/assignment-submission.entity';
import { Assignment, AssignmentDocument } from './entities/assignment.entity';
import { User, UserDocument, UserRole } from '../user/entities/user.entity';
import {
  Enrollment,
  EnrollmentDocument,
  EnrollmentStatus
} from '../user/entities/enrollment.entity';
import {
  CreateSubmissionDto,
  UpdateSubmissionDto,
  SubmissionResponseDto,
  MarkCompletedDto
} from './dto/assignment-submission.dto';

@Injectable()
export class AssignmentSubmissionService {
  constructor(
    @InjectModel(AssignmentSubmission.name)
    private submissionModel: Model<AssignmentSubmissionDocument>,
    @InjectModel(Assignment.name)
    private assignmentModel: Model<AssignmentDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>
  ) {}

  async createSubmission(
    createSubmissionDto: CreateSubmissionDto,
    student: User
  ): Promise<AssignmentSubmission> {
    const { assignmentId, notes, status } = createSubmissionDto;

    // Verify assignment exists and is published
    const assignment = await this.assignmentModel.findById(assignmentId).populate('course');
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Verify student is enrolled in the course
    const enrollment = await this.enrollmentModel.findOne({
      student: student._id,
      course: assignment.course._id,
      status: EnrollmentStatus.ACTIVE
    });
    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled in this course');
    }

    // Check for existing submission
    const existing = await this.submissionModel.findOne({
      student: student._id,
      assignment: assignment._id
    });
    if (existing) {
      throw new ConflictException('Submission already exists');
    }

    const submission = new this.submissionModel({
      student: student._id,
      assignment: assignment._id,
      notes,
      status: status || SubmissionStatus.NOT_SUBMITTED
    });
    return submission.save();
  }

  async updateSubmission(
    id: string,
    updateSubmissionDto: UpdateSubmissionDto,
    user: User
  ): Promise<AssignmentSubmission> {
    const submission = await this.submissionModel.findById(id).populate([
      'student',
      {
        path: 'assignment',
        populate: {
          path: 'course',
          populate: { path: 'professor' }
        }
      }
    ]);

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    // Students can only update their own submissions
    if (
      user.role === UserRole.STUDENT &&
      (submission.student as any)._id.toString() !== user._id.toString()
    ) {
      throw new ForbiddenException('You can only update your own submissions');
    }

    // Professors can update submissions for their courses
    if (user.role === UserRole.PROFESSOR) {
      const assignment = submission.assignment as any;
      if (
        !assignment.course ||
        !assignment.course.professor ||
        assignment.course.professor._id.toString() !== user._id.toString()
      ) {
        throw new ForbiddenException('You can only update submissions for your own courses');
      }
    }

    Object.assign(submission, updateSubmissionDto);
    return submission.save();
  }

  async markCompleted(
    markCompletedDto: MarkCompletedDto,
    student: User
  ): Promise<AssignmentSubmission> {
    const { assignmentId } = markCompletedDto;

    // Find or create submission
    let submission = await this.submissionModel
      .findOne({
        student: student._id,
        assignment: assignmentId
      })
      .populate([
        {
          path: 'assignment',
          populate: { path: 'course' }
        }
      ]);

    if (!submission) {
      // Create submission if it doesn't exist
      const createDto: CreateSubmissionDto = {
        assignmentId,
        status: SubmissionStatus.COMPLETED
      };
      const newSubmission = await this.createSubmission(createDto, student);
      // repopulate assignment
      submission = await this.submissionModel.findById(newSubmission._id).populate([
        {
          path: 'assignment',
          populate: { path: 'course' }
        }
      ]);
    }

    // Mark as completed
    submission.status = SubmissionStatus.COMPLETED;
    submission.completedAt = new Date();

    if (!submission.submittedAt) {
      submission.submittedAt = new Date();
      // Check if late
      const assignment = submission.assignment as any;
      const dueDate = assignment && assignment.dueDate ? assignment.dueDate : undefined;
      const isLate = dueDate ? new Date() > dueDate : false;
      submission.isLate = isLate;
    }

    return submission.save();
  }

  async getSubmissionsByStudent(studentId: string): Promise<SubmissionResponseDto[]> {
    const submissions = await this.submissionModel
      .find({ student: studentId })
      .populate('student assignment')
      .sort({ createdAt: -1 });
    return submissions.map(this.mapToResponseDto);
  }

  async getSubmissionsByAssignment(
    assignmentId: string,
    user: User
  ): Promise<SubmissionResponseDto[]> {
    // Verify user has access to this assignment
    const assignment = await this.assignmentModel.findById(assignmentId).populate({
      path: 'course',
      populate: { path: 'professor' }
    });
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }
    // Only professors can view all submissions for an assignment
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.PROFESSOR) {
      throw new ForbiddenException('Only professors can view all submissions');
    }

    const populatedCourse = assignment.course as any; // Use any to handle populated object
    if (
      user.role === UserRole.PROFESSOR &&
      (!populatedCourse ||
        !populatedCourse.professor ||
        populatedCourse.professor._id.toString() !== user._id.toString())
    ) {
      throw new ForbiddenException('You can only view submissions for your own courses');
    }
    const submissions = await this.submissionModel
      .find({ assignment: assignmentId })
      .populate('student assignment')
      .sort({ createdAt: -1 });
    return submissions.map(this.mapToResponseDto);
  }

  async getSubmissionByStudentAndAssignment(
    studentId: string,
    assignmentId: string,
    user: User
  ): Promise<SubmissionResponseDto | null> {
    // Students can only view their own submissions
    if (user.role === UserRole.STUDENT && user._id.toString() !== studentId) {
      throw new ForbiddenException('Students can only view their own submissions');
    }
    const submission = await this.submissionModel
      .findOne({
        student: studentId,
        assignment: assignmentId
      })
      .populate('student assignment');
    return submission ? this.mapToResponseDto(submission) : null;
  }

  private mapToResponseDto(submission: AssignmentSubmission): SubmissionResponseDto {
    return {
      id: submission._id?.toString() || (submission as any).id?.toString(),
      status: submission.status,
      notes: submission.notes,
      submittedAt: submission.submittedAt,
      completedAt: submission.completedAt,
      isLate: submission.isLate,
      createdAt: (submission as any).createdAt,
      updatedAt: (submission as any).updatedAt,
      student:
        submission.student &&
        typeof submission.student === 'object' &&
        'firstName' in submission.student
          ? {
              id:
                (submission.student as any)._id?.toString() ||
                (submission.student as any).id?.toString(),
              firstName: (submission.student as any).firstName,
              lastName: (submission.student as any).lastName,
              username: (submission.student as any).username
            }
          : undefined,
      assignment:
        submission.assignment &&
        typeof submission.assignment === 'object' &&
        'title' in submission.assignment
          ? {
              id:
                (submission.assignment as any)._id?.toString() ||
                (submission.assignment as any).id?.toString(),
              title: (submission.assignment as any).title,
              dueDate: (submission.assignment as any).dueDate,
              maxScore: (submission.assignment as any).maxScore
            }
          : undefined
    };
  }
}
