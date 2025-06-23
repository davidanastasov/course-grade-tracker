import { IsEnum, IsOptional, IsString, IsUUID, IsBoolean } from 'class-validator';
import { SubmissionStatus } from '../entities/assignment-submission.entity';

export class CreateSubmissionDto {
  @IsUUID()
  assignmentId: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(SubmissionStatus)
  status?: SubmissionStatus = SubmissionStatus.SUBMITTED;
}

export class UpdateSubmissionDto {
  @IsOptional()
  @IsEnum(SubmissionStatus)
  status?: SubmissionStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class SubmissionResponseDto {
  id: string;
  status: SubmissionStatus;
  notes?: string;
  submittedAt?: Date;
  completedAt?: Date;
  isLate: boolean;
  createdAt: Date;
  updatedAt: Date;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  assignment: {
    id: string;
    title: string;
    dueDate?: Date;
    maxScore: number;
  };
}

export class MarkCompletedDto {
  @IsUUID()
  assignmentId: string;
}
