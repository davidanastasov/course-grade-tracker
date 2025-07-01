import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  Max,
  IsEnum,
  IsBoolean
} from 'class-validator';
import { Type } from 'class-transformer';
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
    description: 'Category of the grade component',
    enum: ComponentType,
    example: ComponentType.EXAM
  })
  @IsEnum(ComponentType)
  category: ComponentType;

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

  @ApiPropertyOptional({
    description: 'Total points available for this component',
    example: 100,
    default: 100,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalPoints?: number = 100;

  @ApiPropertyOptional({
    description: 'Whether this component is mandatory for passing the course',
    example: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean = false;
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
    description: 'Grade value (integer between 5-10)',
    example: 6,
    minimum: 5,
    maximum: 10
  })
  @IsOptional()
  @IsNumber({}, { message: 'Grade value must be a number' })
  @Min(5, { message: 'Grade value must be at least 5' })
  @Max(10, { message: 'Grade value must be at most 10' })
  gradeValue?: number;

  @ApiProperty({
    description:
      'Grade value (alternative field name for frontend compatibility, integer between 5-10)',
    example: 6,
    minimum: 5,
    maximum: 10
  })
  @IsOptional()
  @IsNumber({}, { message: 'Grade must be a number' })
  @Min(5, { message: 'Grade must be at least 5' })
  @Max(10, { message: 'Grade must be at most 10' })
  grade?: number;
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
