import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany
} from 'typeorm';
import { Course } from '../../course/entities/course.entity';
import { User } from '../../user/entities/user.entity';
import { Grade } from '../../grade/entities/grade.entity';
import { AssignmentFile } from './assignment-file.entity';

export enum AssignmentType {
  LAB = 'lab',
  ASSIGNMENT = 'assignment',
  QUIZ = 'quiz',
  EXAM = 'exam',
  PROJECT = 'project'
}

export enum AssignmentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  COMPLETED = 'completed',
  GRADED = 'graded'
}

@Entity('assignments')
export class Assignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: AssignmentType
  })
  type: AssignmentType;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  maxScore: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.0 })
  weight: number; // Weight in the overall course grade

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date;

  @Column({
    type: 'enum',
    enum: AssignmentStatus,
    default: AssignmentStatus.DRAFT
  })
  status: AssignmentStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Course, (course) => course.assignments)
  course: Course;

  @ManyToOne(() => User, (user) => user.assignments)
  createdBy: User;

  @OneToMany(() => Grade, (grade) => grade.assignment)
  grades: Grade[];

  @OneToMany(() => AssignmentFile, (file) => file.assignment, { cascade: true })
  files: AssignmentFile[];
}
