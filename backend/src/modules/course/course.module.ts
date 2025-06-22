import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { Course } from './entities/course.entity';
import { GradeComponent } from './entities/grade-component.entity';
import { GradeBand } from './entities/grade-band.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Course, GradeComponent, GradeBand])],
  controllers: [CourseController],
  providers: [CourseService],
  exports: [CourseService]
})
export class CourseModule {}
