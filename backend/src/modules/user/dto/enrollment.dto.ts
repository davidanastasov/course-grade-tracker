import { IsUUID } from 'class-validator';

export class EnrollmentDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  courseId: string;
}

export class SelfEnrollmentDto {
  @IsUUID()
  courseId: string;
}
