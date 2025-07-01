import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from '../modules/user/entities/user.entity';
import { Course, CourseDocument } from '../modules/course/entities/course.entity';
import { Assignment, AssignmentDocument } from '../modules/assignment/entities/assignment.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Course.name)
    private readonly courseModel: Model<CourseDocument>,
    @InjectModel(Assignment.name)
    private readonly assignmentModel: Model<AssignmentDocument>
  ) {}

  async runSeeds(): Promise<void> {
    try {
      this.logger.log('Starting database seeding...');

      // Check if data already exists
      const userCount = await this.userModel.countDocuments();
      if (userCount > 0) {
        this.logger.log('Database already contains data, skipping seeding');
        return;
      }

      // Create users
      await this.createUsers();

      // Create courses
      await this.createCourses();

      // Create assignments
      await this.createAssignments();

      this.logger.log('Database seeding completed successfully');
    } catch (error) {
      this.logger.error('Database seeding failed:', error);
      throw error;
    }
  }

  private async createUsers(): Promise<void> {
    this.logger.log('Creating users...');

    const adminPassword = await bcrypt.hash('admin123', 10);
    const professorPassword = await bcrypt.hash('professor123', 10);
    const studentPassword = await bcrypt.hash('student123', 10);

    const users = [
      {
        username: 'admin',
        email: 'admin@university.edu',
        password: adminPassword,
        firstName: 'System',
        lastName: 'Administrator',
        role: UserRole.ADMIN
      },
      {
        username: 'prof.smith',
        email: 'smith@university.edu',
        password: professorPassword,
        firstName: 'John',
        lastName: 'Smith',
        role: UserRole.PROFESSOR
      },
      {
        username: 'prof.jones',
        email: 'jones@university.edu',
        password: professorPassword,
        firstName: 'Sarah',
        lastName: 'Jones',
        role: UserRole.PROFESSOR
      },
      {
        username: 'student1',
        email: 'alice@university.edu',
        password: studentPassword,
        firstName: 'Alice',
        lastName: 'Johnson',
        role: UserRole.STUDENT
      },
      {
        username: 'student2',
        email: 'bob@university.edu',
        password: studentPassword,
        firstName: 'Bob',
        lastName: 'Wilson',
        role: UserRole.STUDENT
      }
    ];

    await this.userModel.insertMany(users);
    this.logger.log(`Created ${users.length} users`);
  }

  private async createCourses(): Promise<void> {
    this.logger.log('Creating courses...');

    const professors = await this.userModel.find({ role: UserRole.PROFESSOR });
    if (professors.length === 0) {
      this.logger.warn('No professors found, skipping course creation');
      return;
    }

    const courses = [
      {
        code: 'CS101',
        name: 'Introduction to Computer Science',
        credits: 3,
        passingGrade: 60,
        professor: professors[0]._id
      },
      {
        code: 'CS201',
        name: 'Data Structures and Algorithms',
        credits: 4,
        passingGrade: 65,
        professor: professors[1]._id || professors[0]._id
      }
    ];

    await this.courseModel.insertMany(courses);
    this.logger.log(`Created ${courses.length} courses`);
  }

  private async createAssignments(): Promise<void> {
    this.logger.log('Creating assignments...');

    const courses = await this.courseModel.find();
    const professors = await this.userModel.find({ role: UserRole.PROFESSOR });

    if (courses.length === 0 || professors.length === 0) {
      this.logger.warn('No courses or professors found, skipping assignment creation');
      return;
    }

    const assignments = [
      {
        title: 'Hello World Program',
        description: 'Write your first program',
        type: 'assignment',
        maxScore: 100,
        weight: 0.1,
        course: courses[0]._id,
        createdBy: professors[0]._id,
        status: 'published'
      },
      {
        title: 'Basic Data Structures',
        description: 'Implement stack and queue',
        type: 'assignment',
        maxScore: 150,
        weight: 0.15,
        course: courses[1]._id || courses[0]._id,
        createdBy: professors[1]._id || professors[0]._id,
        status: 'published'
      }
    ];

    await this.assignmentModel.insertMany(assignments);
    this.logger.log(`Created ${assignments.length} assignments`);
  }
}
