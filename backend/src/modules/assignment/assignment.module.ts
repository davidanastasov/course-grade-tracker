import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AssignmentService } from './assignment.service';
import { AssignmentController } from './assignment.controller';
import { AssignmentSubmissionService } from './assignment-submission.service';
import { AssignmentSubmissionController } from './assignment-submission.controller';
import { Assignment } from './entities/assignment.entity';
import { AssignmentFile } from './entities/assignment-file.entity';
import { AssignmentSubmission } from './entities/assignment-submission.entity';
import { Course } from '../course/entities/course.entity';
import { Enrollment } from '../user/entities/enrollment.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Assignment,
      AssignmentFile,
      AssignmentSubmission,
      Course,
      Enrollment,
      User
    ])
  ],
  controllers: [AssignmentController, AssignmentSubmissionController],
  providers: [AssignmentService, AssignmentSubmissionService],
  exports: [AssignmentService, AssignmentSubmissionService]
})
export class AssignmentModule {}
