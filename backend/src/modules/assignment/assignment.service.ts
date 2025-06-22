import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

import { Assignment, AssignmentStatus } from './entities/assignment.entity';
import { AssignmentFile } from './entities/assignment-file.entity';
import { Course } from '../course/entities/course.entity';
import { User, UserRole } from '../user/entities/user.entity';
import { EnrollmentStatus } from '../user/entities/enrollment.entity';
import {
  CreateAssignmentDto,
  UpdateAssignmentDto,
  AssignmentResponseDto,
  AssignmentFileDto
} from './dto/assignment.dto';

@Injectable()
export class AssignmentService {
  constructor(
    @InjectRepository(Assignment)
    private assignmentRepository: Repository<Assignment>,
    @InjectRepository(AssignmentFile)
    private assignmentFileRepository: Repository<AssignmentFile>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>
  ) {}

  async createAssignment(
    createAssignmentDto: CreateAssignmentDto,
    user: User
  ): Promise<Assignment> {
    const { courseId, dueDate, ...assignmentData } = createAssignmentDto;

    // Verify course exists and user has permission
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
      relations: ['professor']
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.professor.id !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only create assignments for your own courses');
    }

    const assignment = this.assignmentRepository.create({
      ...assignmentData,
      dueDate: dueDate ? new Date(dueDate) : null,
      course,
      createdBy: user,
      status: AssignmentStatus.DRAFT
    });

