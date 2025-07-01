import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User, UserRole, UserDocument } from './entities/user.entity';
import { Enrollment, EnrollmentDocument, EnrollmentStatus } from './entities/enrollment.entity';
import { UpdateUserDto, UserResponseDto } from './dto/user.dto';
import { EnrollmentDto } from './dto/enrollment.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Enrollment.name) private enrollmentModel: Model<EnrollmentDocument>
  ) {}

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.userModel.find().exec();
    return users.map(this.mapToResponseDto);
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.mapToResponseDto(user);
  }

  async findStudents(): Promise<UserResponseDto[]> {
    const students = await this.userModel.find({ role: UserRole.STUDENT }).exec();
    return students.map(this.mapToResponseDto);
  }

  async findProfessors(): Promise<UserResponseDto[]> {
    const professors = await this.userModel.find({ role: UserRole.PROFESSOR }).exec();
    return professors.map(this.mapToResponseDto);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, updateUserDto);
    const updatedUser = await user.save();
    return this.mapToResponseDto(updatedUser);
  }

  async enrollStudent(enrollmentDto: EnrollmentDto): Promise<void> {
    const { studentId, courseId } = enrollmentDto;

    // Check if student exists
    const student = await this.userModel.findById(studentId);
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Check if enrollment already exists
    const existingEnrollment = await this.enrollmentModel.findOne({
      student: studentId,
      course: courseId
    });

    if (existingEnrollment) {
      throw new ConflictException('Student is already enrolled in this course');
    }

    // Create new enrollment
    const enrollment = new this.enrollmentModel({
      student: studentId,
      course: courseId,
      status: EnrollmentStatus.ACTIVE
    });

    await enrollment.save();
  }

  async getStudentEnrollments(studentId: string): Promise<any[]> {
    const enrollments = await this.enrollmentModel
      .find({
        student: studentId,
        status: EnrollmentStatus.ACTIVE
      })
      .populate('course');

    return enrollments.map((enrollment) => ({
      id: enrollment._id?.toString(),
      course: enrollment.course,
      enrolledAt: enrollment.createdAt,
      status: enrollment.status
    }));
  }

  async dropEnrollment(studentId: string, courseId: string, user: User): Promise<void> {
    // Check authorization
    if (user.role === UserRole.STUDENT && user._id.toString() !== studentId) {
      throw new ForbiddenException('Students can only drop their own enrollments');
    }

    const enrollment = await this.enrollmentModel.findOne({
      student: studentId,
      course: courseId,
      status: EnrollmentStatus.ACTIVE
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    enrollment.status = EnrollmentStatus.DROPPED;
    await enrollment.save();
  }

  private mapToResponseDto(user: UserDocument): UserResponseDto {
    return {
      id: user._id?.toString(),
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}
