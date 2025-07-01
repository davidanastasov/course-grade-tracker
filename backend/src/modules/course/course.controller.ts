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
  UploadedFile
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiBadRequestResponse
} from '@nestjs/swagger';

import { CourseService } from './course.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User, UserRole } from '../user/entities/user.entity';
import {
  CreateCourseDto,
  UpdateCourseDto,
  CreateGradeComponentDto,
  CreateGradeBandDto
} from './dto/course.dto';
import { Course } from './entities/course.entity';
import { GradeComponent } from './entities/grade-component.entity';
import { GradeBand } from './entities/grade-band.entity';

@ApiTags('Courses')
@ApiBearerAuth('JWT-auth')
@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CourseController {
  constructor(private courseService: CourseService) {}

  @Post()
  @Roles(UserRole.PROFESSOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new course' })
  @ApiResponse({
    status: 201,
    description: 'Course successfully created',
    type: Course
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiForbiddenResponse({ description: 'Only professors and admins can create courses' })
  async createCourse(
    @Body() createCourseDto: CreateCourseDto,
    @GetUser() user: User
  ): Promise<Course> {
    return this.courseService.createCourse(createCourseDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all courses' })
  @ApiResponse({
    status: 200,
    description: 'List of all active courses',
    type: [Course]
  })
  async findAll(): Promise<Course[]> {
    return this.courseService.findAll();
  }

  @Get('my')
  @Roles(UserRole.PROFESSOR)
  async findMyCourses(@GetUser() user: User): Promise<Course[]> {
    // Use _id if id doesn't exist
    const userId = user._id?.toString() || user.id?.toString();
    return this.courseService.findByProfessor(userId);
  }

  @Get('enrolled')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get enrolled courses for student' })
  @ApiResponse({
    status: 200,
    description: 'List of enrolled courses',
    type: [Course]
  })
  async findEnrolledCourses(@GetUser() user: User): Promise<Course[]> {
    return this.courseService.findEnrolledCourses(user.id);
  }

  @Get(':id/projected-grade/:studentId')
  async getProjectedGrade(
    @Param('id') courseId: string,
    @Param('studentId') studentId: string
  ): Promise<any> {
    return this.courseService.calculateProjectedGrade(courseId, studentId);
  }

  @Get(':id/students')
  @Roles(UserRole.PROFESSOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get students enrolled in a course' })
  @ApiResponse({
    status: 200,
    description: 'List of enrolled students',
    type: [User]
  })
  async getCourseStudents(@Param('id') courseId: string, @GetUser() user: User): Promise<User[]> {
    return this.courseService.getCourseStudents(courseId, user);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<Course> {
    return this.courseService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.PROFESSOR, UserRole.ADMIN)
  async updateCourse(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @GetUser() user: User
  ): Promise<Course> {
    return this.courseService.updateCourse(id, updateCourseDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.PROFESSOR, UserRole.ADMIN)
  async deleteCourse(@Param('id') id: string, @GetUser() user: User): Promise<{ message: string }> {
    await this.courseService.deleteCourse(id, user);
    return { message: 'Course deleted successfully' };
  }

  @Post(':id/upload')
  @Roles(UserRole.PROFESSOR, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('id') courseId: string,
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: User
  ): Promise<{ filePath: string }> {
    return this.courseService.uploadFile(courseId, file, user);
  }

  @Post(':id/grade-components')
  @Roles(UserRole.PROFESSOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Add a grade component to a course' })
  @ApiResponse({
    status: 201,
    description: 'Grade component successfully added',
    type: GradeComponent
  })
  async addGradeComponent(
    @Param('id') courseId: string,
    @Body() componentData: CreateGradeComponentDto,
    @GetUser() user: User
  ): Promise<GradeComponent> {
    return this.courseService.addGradeComponent(courseId, componentData, user);
  }

  @Post(':id/grade-bands')
  @Roles(UserRole.PROFESSOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Add a grade band to a course' })
  @ApiResponse({
    status: 201,
    description: 'Grade band successfully added',
    type: GradeBand
  })
  async addGradeBand(
    @Param('id') courseId: string,
    @Body() bandData: CreateGradeBandDto,
    @GetUser() user: User
  ): Promise<GradeBand> {
    return this.courseService.addGradeBand(courseId, bandData, user);
  }

  @Put(':courseId/grade-components/:componentId')
  @Roles(UserRole.PROFESSOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a grade component' })
  @ApiResponse({
    status: 200,
    description: 'Grade component successfully updated',
    type: GradeComponent
  })
  async updateGradeComponent(
    @Param('courseId') courseId: string,
    @Param('componentId') componentId: string,
    @Body() componentData: CreateGradeComponentDto,
    @GetUser() user: User
  ): Promise<GradeComponent> {
    return this.courseService.updateGradeComponent(courseId, componentId, componentData, user);
  }

  @Delete(':courseId/grade-components/:componentId')
  @Roles(UserRole.PROFESSOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a grade component' })
  @ApiResponse({
    status: 200,
    description: 'Grade component successfully deleted'
  })
  async deleteGradeComponent(
    @Param('courseId') courseId: string,
    @Param('componentId') componentId: string,
    @GetUser() user: User
  ): Promise<{ message: string }> {
    await this.courseService.deleteGradeComponent(courseId, componentId, user);
    return { message: 'Grade component deleted successfully' };
  }

  @Put(':courseId/grade-bands/:bandId')
  @Roles(UserRole.PROFESSOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a grade band' })
  @ApiResponse({
    status: 200,
    description: 'Grade band successfully updated',
    type: GradeBand
  })
  async updateGradeBand(
    @Param('courseId') courseId: string,
    @Param('bandId') bandId: string,
    @Body() bandData: CreateGradeBandDto,
    @GetUser() user: User
  ): Promise<GradeBand> {
    return this.courseService.updateGradeBand(courseId, bandId, bandData, user);
  }

  @Delete(':courseId/grade-bands/:bandId')
  @Roles(UserRole.PROFESSOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a grade band' })
  @ApiResponse({
    status: 200,
    description: 'Grade band successfully deleted'
  })
  async deleteGradeBand(
    @Param('courseId') courseId: string,
    @Param('bandId') bandId: string,
    @GetUser() user: User
  ): Promise<{ message: string }> {
    await this.courseService.deleteGradeBand(courseId, bandId, user);
    return { message: 'Grade band deleted successfully' };
  }
}
