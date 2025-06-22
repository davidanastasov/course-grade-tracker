import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GradeService } from './grade.service';
import { GradeController } from './grade.controller';
import { Grade } from './entities/grade.entity';
import { Assignment } from '../assignment/entities/assignment.entity';
import { Course } from '../course/entities/course.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Grade, Assignment, Course])],
  controllers: [GradeController],
  providers: [GradeService],
  exports: [GradeService]
})
export class GradeModule {}
