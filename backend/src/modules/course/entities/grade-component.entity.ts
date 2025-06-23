import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Course } from './course.entity';

export enum ComponentType {
  LAB = 'Lab',
  ASSIGNMENT = 'Assignment',
  MIDTERM = 'Midterm',
  EXAM = 'Exam',
  PROJECT = 'Project'
}

@Entity('grade_components')
export class GradeComponent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    name: 'type', // Database column name
    type: 'enum',
    enum: ComponentType
  })
  category: ComponentType;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  weight: number; // Percentage (e.g., 30.0 for 30%)

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.0 })
  minimumScore: number; // Minimum score required for this component

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 100.0 })
  totalPoints: number; // Total points available for this component

  @Column({ type: 'boolean', default: false })
  isMandatory: boolean; // Whether this component is mandatory for passing

  @ManyToOne(() => Course, (course) => course.gradeComponents, {
    onDelete: 'CASCADE'
  })
  course: Course;
}
