import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeedService } from './seed.service';
import { User, UserSchema } from '../modules/user/entities/user.entity';
import { Course, CourseSchema } from '../modules/course/entities/course.entity';
import { Assignment, AssignmentSchema } from '../modules/assignment/entities/assignment.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Course.name, schema: CourseSchema },
      { name: Assignment.name, schema: AssignmentSchema }
    ])
  ],
  providers: [SeedService],
  exports: [SeedService]
})
export class SeedModule {}
