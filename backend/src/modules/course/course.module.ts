import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { Course, CourseSchema } from './entities/course.entity';
import { GradeComponent, GradeComponentSchema } from './entities/grade-component.entity';
import { GradeBand, GradeBandSchema } from './entities/grade-band.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import { Enrollment, EnrollmentSchema } from '../user/entities/enrollment.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema },
      { name: GradeComponent.name, schema: GradeComponentSchema },
      { name: GradeBand.name, schema: GradeBandSchema },
      { name: User.name, schema: UserSchema },
      { name: Enrollment.name, schema: EnrollmentSchema }
    ])
  ],
  controllers: [CourseController],
  providers: [CourseService],
  exports: [CourseService]
})
export class CourseModule {}
