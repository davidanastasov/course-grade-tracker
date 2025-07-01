import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

import { Assignment, AssignmentStatus, AssignmentDocument } from './entities/assignment.entity';
import { AssignmentFile, AssignmentFileDocument } from './entities/assignment-file.entity';
import { Course, CourseDocument } from '../course/entities/course.entity';
import { User, UserDocument, UserRole } from '../user/entities/user.entity';
import {
  Enrollment,
  EnrollmentDocument,
  EnrollmentStatus
} from '../user/entities/enrollment.entity';
import {
  CreateAssignmentDto,
  UpdateAssignmentDto,
  AssignmentResponseDto,
  AssignmentFileDto
} from './dto/assignment.dto';

@Injectable()
export class AssignmentService {
  constructor(
    @InjectModel(Assignment.name) private assignmentModel: Model<AssignmentDocument>,
    @InjectModel(AssignmentFile.name) private assignmentFileModel: Model<AssignmentFileDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Enrollment.name) private enrollmentModel: Model<EnrollmentDocument>
  ) {}

  async createAssignment(
    createAssignmentDto: CreateAssignmentDto,
    user: User
  ): Promise<Assignment> {
    const { courseId, dueDate, ...assignmentData } = createAssignmentDto;

    // Verify course exists and user has permission
    const course = await this.courseModel.findById(courseId).populate('professor');
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const professorId = (course.professor as any)?._id || course.professor;
    const userId = user._id || user.id;

    if (professorId?.toString() !== userId?.toString() && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only create assignments for your own courses');
    }

    const assignment = new this.assignmentModel({
      ...assignmentData,
      dueDate: dueDate ? new Date(dueDate) : null,
      course: course._id,
      createdBy: user._id,
      status: AssignmentStatus.DRAFT
    });
    return assignment.save();
  }

  async findAll(user: User): Promise<AssignmentResponseDto[]> {
    let assignments: Assignment[];

    if (user.role === UserRole.ADMIN) {
      // Admins can see all assignments
      assignments = await this.assignmentModel
        .find()
        .populate('course createdBy files')
        .sort({ createdAt: -1 });
    } else if (user.role === UserRole.PROFESSOR) {
      // Professors can only see assignments from their own courses
      const courses = await this.courseModel.find({ professor: user._id });
      const courseIds = courses.map((course) => course._id);

      assignments = await this.assignmentModel
        .find({ course: { $in: courseIds } })
        .populate('course createdBy files')
        .sort({ createdAt: -1 });
    } else {
      // Students can only see assignments from courses they're enrolled in
      const enrollments = await this.enrollmentModel
        .find({
          student: user._id,
          status: EnrollmentStatus.ACTIVE
        })
        .populate('course');

      const courseIds = enrollments.map((enrollment) => enrollment.course._id);

      if (courseIds.length === 0) {
        assignments = [];
      } else {
        assignments = await this.assignmentModel
          .find({
            course: { $in: courseIds },
            status: AssignmentStatus.PUBLISHED
          })
          .populate('course createdBy files')
          .sort({ dueDate: 1 });
      }
    }

    return assignments.map(this.mapToResponseDto);
  }

  async findById(id: string, user: User): Promise<AssignmentResponseDto> {
    const assignment = await this.assignmentModel
      .findById(id)
      .populate({
        path: 'course',
        populate: [{ path: 'professor' }, { path: 'enrollments', populate: { path: 'student' } }]
      })
      .populate('createdBy files grades');

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Check authorization
    let hasAccess = false;
    if (user.role === UserRole.ADMIN) {
      hasAccess = true;
    } else if (user.role === UserRole.PROFESSOR) {
      hasAccess = (assignment.course as any).professor._id.toString() === user._id.toString();
    } else if (user.role === UserRole.STUDENT) {
      // Students can only view published assignments from courses they're enrolled in
      const enrollment = await this.enrollmentModel.findOne({
        student: user._id,
        course: assignment.course._id,
        status: EnrollmentStatus.ACTIVE
      });
      hasAccess = assignment.status === AssignmentStatus.PUBLISHED && !!enrollment;
    }

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this assignment');
    }

    return this.mapToResponseDto(assignment);
  }

  async findByCourse(courseId: string, user: User): Promise<AssignmentResponseDto[]> {
    // First verify the user has access to this course
    const course = await this.courseModel.findById(courseId).populate('professor');

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check authorization
    let hasAccess = false;
    if (user.role === UserRole.ADMIN) {
      hasAccess = true;
    } else if (user.role === UserRole.PROFESSOR) {
      // Handle both _id and id fields, and ensure proper comparison
      const professorId = (course.professor as unknown as User)?._id || course.professor;
      const userId = user._id || user.id;
      hasAccess = professorId?.toString() === userId?.toString();
    } else if (user.role === UserRole.STUDENT) {
      // Check if student is actively enrolled
      const userId = user._id || user.id;
      const enrollment = await this.enrollmentModel.findOne({
        student: userId,
        course: courseId,
        status: EnrollmentStatus.ACTIVE
      });
      hasAccess = !!enrollment;
    }

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this course');
    }

    // Build query based on user role - Convert courseId to ObjectId for proper querying
    const query: any = { course: new Types.ObjectId(courseId) };

    // Students should only see published assignments
    if (user.role === UserRole.STUDENT) {
      query.status = AssignmentStatus.PUBLISHED;
    }

    const assignments = await this.assignmentModel
      .find(query)
      .populate('course createdBy files')
      .sort({ dueDate: 1 });

    return assignments.map(this.mapToResponseDto);
  }

  async findByProfessor(professorId: string): Promise<AssignmentResponseDto[]> {
    const assignments = await this.assignmentModel
      .find({ createdBy: professorId })
      .populate('course createdBy files')
      .sort({ createdAt: -1 });

    return assignments.map(this.mapToResponseDto);
  }

  async updateAssignment(
    id: string,
    updateAssignmentDto: UpdateAssignmentDto,
    user: User
  ): Promise<Assignment> {
    const assignment = await this.assignmentModel.findById(id).populate('course createdBy');

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    const createdById = (assignment.createdBy as unknown as User)?._id || assignment.createdBy;
    const userId = user._id || user.id;

    if (createdById?.toString() !== userId?.toString() && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only update your own assignments');
    }

    const { dueDate, ...updateData } = updateAssignmentDto;

    Object.assign(assignment, updateData);
    if (dueDate) {
      assignment.dueDate = new Date(dueDate);
    }

    return assignment.save();
  }

  async deleteAssignment(id: string, user: User): Promise<void> {
    const assignment = await this.assignmentModel.findById(id).populate('createdBy');

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (
      (assignment.createdBy as any)._id.toString() !== user._id.toString() &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('You can only delete your own assignments');
    }

    await this.assignmentModel.findByIdAndDelete(id);
  }

  async uploadAssignmentFile(
    assignmentId: string,
    file: Express.Multer.File,
    user: User
  ): Promise<AssignmentFileDto> {
    const assignment = await this.assignmentModel.findById(assignmentId).populate('createdBy');

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (
      (assignment.createdBy as any)._id.toString() !== user._id.toString() &&
      user.role !== UserRole.ADMIN
    ) {
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
    const assignmentFile = new this.assignmentFileModel({
      originalName: file.originalname,
      fileName: filename,
      filePath: `/uploads/assignments/${filename}`,
      mimeType: file.mimetype,
      size: file.size,
      assignment: assignment._id
    });

    const savedFile = await assignmentFile.save();

    return {
      id: savedFile._id.toString(),
      originalName: savedFile.originalName,
      fileName: savedFile.fileName,
      mimeType: savedFile.mimeType,
      size: savedFile.size,
      uploadedAt: savedFile.uploadedAt
    };
  }

  async publishAssignment(id: string, user: User): Promise<Assignment> {
    const assignment = await this.assignmentModel.findById(id).populate('createdBy');

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (
      (assignment.createdBy as any)._id.toString() !== user._id.toString() &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('You can only publish your own assignments');
    }

    assignment.status = AssignmentStatus.PUBLISHED;
    return assignment.save();
  }

  async downloadAssignmentFile(
    fileId: string,
    user: User
  ): Promise<{ filePath: string; fileName: string }> {
    const assignmentFile = await this.assignmentFileModel.findById(fileId).populate({
      path: 'assignment',
      populate: {
        path: 'course',
        populate: [{ path: 'professor' }, { path: 'enrollments', populate: { path: 'student' } }]
      }
    });

    if (!assignmentFile) {
      throw new NotFoundException('Assignment file not found');
    }

    const assignment = assignmentFile.assignment as any;

    // Check if user has access to this assignment
    let hasAccess = false;
    if (user.role === UserRole.ADMIN) {
      hasAccess = true;
    } else if (user.role === UserRole.PROFESSOR) {
      hasAccess = assignment.course.professor._id.toString() === user._id.toString();
    } else if (user.role === UserRole.STUDENT) {
      // Check if student is enrolled
      const enrollment = await this.enrollmentModel.findOne({
        student: user._id,
        course: assignment.course._id,
        status: EnrollmentStatus.ACTIVE
      });
      hasAccess = assignment.status === AssignmentStatus.PUBLISHED && !!enrollment;
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
    const assignmentFile = await this.assignmentFileModel.findById(fileId).populate({
      path: 'assignment',
      populate: { path: 'createdBy' }
    });

    if (!assignmentFile) {
      throw new NotFoundException('Assignment file not found');
    }

    if (
      (assignmentFile.assignment as any).createdBy._id.toString() !== user._id.toString() &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('You can only delete files from your own assignments');
    }

    // Delete physical file
    const fullPath = path.join(process.cwd(), assignmentFile.filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    // Delete database record
    await this.assignmentFileModel.findByIdAndDelete(fileId);

    return { message: 'Assignment file deleted successfully' };
  }

  async getAssignmentFiles(assignmentId: string, user: User): Promise<AssignmentFileDto[]> {
    const assignment = await this.assignmentModel.findById(assignmentId).populate([
      'files',
      {
        path: 'course',
        populate: [{ path: 'professor' }, { path: 'enrollments', populate: { path: 'student' } }]
      }
    ]);

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Check if user has access to this assignment
    let hasAccess = false;
    if (user.role === UserRole.ADMIN) {
      hasAccess = true;
    } else if (user.role === UserRole.PROFESSOR) {
      hasAccess = (assignment.course as any).professor._id.toString() === user._id.toString();
    } else if (user.role === UserRole.STUDENT) {
      // Check if student is enrolled
      const enrollment = await this.enrollmentModel.findOne({
        student: user._id,
        course: assignment.course._id,
        status: EnrollmentStatus.ACTIVE
      });
      hasAccess = assignment.status === AssignmentStatus.PUBLISHED && !!enrollment;
    }

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this assignment');
    }

    // Get populated files
    const files = await this.assignmentFileModel.find({ assignment: assignmentId });

    return files.map((file) => ({
      id: file._id.toString(),
      originalName: file.originalName,
      fileName: file.fileName,
      mimeType: file.mimeType,
      size: file.size,
      uploadedAt: file.uploadedAt
    }));
  }

  private mapToResponseDto(assignment: Assignment): AssignmentResponseDto {
    return {
      id: assignment._id?.toString() || assignment.id?.toString(),
      title: assignment.title,
      description: assignment.description,
      type: assignment.type,
      maxScore: assignment.maxScore,
      weight: assignment.weight,
      dueDate: assignment.dueDate,
      status: assignment.status,
      files: Array.isArray(assignment.files)
        ? assignment.files.map((file: unknown) => {
            // Handle both embedded documents and populated references
            if (typeof file === 'object' && file !== null && '_id' in file) {
              const fileData = file as AssignmentFile;
              return {
                id: fileData._id?.toString() || (fileData as any).id?.toString(),
                originalName: fileData.originalName || '',
                fileName: fileData.fileName || '',
                mimeType: fileData.mimeType || '',
                size: fileData.size || 0,
                uploadedAt: fileData.uploadedAt || new Date()
              };
            } else {
              // It's just an ObjectId
              return {
                id: (file as any).toString(),
                originalName: '',
                fileName: '',
                mimeType: '',
                size: 0,
                uploadedAt: new Date()
              };
            }
          })
        : [],
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
      course: assignment.course
        ? {
            id:
              (assignment.course as unknown as Course)?._id?.toString() ||
              (assignment.course as unknown as Course)?.id?.toString(),
            code: (assignment.course as unknown as Course)?.code || '',
            name: (assignment.course as unknown as Course)?.name || ''
          }
        : null,
      createdBy: assignment.createdBy
        ? {
            id:
              (assignment.createdBy as unknown as User)?._id?.toString() ||
              (assignment.createdBy as unknown as User)?.id?.toString(),
            firstName: (assignment.createdBy as unknown as User)?.firstName || '',
            lastName: (assignment.createdBy as unknown as User)?.lastName || ''
          }
        : null
    };
  }
}
