import { IsString, IsNumber, IsOptional, IsDateString, IsEnum, Min } from 'class-validator';
import { Transform } from 'class-transformer';
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
  @IsEnum(AssignmentType)
  type?: AssignmentType;

  @IsOptional()
  @Transform(({ value }) => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? value : parsed;
  })
  @IsNumber()
  @Min(0)
  maxScore?: number;

  @IsOptional()
  @Transform(({ value }) => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? value : parsed;
  })
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(AssignmentStatus)
  status?: AssignmentStatus;

  @IsOptional()
  @IsString()
  courseId?: string;
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
