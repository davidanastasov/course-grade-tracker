import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';

import { Assignment, AssignmentStatus } from './entities/assignment.entity';
import { Course } from '../course/entities/course.entity';
import { User, UserRole } from '../user/entities/user.entity';
import {
  CreateAssignmentDto,
  UpdateAssignmentDto,
  AssignmentResponseDto
} from './dto/assignment.dto';

@Injectable()
export class AssignmentService {
  constructor(
    @InjectRepository(Assignment)
    private assignmentRepository: Repository<Assignment>,
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

  async findAll(): Promise<AssignmentResponseDto[]> {
    const assignments = await this.assignmentRepository.find({
      relations: ['course', 'createdBy'],
      order: { createdAt: 'DESC' }
    });

    return assignments.map(this.mapToResponseDto);
  }

  async findById(id: string): Promise<AssignmentResponseDto> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
      relations: ['course', 'createdBy', 'grades', 'grades.student']
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    return this.mapToResponseDto(assignment);
  }

  async findByCourse(courseId: string): Promise<AssignmentResponseDto[]> {
    const assignments = await this.assignmentRepository.find({
      where: { course: { id: courseId } },
      relations: ['course', 'createdBy'],
      order: { dueDate: 'ASC' }
    });

    return assignments.map(this.mapToResponseDto);
  }

  async findByProfessor(professorId: string): Promise<AssignmentResponseDto[]> {
    const assignments = await this.assignmentRepository.find({
      where: { createdBy: { id: professorId } },
      relations: ['course', 'createdBy'],
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
  ): Promise<{ filePath: string }> {
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

    // Update assignment with file path
    assignment.filePath = `/uploads/assignments/${filename}`;
    await this.assignmentRepository.save(assignment);

    return { filePath: assignment.filePath };
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
      filePath: assignment.filePath,
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
