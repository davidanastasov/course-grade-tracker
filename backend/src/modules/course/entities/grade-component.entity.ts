import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Course } from './course.entity';

export enum ComponentType {
  THEORY = 'theory',
  LAB = 'lab',
  ASSIGNMENT = 'assignment',
  QUIZ = 'quiz',
  EXAM = 'exam',
  PROJECT = 'project'
}

@Entity('grade_components')
export class GradeComponent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ComponentType
  })
  type: ComponentType;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  weight: number; // Percentage (e.g., 30.0 for 30%)

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.0 })
  minimumScore: number; // Minimum score required for this component

  @ManyToOne(() => Course, (course) => course.gradeComponents, {
    onDelete: 'CASCADE'
  })
  course: Course;
}
