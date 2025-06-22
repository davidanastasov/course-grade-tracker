import { Controller, Get, Put, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

import { UserService } from './user.service';
import { User, UserRole } from './entities/user.entity';
import { UpdateUserDto, UserResponseDto } from './dto/user.dto';
import { EnrollmentDto } from './dto/enrollment.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.PROFESSOR)
  async findAll(): Promise<UserResponseDto[]> {
    return this.userService.findAll();
  }

  @Get('profile')
  async getProfile(@GetUser() user: User): Promise<UserResponseDto> {
    return this.userService.findById(user.id);
  }

  @Get('students')
  @Roles(UserRole.ADMIN, UserRole.PROFESSOR)
  async findStudents(): Promise<UserResponseDto[]> {
    return this.userService.findStudents();
  }

  @Get('professors')
  @Roles(UserRole.ADMIN)
  async findProfessors(): Promise<UserResponseDto[]> {
    return this.userService.findProfessors();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.PROFESSOR)
  async findById(@Param('id') id: string): Promise<UserResponseDto> {
    return this.userService.findById(id);
  }

  @Put('profile')
  async updateProfile(
    @GetUser() user: User,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<UserResponseDto> {
    return this.userService.update(user.id, updateUserDto);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<UserResponseDto> {
    return this.userService.update(id, updateUserDto);
  }

  @Post('enroll')
  async enrollStudent(@Body() enrollmentDto: EnrollmentDto): Promise<{ message: string }> {
    await this.userService.enrollStudent(enrollmentDto);
    return { message: 'Student enrolled successfully' };
  }

  @Get('enrollments/my')
  async getMyEnrollments(@GetUser() user: User): Promise<any[]> {
    return this.userService.getStudentEnrollments(user.id);
  }

  @Get(':studentId/enrollments')
  @Roles(UserRole.ADMIN, UserRole.PROFESSOR)
  async getStudentEnrollments(@Param('studentId') studentId: string): Promise<any[]> {
    return this.userService.getStudentEnrollments(studentId);
  }
}
