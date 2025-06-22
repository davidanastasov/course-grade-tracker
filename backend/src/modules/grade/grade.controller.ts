import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

import { GradeService } from './grade.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User, UserRole } from '../user/entities/user.entity';
import {
  CreateGradeDto,
  UpdateGradeDto,
  GradeResponseDto,
  ProjectedGradeDto
} from './dto/grade.dto';
import { Grade } from './entities/grade.entity';

@Controller('grades')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GradeController {
  constructor(private gradeService: GradeService) {}

  @Post()
  @Roles(UserRole.STUDENT)
  async createGrade(@Body() createGradeDto: CreateGradeDto, @GetUser() user: User): Promise<Grade> {
    return this.gradeService.createGrade(createGradeDto, user);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.PROFESSOR)
  async findAll(): Promise<GradeResponseDto[]> {
    return this.gradeService.findAll();
  }

  @Get('my')
  @Roles(UserRole.STUDENT)
  async findMyGrades(@GetUser() user: User): Promise<GradeResponseDto[]> {
    return this.gradeService.findByStudent(user.id);
  }

  @Get('course/:courseId')
  async findByCourse(
    @Param('courseId') courseId: string,
    @Query('studentId') studentId?: string
  ): Promise<GradeResponseDto[]> {
    if (studentId) {
      return this.gradeService.findByStudentAndCourse(studentId, courseId);
    }
    return this.gradeService.findByCourse(courseId);
  }

  @Get('student/:studentId')
  @Roles(UserRole.ADMIN, UserRole.PROFESSOR)
  async findByStudent(@Param('studentId') studentId: string): Promise<GradeResponseDto[]> {
    return this.gradeService.findByStudent(studentId);
  }

  @Get('projected/:courseId')
  async getProjectedGrade(
    @Param('courseId') courseId: string,
    @GetUser() user: User,
    @Query('studentId') studentId?: string
  ): Promise<ProjectedGradeDto> {
    // If no studentId provided, use current user (for students)
    // If studentId provided, verify user has permission (professors/admins)
    const targetStudentId = studentId || user.id;

    if (studentId && user.role === UserRole.STUDENT && studentId !== user.id) {
      throw new Error('Students can only view their own projected grades');
    }

    return this.gradeService.calculateProjectedGrade(targetStudentId, courseId);
  }

  @Get('summary/:courseId')
  @Roles(UserRole.PROFESSOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get grades summary for a course' })
  @ApiResponse({
    status: 200,
    description: 'Grades summary for all students in the course'
  })
  async getGradesSummary(
    @Param('courseId') courseId: string,
    @GetUser() user: User
  ): Promise<any[]> {
    return this.gradeService.getGradesSummary(courseId, user);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<GradeResponseDto> {
    return this.gradeService.findById(id);
  }

  @Put(':id')
  async updateGrade(
    @Param('id') id: string,
    @Body() updateGradeDto: UpdateGradeDto,
    @GetUser() user: User
  ): Promise<Grade> {
    return this.gradeService.updateGrade(id, updateGradeDto, user);
  }

  @Delete(':id')
  async deleteGrade(@Param('id') id: string, @GetUser() user: User): Promise<{ message: string }> {
    await this.gradeService.deleteGrade(id, user);
    return { message: 'Grade deleted successfully' };
  }
}
