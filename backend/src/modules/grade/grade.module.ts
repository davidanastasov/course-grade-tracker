import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GradeService } from './grade.service';
import { GradeController } from './grade.controller';
import { ComponentScoreService } from './component-score.service';
import { ComponentScoreController } from './component-score.controller';
import { Grade } from './entities/grade.entity';
import { ComponentScore } from './entities/component-score.entity';
import { Assignment } from '../assignment/entities/assignment.entity';
import { Course } from '../course/entities/course.entity';
import { User } from '../user/entities/user.entity';
import { Enrollment } from '../user/entities/enrollment.entity';
import { GradeComponent } from '../course/entities/grade-component.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Grade,
      ComponentScore,
      Assignment,
      Course,
      User,
      Enrollment,
      GradeComponent
    ])
  ],
  controllers: [GradeController, ComponentScoreController],
  providers: [GradeService, ComponentScoreService],
  exports: [GradeService, ComponentScoreService]
})
export class GradeModule {}
