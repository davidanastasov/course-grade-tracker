import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GradeService } from './grade.service';
import { GradeController } from './grade.controller';
import { Grade } from './entities/grade.entity';
import { Assignment } from '../assignment/entities/assignment.entity';
import { Course } from '../course/entities/course.entity';
import { User } from '../user/entities/user.entity';
import { Enrollment } from '../user/entities/enrollment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Grade, Assignment, Course, User, Enrollment])],
  controllers: [GradeController],
  providers: [GradeService],
  exports: [GradeService]
})
export class GradeModule {}
