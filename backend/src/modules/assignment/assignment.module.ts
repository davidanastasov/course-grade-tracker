import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AssignmentService } from './assignment.service';
import { AssignmentController } from './assignment.controller';
import { Assignment } from './entities/assignment.entity';
import { Course } from '../course/entities/course.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Assignment, Course])],
  controllers: [AssignmentController],
  providers: [AssignmentService],
  exports: [AssignmentService]
})
export class AssignmentModule {}
