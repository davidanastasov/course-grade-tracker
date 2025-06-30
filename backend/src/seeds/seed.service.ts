import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User, UserRole } from '../modules/user/entities/user.entity';
import { Course } from '../modules/course/entities/course.entity';
import { Assignment } from '../modules/assignment/entities/assignment.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,
    private readonly dataSource: DataSource
  ) {}

  async runSeeds(): Promise<void> {
    try {
      this.logger.log('Starting database seeding...');

      // Check if data already exists
      const userCount = await this.userRepository.count();
      if (userCount > 0) {
        this.logger.log('Database already contains data, skipping seeding');
        return;
      }

      await this.dataSource.transaction(async (manager) => {
        // Create users
        await this.createUsers(manager);

        // Create courses
        await this.createCourses(manager);

        // Create assignments
        await this.createAssignments(manager);
      });

      this.logger.log('Database seeding completed successfully');
    } catch (error) {
      this.logger.error('Database seeding failed:', error);
      throw error;
    }
  }

  private async createUsers(manager: any): Promise<void> {
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

    for (const userData of users) {
      const user = manager.create(User, userData);
      await manager.save(User, user);
    }

    this.logger.log(`Created ${users.length} users`);
  }

  private async createCourses(manager: any): Promise<void> {
    this.logger.log('Creating courses...');

    // This would include course creation logic
    // For now, just log that we would create courses
    this.logger.log('Course creation logic would go here');
  }

  private async createAssignments(manager: any): Promise<void> {
    this.logger.log('Creating assignments...');

    // This would include assignment creation logic
    // For now, just log that we would create assignments
    this.logger.log('Assignment creation logic would go here');
  }
}
