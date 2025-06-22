import { IsString, IsNumber, IsOptional, IsDateString, IsEnum, Min } from 'class-validator';
import { AssignmentType, AssignmentStatus } from '../entities/assignment.entity';

export class CreateAssignmentDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(AssignmentType)
  type: AssignmentType;

  @IsNumber()
  @Min(0)
  maxScore: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number = 0;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsString()
  courseId: string;
}

export class UpdateAssignmentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(AssignmentStatus)
  status?: AssignmentStatus;
}

export class AssignmentResponseDto {
  id: string;
  title: string;
  description: string;
  type: AssignmentType;
  maxScore: number;
  weight: number;
  dueDate: Date;
  status: AssignmentStatus;
  filePath: string;
  createdAt: Date;
  updatedAt: Date;
  course: {
    id: string;
    code: string;
    name: string;
  };
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}
