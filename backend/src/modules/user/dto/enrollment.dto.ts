import { IsMongoId } from 'class-validator';

export class EnrollmentDto {
  @IsMongoId()
  studentId: string;

  @IsMongoId()
  courseId: string;
}

export class SelfEnrollmentDto {
  @IsMongoId()
  courseId: string;
}
