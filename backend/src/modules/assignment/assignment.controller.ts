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
  Patch
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { AssignmentService } from './assignment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User, UserRole } from '../user/entities/user.entity';
import {
  CreateAssignmentDto,
  UpdateAssignmentDto,
  AssignmentResponseDto
} from './dto/assignment.dto';
import { Assignment } from './entities/assignment.entity';

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
  async findAll(): Promise<AssignmentResponseDto[]> {
    return this.assignmentService.findAll();
  }

  @Get('my')
  @Roles(UserRole.PROFESSOR)
  async findMyAssignments(@GetUser() user: User): Promise<AssignmentResponseDto[]> {
    return this.assignmentService.findByProfessor(user.id);
  }

  @Get('course/:courseId')
  async findByCourse(@Param('courseId') courseId: string): Promise<AssignmentResponseDto[]> {
    return this.assignmentService.findByCourse(courseId);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<AssignmentResponseDto> {
    return this.assignmentService.findById(id);
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
  ): Promise<{ filePath: string }> {
    return this.assignmentService.uploadAssignmentFile(assignmentId, file, user);
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
