import { IsNumber, IsOptional, IsString, IsUUID, IsBoolean, Min } from 'class-validator';

export class CreateComponentScoreDto {
  @IsUUID()
  gradeComponentId: string;

  @IsUUID()
  courseId: string;

  @IsNumber()
  @Min(0)
  pointsEarned: number;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsBoolean()
  isSubmitted?: boolean = true;
}

export class UpdateComponentScoreDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  pointsEarned?: number;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsBoolean()
  isSubmitted?: boolean;

  @IsOptional()
  @IsBoolean()
  isGraded?: boolean;
}

export class ComponentScoreResponseDto {
  id: string;
  pointsEarned: number;
  feedback: string;
  isSubmitted: boolean;
  isGraded: boolean;
  createdAt: Date;
  updatedAt: Date;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  gradeComponent: {
    id: string;
    name: string;
    category: string;
    weight: number;
    minimumScore: number;
    totalPoints: number;
    isMandatory: boolean;
  };
  course: {
    id: string;
    code: string;
    name: string;
  };
}

export class ComponentProgressDto {
  gradeComponent: {
    id: string;
    name: string;
    category: string;
    weight: number;
    minimumScore: number;
    totalPoints: number;
    isMandatory: boolean;
  };
  currentScore: ComponentScoreResponseDto | null;
  progressPercentage: number;
  isPassingMinimum: boolean;
  pointsNeededToPass: number;
}
