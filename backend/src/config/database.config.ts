import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

// Import all entities
import { User } from '../modules/user/entities/user.entity';
import { Course } from '../modules/course/entities/course.entity';
import { GradeComponent } from '../modules/course/entities/grade-component.entity';
import { GradeBand } from '../modules/course/entities/grade-band.entity';
import { Enrollment } from '../modules/user/entities/enrollment.entity';
import { Assignment } from '../modules/assignment/entities/assignment.entity';
import { AssignmentFile } from '../modules/assignment/entities/assignment-file.entity';
import { Grade } from '../modules/grade/entities/grade.entity';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: this.configService.get<string>('DATABASE_HOST'),
      port: this.configService.get<number>('DATABASE_PORT'),
      username: this.configService.get<string>('DATABASE_USERNAME'),
      password: this.configService.get<string>('DATABASE_PASSWORD'),
      database: this.configService.get<string>('DATABASE_NAME'),
      entities: [
        User,
        Course,
        GradeComponent,
        GradeBand,
        Enrollment,
        Assignment,
        AssignmentFile,
        Grade
      ],
      migrations: ['**/migrations/*.{js,ts}'],
      synchronize: this.configService.get<string>('NODE_ENV') === 'development',
      logging: this.configService.get<string>('NODE_ENV') === 'development',
      ssl:
        this.configService.get<string>('DATABASE_SSL') === 'true'
          ? { rejectUnauthorized: false }
          : false
    };
  }
}

// DataSource for TypeORM CLI
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'password',
  database: process.env.DATABASE_NAME || 'course_grade_tracker',
  entities: [
    User,
    Course,
    GradeComponent,
    GradeBand,
    Enrollment,
    Assignment,
    AssignmentFile,
    Grade
  ],
  migrations: ['**/migrations/*.{js,ts}'],
  synchronize: false
});
