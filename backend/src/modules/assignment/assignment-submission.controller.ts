import { Controller, Get, Post, Put, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AssignmentSubmissionService } from './assignment-submission.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User, UserRole } from '../user/entities/user.entity';
import {
  CreateSubmissionDto,
  UpdateSubmissionDto,
  SubmissionResponseDto,
  MarkCompletedDto
} from './dto/assignment-submission.dto';
import { AssignmentSubmission } from './entities/assignment-submission.entity';

@ApiTags('Assignment Submissions')
@Controller('assignment-submissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentSubmissionController {
  constructor(private submissionService: AssignmentSubmissionService) {}

  @Post()
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Submit an assignment' })
  @ApiResponse({ status: 201, description: 'Assignment submitted successfully' })
  async createSubmission(
    @Body() createSubmissionDto: CreateSubmissionDto,
    @GetUser() user: User
  ): Promise<AssignmentSubmission> {
    return this.submissionService.createSubmission(createSubmissionDto, user);
  }

  @Post('complete')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Mark assignment as completed' })
  @ApiResponse({ status: 200, description: 'Assignment marked as completed' })
  async markCompleted(
    @Body() markCompletedDto: MarkCompletedDto,
    @GetUser() user: User
  ): Promise<AssignmentSubmission> {
    return this.submissionService.markCompleted(markCompletedDto, user);
  }

  @Get('my')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get my submissions' })
  @ApiResponse({ status: 200, description: 'Student submissions retrieved' })
  async getMySubmissions(@GetUser() user: User): Promise<SubmissionResponseDto[]> {
    return this.submissionService.getSubmissionsByStudent(user.id);
  }

  @Get('assignment/:assignmentId')
  @Roles(UserRole.PROFESSOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all submissions for an assignment' })
  @ApiResponse({ status: 200, description: 'Assignment submissions retrieved' })
  async getSubmissionsByAssignment(
    @Param('assignmentId') assignmentId: string,
    @GetUser() user: User
  ): Promise<SubmissionResponseDto[]> {
    return this.submissionService.getSubmissionsByAssignment(assignmentId, user);
  }

  @Get('student/:studentId')
  @Roles(UserRole.PROFESSOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get submissions for a student' })
  @ApiResponse({ status: 200, description: 'Student submissions retrieved' })
  async getSubmissionsByStudent(
    @Param('studentId') studentId: string,
    @GetUser() user: User
  ): Promise<SubmissionResponseDto[]> {
    return this.submissionService.getSubmissionsByStudent(studentId);
  }

  @Get()
  @ApiOperation({ summary: 'Get submission by student and assignment' })
  @ApiResponse({ status: 200, description: 'Submission retrieved' })
  async getSubmission(
    @Query('studentId') studentId: string,
    @Query('assignmentId') assignmentId: string,
    @GetUser() user: User
  ): Promise<SubmissionResponseDto | null> {
    return this.submissionService.getSubmissionByStudentAndAssignment(
      studentId,
      assignmentId,
      user
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a submission' })
  @ApiResponse({ status: 200, description: 'Submission updated successfully' })
  async updateSubmission(
    @Param('id') id: string,
    @Body() updateSubmissionDto: UpdateSubmissionDto,
    @GetUser() user: User
  ): Promise<AssignmentSubmission> {
    return this.submissionService.updateSubmission(id, updateSubmissionDto, user);
  }
}
