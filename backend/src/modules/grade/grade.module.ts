import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { GradeService } from './grade.service';
import { GradeController } from './grade.controller';
import { ComponentScoreService } from './component-score.service';
import { ComponentScoreController } from './component-score.controller';
import { Grade, GradeSchema } from './entities/grade.entity';
import { ComponentScore, ComponentScoreSchema } from './entities/component-score.entity';
import { Assignment, AssignmentSchema } from '../assignment/entities/assignment.entity';
import { Course, CourseSchema } from '../course/entities/course.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import { Enrollment, EnrollmentSchema } from '../user/entities/enrollment.entity';
import { GradeComponent, GradeComponentSchema } from '../course/entities/grade-component.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Grade.name, schema: GradeSchema },
      { name: ComponentScore.name, schema: ComponentScoreSchema },
      { name: Assignment.name, schema: AssignmentSchema },
      { name: Course.name, schema: CourseSchema },
      { name: User.name, schema: UserSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: GradeComponent.name, schema: GradeComponentSchema }
    ])
  ],
  controllers: [GradeController, ComponentScoreController],
  providers: [GradeService, ComponentScoreService],
  exports: [GradeService, ComponentScoreService]
})
export class GradeModule {}
