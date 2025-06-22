import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Course } from './course.entity';

@Entity('grade_bands')
export class GradeBand {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  minScore: number; // Minimum score for this grade

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  maxScore: number; // Maximum score for this grade

  @Column({ type: 'decimal', precision: 3, scale: 1 })
  gradeValue: number; // Grade value (e.g., 6.0, 7.0, 8.0)

  @Column()
  gradeLetter: string; // Grade letter (e.g., 'F', 'D', 'C', 'B', 'A')

  @ManyToOne(() => Course, (course) => course.gradeBands, {
    onDelete: 'CASCADE'
  })
  course: Course;
}
