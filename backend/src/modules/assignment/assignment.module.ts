import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AssignmentService } from './assignment.service';
import { AssignmentController } from './assignment.controller';
import { AssignmentSubmissionService } from './assignment-submission.service';
import { AssignmentSubmissionController } from './assignment-submission.controller';
import { Assignment, AssignmentSchema } from './entities/assignment.entity';
import { AssignmentFile, AssignmentFileSchema } from './entities/assignment-file.entity';
import {
  AssignmentSubmission,
  AssignmentSubmissionSchema
} from './entities/assignment-submission.entity';
import { Course, CourseSchema } from '../course/entities/course.entity';
import { Enrollment, EnrollmentSchema } from '../user/entities/enrollment.entity';
import { User, UserSchema } from '../user/entities/user.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Assignment.name, schema: AssignmentSchema },
      { name: AssignmentFile.name, schema: AssignmentFileSchema },
      { name: AssignmentSubmission.name, schema: AssignmentSubmissionSchema },
      { name: Course.name, schema: CourseSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: User.name, schema: UserSchema }
    ])
  ],
  controllers: [AssignmentController, AssignmentSubmissionController],
  providers: [AssignmentService, AssignmentSubmissionService],
  exports: [AssignmentService, AssignmentSubmissionService]
})
export class AssignmentModule {}
