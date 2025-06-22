import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  Max,
  IsEnum
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ComponentType } from '../entities/grade-component.entity';

export class CreateGradeComponentDto {
  @ApiProperty({
    description: 'Name of the grade component',
    example: 'Midterm Exam'
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Type of the grade component',
    enum: ComponentType,
    example: ComponentType.EXAM
  })
  @IsEnum(ComponentType)
  type: ComponentType;

  @ApiProperty({
    description: 'Weight of this component in the final grade (percentage)',
    example: 30,
    minimum: 0,
    maximum: 100
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  weight: number;

  @ApiPropertyOptional({
    description: 'Minimum score required for this component',
    example: 50,
    default: 0,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumScore?: number = 0;
}

export class CreateGradeBandDto {
  @ApiProperty({
    description: 'Minimum score for this grade band',
    example: 50,
    minimum: 0,
    maximum: 100
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  minScore: number;

  @ApiProperty({
    description: 'Maximum score for this grade band',
    example: 59,
    minimum: 0,
    maximum: 100
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  maxScore: number;

  @ApiProperty({
    description: 'Grade value (can be sent as either grade or gradeValue)',
    example: 6.0
  })
  @IsOptional()
  @IsNumber()
  gradeValue?: number;

  @ApiProperty({
    description: 'Grade value (alternative field name for frontend compatibility)',
    example: 6.0
  })
  @IsOptional()
  @IsNumber()
  grade?: number;

  @ApiPropertyOptional({
    description: 'Grade letter representation (will be auto-generated if not provided)',
    example: 'D'
  })
  @IsOptional()
  @IsString()
  gradeLetter?: string;
}

export class CreateCourseDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  credits?: number = 3;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  passingGrade?: number = 50;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGradeComponentDto)
  gradeComponents?: CreateGradeComponentDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGradeBandDto)
  gradeBands?: CreateGradeBandDto[];
}

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  credits?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  passingGrade?: number;
}
