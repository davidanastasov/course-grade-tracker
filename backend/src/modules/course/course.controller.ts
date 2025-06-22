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
  ApiConsumes,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse
} from '@nestjs/swagger';

import { CourseService } from './course.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User, UserRole } from '../user/entities/user.entity';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { Course } from './entities/course.entity';

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
    return this.courseService.findByProfessor(user.id);
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
  async addGradeComponent(
    @Param('id') courseId: string,
    @Body() componentData: any,
    @GetUser() user: User
  ): Promise<any> {
    return this.courseService.addGradeComponent(courseId, componentData, user);
  }

  @Post(':id/grade-bands')
  @Roles(UserRole.PROFESSOR, UserRole.ADMIN)
  async addGradeBand(
    @Param('id') courseId: string,
    @Body() bandData: any,
    @GetUser() user: User
  ): Promise<any> {
    return this.courseService.addGradeBand(courseId, bandData, user);
  }

  @Get(':id/projected-grade/:studentId')
  async getProjectedGrade(
    @Param('id') courseId: string,
    @Param('studentId') studentId: string
  ): Promise<any> {
    return this.courseService.calculateProjectedGrade(courseId, studentId);
  }
}
