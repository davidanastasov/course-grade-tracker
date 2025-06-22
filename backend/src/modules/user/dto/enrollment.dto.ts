import { IsUUID } from 'class-validator';

export class EnrollmentDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  courseId: string;
}
