import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Assignment } from '../../assignment/entities/assignment.entity';
import { Course } from '../../course/entities/course.entity';

@Entity('grades')
export class Grade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  score: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  maxScore: number;

  @Column({ type: 'text', nullable: true })
  feedback: string;

  @Column({ default: false })
  isSubmitted: boolean;

  @Column({ default: false })
  isGraded: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.grades)
  student: User;

  @ManyToOne(() => Assignment, (assignment) => assignment.grades)
  assignment: Assignment;

  @ManyToOne(() => Course)
  course: Course;
}
