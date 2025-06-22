import { Controller, Get, Put, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

import { UserService } from './user.service';
import { User, UserRole } from './entities/user.entity';
import { UpdateUserDto, UserResponseDto } from './dto/user.dto';
import { EnrollmentDto, SelfEnrollmentDto } from './dto/enrollment.dto';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
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

  @Post('enroll/self')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Self-enroll in a course' })
  @ApiResponse({
    status: 201,
    description: 'Successfully enrolled in course',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Successfully enrolled in course' }
      }
    }
  })
  async enrollSelf(
    @GetUser() user: User,
    @Body() body: SelfEnrollmentDto
  ): Promise<{ message: string }> {
    await this.userService.enrollStudent({
      studentId: user.id,
      courseId: body.courseId
    });
    return { message: 'Successfully enrolled in course' };
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
