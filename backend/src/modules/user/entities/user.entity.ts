import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Enrollment } from './enrollment.entity';
import { Course } from '../../course/entities/course.entity';
import { Assignment } from '../../assignment/entities/assignment.entity';
import { Grade } from '../../grade/entities/grade.entity';

export enum UserRole {
  STUDENT = 'student',
  PROFESSOR = 'professor',
  ADMIN = 'admin'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToMany(() => Enrollment, (enrollment) => enrollment.student)
  enrollments: Enrollment[];

  @OneToMany(() => Course, (course) => course.professor)
  courses: Course[];

  @OneToMany(() => Assignment, (assignment) => assignment.createdBy)
  assignments: Assignment[];

  @OneToMany(() => Grade, (grade) => grade.student)
  grades: Grade[];
}
