import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { User } from '../modules/user/entities/user.entity';
import { Course } from '../modules/course/entities/course.entity';
import { Assignment } from '../modules/assignment/entities/assignment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Course, Assignment])],
  providers: [SeedService],
  exports: [SeedService]
})
export class SeedModule {}
