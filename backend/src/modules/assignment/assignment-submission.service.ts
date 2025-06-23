import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AssignmentSubmission, SubmissionStatus } from './entities/assignment-submission.entity';
import { Assignment } from './entities/assignment.entity';
import { User, UserRole } from '../user/entities/user.entity';
import { Enrollment, EnrollmentStatus } from '../user/entities/enrollment.entity';
import {
  CreateSubmissionDto,
  UpdateSubmissionDto,
  SubmissionResponseDto,
  MarkCompletedDto
} from './dto/assignment-submission.dto';

@Injectable()
export class AssignmentSubmissionService {
  constructor(
    @InjectRepository(AssignmentSubmission)
    private submissionRepository: Repository<AssignmentSubmission>,
    @InjectRepository(Assignment)
    private assignmentRepository: Repository<Assignment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>
  ) {}

  async createSubmission(
    createSubmissionDto: CreateSubmissionDto,
    student: User
  ): Promise<AssignmentSubmission> {
    const { assignmentId, notes, status } = createSubmissionDto;

    // Verify assignment exists and is published
    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
      relations: ['course']
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Verify student is enrolled in the course
    const enrollment = await this.enrollmentRepository.findOne({
      where: {
        student: { id: student.id },
        course: { id: assignment.course.id },
        status: EnrollmentStatus.ACTIVE
      }
    });

    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled in this course');
    }

    // Check if submission already exists
    const existingSubmission = await this.submissionRepository.findOne({
      where: {
        student: { id: student.id },
        assignment: { id: assignmentId }
      }
    });

    if (existingSubmission) {
      throw new ConflictException('Submission already exists for this assignment');
    }

    // Check if submission is late
    const now = new Date();
    const isLate = assignment.dueDate ? now > assignment.dueDate : false;

    // Create submission
    const submission = this.submissionRepository.create({
      student,
      assignment,
      status: status || SubmissionStatus.SUBMITTED,
      notes,
      submittedAt: now,
      isLate
    });

    return this.submissionRepository.save(submission);
  }

  async updateSubmission(
    id: string,
    updateSubmissionDto: UpdateSubmissionDto,
    user: User
  ): Promise<AssignmentSubmission> {
    const submission = await this.submissionRepository.findOne({
      where: { id },
      relations: ['student', 'assignment']
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    // Students can only update their own submissions
    if (user.role === UserRole.STUDENT && submission.student.id !== user.id) {
      throw new ForbiddenException('You can only update your own submissions');
    }

    // Professors can update submissions for their courses
    if (user.role === UserRole.PROFESSOR) {
      const assignment = await this.assignmentRepository.findOne({
        where: { id: submission.assignment.id },
        relations: ['course', 'course.professor']
      });

      if (assignment.course.professor.id !== user.id) {
        throw new ForbiddenException('You can only update submissions for your own courses');
      }
    }

    Object.assign(submission, updateSubmissionDto);
    return this.submissionRepository.save(submission);
  }

  async markCompleted(
    markCompletedDto: MarkCompletedDto,
    student: User
  ): Promise<AssignmentSubmission> {
    const { assignmentId } = markCompletedDto;

    // Find or create submission
    let submission = await this.submissionRepository.findOne({
      where: {
        student: { id: student.id },
        assignment: { id: assignmentId }
      },
      relations: ['assignment', 'assignment.course']
    });

    if (!submission) {
      // Create submission if it doesn't exist
      const createDto: CreateSubmissionDto = {
        assignmentId,
        status: SubmissionStatus.COMPLETED
      };
      submission = await this.createSubmission(createDto, student);
    }

    // Mark as completed
    submission.status = SubmissionStatus.COMPLETED;
    submission.completedAt = new Date();

    if (!submission.submittedAt) {
      submission.submittedAt = new Date();
      // Check if late
      const isLate = submission.assignment.dueDate
        ? new Date() > submission.assignment.dueDate
        : false;
      submission.isLate = isLate;
    }

    return this.submissionRepository.save(submission);
  }

  async getSubmissionsByStudent(studentId: string): Promise<SubmissionResponseDto[]> {
    const submissions = await this.submissionRepository.find({
      where: { student: { id: studentId } },
      relations: ['student', 'assignment'],
      order: { createdAt: 'DESC' }
    });

    return submissions.map(this.mapToResponseDto);
  }

  async getSubmissionsByAssignment(
    assignmentId: string,
    user: User
  ): Promise<SubmissionResponseDto[]> {
    // Verify user has access to this assignment
    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
      relations: ['course', 'course.professor']
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Only professors can view all submissions for an assignment
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.PROFESSOR) {
      throw new ForbiddenException('Only professors can view all submissions');
    }

    if (user.role === UserRole.PROFESSOR && assignment.course.professor.id !== user.id) {
      throw new ForbiddenException('You can only view submissions for your own courses');
    }

    const submissions = await this.submissionRepository.find({
      where: { assignment: { id: assignmentId } },
      relations: ['student', 'assignment'],
      order: { createdAt: 'DESC' }
    });

    return submissions.map(this.mapToResponseDto);
  }

  async getSubmissionByStudentAndAssignment(
    studentId: string,
    assignmentId: string,
    user: User
  ): Promise<SubmissionResponseDto | null> {
    // Students can only view their own submissions
    if (user.role === UserRole.STUDENT && user.id !== studentId) {
      throw new ForbiddenException('Students can only view their own submissions');
    }

    const submission = await this.submissionRepository.findOne({
      where: {
        student: { id: studentId },
        assignment: { id: assignmentId }
      },
      relations: ['student', 'assignment']
    });

    return submission ? this.mapToResponseDto(submission) : null;
  }

  private mapToResponseDto(submission: AssignmentSubmission): SubmissionResponseDto {
    return {
      id: submission.id,
      status: submission.status,
      notes: submission.notes,
      submittedAt: submission.submittedAt,
      completedAt: submission.completedAt,
      isLate: submission.isLate,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
      student: {
        id: submission.student.id,
        firstName: submission.student.firstName,
        lastName: submission.student.lastName,
        username: submission.student.username
      },
      assignment: {
        id: submission.assignment.id,
        title: submission.assignment.title,
        dueDate: submission.assignment.dueDate,
        maxScore: submission.assignment.maxScore
      }
    };
  }
}
