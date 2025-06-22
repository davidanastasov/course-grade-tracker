import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Patch,
  Res,
  StreamableFile
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiForbiddenResponse
} from '@nestjs/swagger';
import { Response } from 'express';
import { createReadStream } from 'fs';

import { AssignmentService } from './assignment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User, UserRole } from '../user/entities/user.entity';
import {
  CreateAssignmentDto,
  UpdateAssignmentDto,
  AssignmentResponseDto,
  AssignmentFileDto
} from './dto/assignment.dto';
import { Assignment } from './entities/assignment.entity';

@ApiTags('Assignments')
@ApiBearerAuth('JWT-auth')
@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentController {
  constructor(private assignmentService: AssignmentService) {}

  @Post()
  @Roles(UserRole.PROFESSOR, UserRole.ADMIN)
  async createAssignment(
    @Body() createAssignmentDto: CreateAssignmentDto,
    @GetUser() user: User
  ): Promise<Assignment> {
    return this.assignmentService.createAssignment(createAssignmentDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get assignments based on user role and access' })
  @ApiResponse({
    status: 200,
    description: 'List of assignments the user has access to',
    type: [AssignmentResponseDto]
  })
  async findAll(@GetUser() user: User): Promise<AssignmentResponseDto[]> {
    return this.assignmentService.findAll(user);
  }

  @Get('my')
  @Roles(UserRole.PROFESSOR)
  async findMyAssignments(@GetUser() user: User): Promise<AssignmentResponseDto[]> {
    return this.assignmentService.findByProfessor(user.id);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get assignments for a specific course' })
  @ApiResponse({
    status: 200,
    description: 'List of assignments for the course (filtered by user access)',
    type: [AssignmentResponseDto]
  })
  @ApiForbiddenResponse({ description: 'User does not have access to this course' })
  async findByCourse(
    @Param('courseId') courseId: string,
    @GetUser() user: User
  ): Promise<AssignmentResponseDto[]> {
    return this.assignmentService.findByCourse(courseId, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get assignment by ID' })
  @ApiResponse({
    status: 200,
    description: 'Assignment details',
    type: AssignmentResponseDto
  })
  @ApiForbiddenResponse({ description: 'User does not have access to this assignment' })
  async findById(@Param('id') id: string, @GetUser() user: User): Promise<AssignmentResponseDto> {
    return this.assignmentService.findById(id, user);
  }

  @Put(':id')
  @Roles(UserRole.PROFESSOR, UserRole.ADMIN)
  async updateAssignment(
    @Param('id') id: string,
    @Body() updateAssignmentDto: UpdateAssignmentDto,
    @GetUser() user: User
  ): Promise<Assignment> {
    return this.assignmentService.updateAssignment(id, updateAssignmentDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.PROFESSOR, UserRole.ADMIN)
  async deleteAssignment(
    @Param('id') id: string,
    @GetUser() user: User
  ): Promise<{ message: string }> {
    await this.assignmentService.deleteAssignment(id, user);
    return { message: 'Assignment deleted successfully' };
  }

  @Post(':id/upload')
  @Roles(UserRole.PROFESSOR, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('id') assignmentId: string,
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: User
  ): Promise<AssignmentFileDto> {
    return this.assignmentService.uploadAssignmentFile(assignmentId, file, user);
  }

  @Get(':id/files')
  @ApiOperation({ summary: 'Get all files for an assignment' })
  @ApiResponse({
    status: 200,
    description: 'List of assignment files',
    type: [AssignmentFileDto]
  })
  async getAssignmentFiles(
    @Param('id') assignmentId: string,
    @GetUser() user: User
  ): Promise<AssignmentFileDto[]> {
    return this.assignmentService.getAssignmentFiles(assignmentId, user);
  }

  @Get('files/:fileId/download')
  @ApiOperation({ summary: 'Download assignment file by file ID' })
  @ApiResponse({
    status: 200,
    description: 'Assignment file download'
  })
  @ApiForbiddenResponse({ description: 'User does not have access to this assignment file' })
  async downloadFileById(
    @Param('fileId') fileId: string,
    @GetUser() user: User,
    @Res({ passthrough: true }) res: Response
  ): Promise<StreamableFile> {
    const { filePath, fileName } = await this.assignmentService.downloadAssignmentFile(
      fileId,
      user
    );

    const file = createReadStream(filePath);

    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${fileName}"`
    });

    return new StreamableFile(file);
  }

  @Delete('files/:fileId')
  @Roles(UserRole.PROFESSOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete assignment file' })
  @ApiResponse({
    status: 200,
    description: 'File deleted successfully'
  })
  async deleteFile(
    @Param('fileId') fileId: string,
    @GetUser() user: User
  ): Promise<{ message: string }> {
    return this.assignmentService.deleteAssignmentFile(fileId, user);
  }

  @Patch(':id/publish')
  @Roles(UserRole.PROFESSOR, UserRole.ADMIN)
  async publishAssignment(@Param('id') id: string, @GetUser() user: User): Promise<Assignment> {
    return this.assignmentService.publishAssignment(id, user);
  }

  @Patch(':id/complete')
  @Roles(UserRole.PROFESSOR, UserRole.ADMIN)
  async markAsCompleted(@Param('id') id: string, @GetUser() user: User): Promise<Assignment> {
    return this.assignmentService.markAsCompleted(id, user);
  }
}
