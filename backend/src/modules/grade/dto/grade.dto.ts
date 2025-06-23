import { IsNumber, IsOptional, IsString, IsUUID, IsBoolean, Min, Max } from 'class-validator';

export class CreateGradeDto {
  @IsUUID()
  assignmentId: string;

  @IsUUID()
  courseId: string;

  @IsNumber()
  @Min(0)
  score: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxScore?: number;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsBoolean()
  isSubmitted?: boolean = false;
}

export class UpdateGradeDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  score?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxScore?: number;

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

export class GradeResponseDto {
  id: string;
  score: number;
  maxScore: number;
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
  assignment: {
    id: string;
    title: string;
    type: string;
    maxScore: number;
    weight: number;
  };
  course: {
    id: string;
    code: string;
    name: string;
  };
}

export class ProjectedGradeDto {
  courseId: string;
  currentGrade: number;
  projectedGrade: number;
  passingStatus: 'passing' | 'failing' | 'at-risk' | 'unknown';
  gradeBand: {
    gradeValue: number;
  } | null;
  components: {
    id: string;
    name: string;
    category: string;
    weight: number;
    currentScore: number;
    maxPossibleScore: number;
    completedAssignments: number;
    totalAssignments: number;
  }[];
}
