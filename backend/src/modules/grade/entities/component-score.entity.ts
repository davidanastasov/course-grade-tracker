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
import { GradeComponent } from '../../course/entities/grade-component.entity';
import { Course } from '../../course/entities/course.entity';

@Entity('component_scores')
@Unique(['student', 'gradeComponent'])
export class ComponentScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  pointsEarned: number;

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
  @ManyToOne(() => User, { eager: true })
  student: User;

  @ManyToOne(() => GradeComponent, { eager: true })
  gradeComponent: GradeComponent;

  @ManyToOne(() => Course)
  course: Course;
}
