import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Enrollment } from '../../user/entities/enrollment.entity';
import { GradeComponent } from './grade-component.entity';
import { GradeBand } from './grade-band.entity';
import { Assignment } from '../../assignment/entities/assignment.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  code: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', default: 3 })
  credits: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 50.0 })
  passingGrade: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.courses)
  professor: User;

  @OneToMany(() => Enrollment, (enrollment) => enrollment.course)
  enrollments: Enrollment[];

  @OneToMany(() => GradeComponent, (component) => component.course, {
    cascade: true
  })
  gradeComponents: GradeComponent[];

  @OneToMany(() => GradeBand, (band) => band.course, { cascade: true })
  gradeBands: GradeBand[];

  @OneToMany(() => Assignment, (assignment) => assignment.course)
  assignments: Assignment[];

  // Computed properties (not persisted to database)
  enrollmentCount?: number;
  assignmentCount?: number;
}
