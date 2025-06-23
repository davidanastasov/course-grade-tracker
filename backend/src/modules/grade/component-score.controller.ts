import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ComponentScoreService } from './component-score.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User, UserRole } from '../user/entities/user.entity';
import {
  CreateComponentScoreDto,
  UpdateComponentScoreDto,
  ComponentScoreResponseDto,
  ComponentProgressDto
} from './dto/component-score.dto';
import { ComponentScore } from './entities/component-score.entity';

@ApiTags('component-scores')
@Controller('component-scores')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ComponentScoreController {
  constructor(private componentScoreService: ComponentScoreService) {}

  @Post()
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Submit points for a grade component' })
  @ApiResponse({ status: 201, description: 'Component score created successfully' })
  async createComponentScore(
    @Body() createComponentScoreDto: CreateComponentScoreDto,
    @GetUser() user: User
  ): Promise<ComponentScore> {
    return this.componentScoreService.createComponentScore(createComponentScoreDto, user);
  }

  @Get('my')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get my component scores' })
  @ApiResponse({ status: 200, description: 'Student component scores retrieved' })
  async findMyComponentScores(@GetUser() user: User): Promise<ComponentScoreResponseDto[]> {
    return this.componentScoreService.findByStudent(user.id);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get component scores for a course' })
  @ApiResponse({ status: 200, description: 'Component scores for course retrieved' })
  async findByCourse(
    @Param('courseId') courseId: string,
    @Query('studentId') studentId?: string,
    @GetUser() user?: User
  ): Promise<ComponentScoreResponseDto[]> {
    if (studentId) {
      // If specific student requested, check permissions
      if (user.role === UserRole.STUDENT && studentId !== user.id) {
        throw new Error('Students can only view their own scores');
      }
      return this.componentScoreService.findByStudentAndCourse(studentId, courseId);
    }
    return this.componentScoreService.findByCourse(courseId);
  }

  @Get('progress/:courseId')
  @ApiOperation({ summary: 'Get component progress for a course' })
  @ApiResponse({ status: 200, description: 'Component progress retrieved' })
  async getComponentProgress(
    @Param('courseId') courseId: string,
    @GetUser() user: User,
    @Query('studentId') studentId?: string
  ): Promise<ComponentProgressDto[]> {
    // If no studentId provided, use current user (for students)
    // If studentId provided, verify user has permission (professors/admins)
    const targetStudentId = studentId || user.id;

    if (studentId && user.role === UserRole.STUDENT && studentId !== user.id) {
      throw new Error('Students can only view their own progress');
    }

    return this.componentScoreService.getComponentProgress(targetStudentId, courseId);
  }

  @Get('student/:studentId')
  @Roles(UserRole.ADMIN, UserRole.PROFESSOR)
  @ApiOperation({ summary: 'Get component scores for a student' })
  @ApiResponse({ status: 200, description: 'Student component scores retrieved' })
  async findByStudent(@Param('studentId') studentId: string): Promise<ComponentScoreResponseDto[]> {
    return this.componentScoreService.findByStudent(studentId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a component score' })
  @ApiResponse({ status: 200, description: 'Component score updated successfully' })
  async updateComponentScore(
    @Param('id') id: string,
    @Body() updateComponentScoreDto: UpdateComponentScoreDto,
    @GetUser() user: User
  ): Promise<ComponentScore> {
    return this.componentScoreService.updateComponentScore(id, updateComponentScoreDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a component score' })
  @ApiResponse({ status: 200, description: 'Component score deleted successfully' })
  async deleteComponentScore(
    @Param('id') id: string,
    @GetUser() user: User
  ): Promise<{ message: string }> {
    await this.componentScoreService.deleteComponentScore(id, user);
    return { message: 'Component score deleted successfully' };
  }
}