    return this.assignmentRepository.save(assignment);
  }

  async findAll(user: User): Promise<AssignmentResponseDto[]> {
    let assignments: Assignment[];

    if (user.role === UserRole.ADMIN) {
      // Admins can see all assignments
      assignments = await this.assignmentRepository.find({
        relations: ['course', 'createdBy', 'files'],
        order: { createdAt: 'DESC' }
      });
    } else if (user.role === UserRole.PROFESSOR) {
      // Professors can only see assignments from their own courses
      assignments = await this.assignmentRepository.find({
        where: { course: { professor: { id: user.id } } },
        relations: ['course', 'createdBy', 'files'],
        order: { createdAt: 'DESC' }
      });
    } else {
      // Students can only see assignments from courses they're enrolled in
      assignments = await this.assignmentRepository
        .createQueryBuilder('assignment')
        .leftJoinAndSelect('assignment.course', 'course')
        .leftJoinAndSelect('assignment.createdBy', 'createdBy')
        .leftJoinAndSelect('assignment.files', 'files')
        .leftJoinAndSelect('course.enrollments', 'enrollments')
        .where('enrollments.student.id = :studentId', { studentId: user.id })
        .andWhere('enrollments.status = :status', { status: EnrollmentStatus.ACTIVE })
        .andWhere('assignment.status = :assignmentStatus', {
          assignmentStatus: AssignmentStatus.PUBLISHED
        })
        .orderBy('assignment.dueDate', 'ASC')
        .getMany();
    }

    return assignments.map(this.mapToResponseDto);
  }

  async findById(id: string, user: User): Promise<AssignmentResponseDto> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
      relations: [
        'course',
        'course.professor',
        'course.enrollments',
        'course.enrollments.student',
        'createdBy',
        'grades',
        'grades.student',
        'files'
      ]
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Check authorization
    let hasAccess = false;
    if (user.role === UserRole.ADMIN) {
      hasAccess = true;
    } else if (user.role === UserRole.PROFESSOR) {
      hasAccess = assignment.course.professor.id === user.id;
    } else if (user.role === UserRole.STUDENT) {
      // Students can only view published assignments from courses they're enrolled in
      hasAccess =
        assignment.status === AssignmentStatus.PUBLISHED &&
        assignment.course.enrollments.some(
          (enrollment) =>
            enrollment.student.id === user.id && enrollment.status === EnrollmentStatus.ACTIVE
        );
    }

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this assignment');
    }

    return this.mapToResponseDto(assignment);
  }

  async findByCourse(courseId: string, user: User): Promise<AssignmentResponseDto[]> {
    // First verify the user has access to this course
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
      relations: ['professor', 'enrollments', 'enrollments.student']
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check authorization
    let hasAccess = false;
    if (user.role === UserRole.ADMIN) {
      hasAccess = true;
    } else if (user.role === UserRole.PROFESSOR) {
      hasAccess = course.professor.id === user.id;
    } else if (user.role === UserRole.STUDENT) {
      hasAccess = course.enrollments.some(
        (enrollment) =>
          enrollment.student.id === user.id && enrollment.status === EnrollmentStatus.ACTIVE
      );
    }

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this course');
    }

    // Build query based on user role
    const queryBuilder = this.assignmentRepository
      .createQueryBuilder('assignment')
      .leftJoinAndSelect('assignment.course', 'course')
      .leftJoinAndSelect('assignment.createdBy', 'createdBy')
      .leftJoinAndSelect('assignment.files', 'files')
      .where('assignment.course.id = :courseId', { courseId });

    // Students should only see published assignments
    if (user.role === UserRole.STUDENT) {
      queryBuilder.andWhere('assignment.status = :status', { status: AssignmentStatus.PUBLISHED });
    }

    const assignments = await queryBuilder.orderBy('assignment.dueDate', 'ASC').getMany();

    return assignments.map(this.mapToResponseDto);
  }

  async findByProfessor(professorId: string): Promise<AssignmentResponseDto[]> {
    const assignments = await this.assignmentRepository.find({
      where: { createdBy: { id: professorId } },
      relations: ['course', 'createdBy', 'files'],
      order: { createdAt: 'DESC' }
    });

    return assignments.map(this.mapToResponseDto);
  }

  async updateAssignment(
    id: string,
    updateAssignmentDto: UpdateAssignmentDto,
    user: User
  ): Promise<Assignment> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
      relations: ['course', 'createdBy']
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (assignment.createdBy.id !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only update your own assignments');
    }

    const { dueDate, ...updateData } = updateAssignmentDto;

    Object.assign(assignment, updateData);
    if (dueDate) {
      assignment.dueDate = new Date(dueDate);
    }

    return this.assignmentRepository.save(assignment);
  }

  async deleteAssignment(id: string, user: User): Promise<void> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
      relations: ['createdBy']
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (assignment.createdBy.id !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only delete your own assignments');
    }

    await this.assignmentRepository.remove(assignment);
  }

  async uploadAssignmentFile(
    assignmentId: string,
    file: Express.Multer.File,
    user: User
  ): Promise<AssignmentFileDto> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
      relations: ['createdBy']
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (assignment.createdBy.id !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only upload files to your own assignments');
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = './uploads/assignments';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = extname(file.originalname);
    const filename = `${uuidv4()}${fileExtension}`;
    const filePath = `${uploadDir}/${filename}`;

    // Save file
    fs.writeFileSync(filePath, file.buffer);

    // Create assignment file record
    const assignmentFile = this.assignmentFileRepository.create({
      originalName: file.originalname,
      fileName: filename,
      filePath: `/uploads/assignments/${filename}`,
      mimeType: file.mimetype,
      size: file.size,
      assignment
    });

    const savedFile = await this.assignmentFileRepository.save(assignmentFile);

    return {
      id: savedFile.id,
      originalName: savedFile.originalName,
      fileName: savedFile.fileName,
      mimeType: savedFile.mimeType,
      size: savedFile.size,
      uploadedAt: savedFile.uploadedAt
    };
  }

  async publishAssignment(id: string, user: User): Promise<Assignment> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
      relations: ['createdBy']
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (assignment.createdBy.id !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only publish your own assignments');
    }

    assignment.status = AssignmentStatus.PUBLISHED;
    return this.assignmentRepository.save(assignment);
  }

  async markAsCompleted(id: string, user: User): Promise<Assignment> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
      relations: ['createdBy']
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (assignment.createdBy.id !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only mark your own assignments as completed');
    }

    assignment.status = AssignmentStatus.COMPLETED;
    return this.assignmentRepository.save(assignment);
  }

  async downloadAssignmentFile(
    fileId: string,
    user: User
  ): Promise<{ filePath: string; fileName: string }> {
    const assignmentFile = await this.assignmentFileRepository.findOne({
      where: { id: fileId },
      relations: [
        'assignment',
        'assignment.course',
        'assignment.course.professor',
        'assignment.course.enrollments',
        'assignment.course.enrollments.student'
      ]
    });

    if (!assignmentFile) {
      throw new NotFoundException('Assignment file not found');
    }

    const assignment = assignmentFile.assignment;

    // Check if user has access to this assignment using the same logic as findById
    let hasAccess = false;
    if (user.role === UserRole.ADMIN) {
      hasAccess = true;
    } else if (user.role === UserRole.PROFESSOR) {
      hasAccess = assignment.course.professor.id === user.id;
    } else if (user.role === UserRole.STUDENT) {
      // Students can only download files from published assignments from courses they're enrolled in
      hasAccess =
        assignment.status === AssignmentStatus.PUBLISHED &&
        assignment.course.enrollments.some(
          (enrollment) =>
            enrollment.student.id === user.id && enrollment.status === EnrollmentStatus.ACTIVE
        );
    }

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this assignment file');
    }

    // Get the absolute file path
    const fullPath = path.join(process.cwd(), assignmentFile.filePath);

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException('Assignment file not found on server');
    }

    return {
      filePath: fullPath,
      fileName: assignmentFile.originalName
    };
  }

  async deleteAssignmentFile(fileId: string, user: User): Promise<{ message: string }> {
    const assignmentFile = await this.assignmentFileRepository.findOne({
      where: { id: fileId },
      relations: ['assignment', 'assignment.createdBy']
    });

    if (!assignmentFile) {
      throw new NotFoundException('Assignment file not found');
    }

    if (assignmentFile.assignment.createdBy.id !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only delete files from your own assignments');
    }

    // Delete physical file
    const fullPath = path.join(process.cwd(), assignmentFile.filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    // Delete database record
    await this.assignmentFileRepository.remove(assignmentFile);

    return { message: 'Assignment file deleted successfully' };
  }

  async getAssignmentFiles(assignmentId: string, user: User): Promise<AssignmentFileDto[]> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
      relations: [
        'files',
        'course',
        'course.professor',
        'course.enrollments',
        'course.enrollments.student'
      ]
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Check if user has access to this assignment
    let hasAccess = false;
    if (user.role === UserRole.ADMIN) {
      hasAccess = true;
    } else if (user.role === UserRole.PROFESSOR) {
      hasAccess = assignment.course.professor.id === user.id;
    } else if (user.role === UserRole.STUDENT) {
      hasAccess =
        assignment.status === AssignmentStatus.PUBLISHED &&
        assignment.course.enrollments.some(
          (enrollment) =>
            enrollment.student.id === user.id && enrollment.status === EnrollmentStatus.ACTIVE
        );
    }

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this assignment');
    }

    return assignment.files.map((file) => ({
      id: file.id,
      originalName: file.originalName,
      fileName: file.fileName,
      mimeType: file.mimeType,
      size: file.size,
      uploadedAt: file.uploadedAt
    }));
  }

  private mapToResponseDto(assignment: Assignment): AssignmentResponseDto {
    return {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      type: assignment.type,
      maxScore: assignment.maxScore,
      weight: assignment.weight,
      dueDate: assignment.dueDate,
      status: assignment.status,
      files: assignment.files
        ? assignment.files.map((file) => ({
            id: file.id,
            originalName: file.originalName,
            fileName: file.fileName,
            mimeType: file.mimeType,
            size: file.size,
            uploadedAt: file.uploadedAt
          }))
        : [],
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
      course: {
        id: assignment.course.id,
        code: assignment.course.code,
        name: assignment.course.name
      },
      createdBy: {
        id: assignment.createdBy.id,
        firstName: assignment.createdBy.firstName,
        lastName: assignment.createdBy.lastName
      }
    };
  }
}
