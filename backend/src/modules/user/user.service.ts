import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User, UserRole } from './entities/user.entity';
import { Enrollment, EnrollmentStatus } from './entities/enrollment.entity';
import { Course } from '../course/entities/course.entity';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto/user.dto';
import { EnrollmentDto } from './dto/enrollment.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>
  ) {}

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.userRepository.find();
    return users.map(this.mapToResponseDto);
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.mapToResponseDto(user);
  }

  async findStudents(): Promise<UserResponseDto[]> {
    const students = await this.userRepository.find({
      where: { role: UserRole.STUDENT }
    });
    return students.map(this.mapToResponseDto);
  }

  async findProfessors(): Promise<UserResponseDto[]> {
    const professors = await this.userRepository.find({
      where: { role: UserRole.PROFESSOR }
    });
    return professors.map(this.mapToResponseDto);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, updateUserDto);
    const updatedUser = await this.userRepository.save(user);
    return this.mapToResponseDto(updatedUser);
  }

  async enrollStudent(enrollmentDto: EnrollmentDto): Promise<void> {
    const { studentId, courseId } = enrollmentDto;

    // Verify student exists and is a student
    const student = await this.userRepository.findOne({
      where: { id: studentId, role: UserRole.STUDENT }
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Verify course exists
    const course = await this.courseRepository.findOne({
      where: { id: courseId }
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check if already enrolled
    const existingEnrollment = await this.enrollmentRepository.findOne({
      where: {
        student: { id: studentId },
        course: { id: courseId }
      }
    });

    if (existingEnrollment) {
      throw new ConflictException('Student is already enrolled in this course');
    }

    // Create enrollment
    const enrollment = this.enrollmentRepository.create({
      student,
      course,
      status: EnrollmentStatus.ACTIVE
    });

    await this.enrollmentRepository.save(enrollment);
  }

  async getStudentEnrollments(studentId: string): Promise<any[]> {
    const enrollments = await this.enrollmentRepository.find({
      where: { student: { id: studentId } },
      relations: ['course', 'course.professor']
    });

    return enrollments.map((enrollment) => ({
      id: enrollment.id,
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
      course: {
        id: enrollment.course.id,
        code: enrollment.course.code,
        name: enrollment.course.name,
        description: enrollment.course.description,
        credits: enrollment.course.credits,
        professor: {
          id: enrollment.course.professor.id,
          firstName: enrollment.course.professor.firstName,
          lastName: enrollment.course.professor.lastName
        }
      }
    }));
  }

  async dropEnrollment(studentId: string, courseId: string): Promise<void> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: {
        student: { id: studentId },
        course: { id: courseId }
      }
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    enrollment.status = EnrollmentStatus.DROPPED;
    await this.enrollmentRepository.save(enrollment);
  }

  private mapToResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
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
