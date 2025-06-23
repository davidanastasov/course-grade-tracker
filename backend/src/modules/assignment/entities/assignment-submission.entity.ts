import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Unique
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Assignment } from './assignment.entity';

export enum SubmissionStatus {
  NOT_SUBMITTED = 'not_submitted',
  SUBMITTED = 'submitted',
  COMPLETED = 'completed',
  GRADED = 'graded'
}

@Entity('assignment_submissions')
@Unique(['student', 'assignment'])
export class AssignmentSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: SubmissionStatus,
    default: SubmissionStatus.NOT_SUBMITTED
  })
  status: SubmissionStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ default: false })
  isLate: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, { eager: true })
  student: User;

  @ManyToOne(() => Assignment, { eager: true })
  assignment: Assignment;
}
