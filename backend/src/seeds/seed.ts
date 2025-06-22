import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UserService } from '../modules/user/user.service';
import { CourseService } from '../modules/course/course.service';
import { AssignmentService } from '../modules/assignment/assignment.service';
import { UserRole } from '../modules/user/entities/user.entity';
import { AssignmentType } from '../modules/assignment/entities/assignment.entity';
import { ComponentType } from '../modules/course/entities/grade-component.entity';
import * as bcrypt from 'bcrypt';
import { getRepository } from 'typeorm';
import { User } from '../modules/user/entities/user.entity';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    console.log('Starting database seeding...');

    // Get repositories
    const userRepo = app.get('UserRepository');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = userRepo.create({
      username: 'admin',
      email: 'admin@university.edu',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: UserRole.ADMIN
    });
    await userRepo.save(admin);
    console.log('✓ Created admin user');

    // Create professors
    const profPassword = await bcrypt.hash('prof123', 10);
    const prof1 = userRepo.create({
      username: 'prof.smith',
      email: 'john.smith@university.edu',
      password: profPassword,
      firstName: 'John',
      lastName: 'Smith',
      role: UserRole.PROFESSOR
    });
    await userRepo.save(prof1);

    const prof2 = userRepo.create({
      username: 'prof.johnson',
      email: 'jane.johnson@university.edu',
      password: profPassword,
      firstName: 'Jane',
      lastName: 'Johnson',
      role: UserRole.PROFESSOR
    });
    await userRepo.save(prof2);
    console.log('✓ Created professor users');

    // Create students
    const studentPassword = await bcrypt.hash('student123', 10);
    const students = [];
    for (let i = 1; i <= 10; i++) {
      const student = userRepo.create({
        username: `student${i}`,
        email: `student${i}@university.edu`,
        password: studentPassword,
        firstName: `Student`,
        lastName: `${i}`,
        role: UserRole.STUDENT
      });
      students.push(await userRepo.save(student));
    }
    console.log('✓ Created student users');

    // Create courses using CourseService
    const courseService = app.get(CourseService);

    const course1 = await courseService.createCourse(
      {
        code: 'CS101',
        name: 'Introduction to Computer Science',
        description: 'Basic concepts of computer science and programming',
        credits: 3,
        passingGrade: 60,
        gradeComponents: [
          {
            name: 'Theory Exams',
            type: ComponentType.THEORY,
            weight: 40,
            minimumScore: 50
          },
          {
            name: 'Lab Work',
            type: ComponentType.LAB,
            weight: 30,
            minimumScore: 0
          },
          {
            name: 'Assignments',
            type: ComponentType.ASSIGNMENT,
            weight: 20,
            minimumScore: 0
          },
          {
            name: 'Quizzes',
            type: ComponentType.QUIZ,
            weight: 10,
            minimumScore: 0
          }
        ],
        gradeBands: [
          { minScore: 0, maxScore: 39, gradeValue: 2.0, gradeLetter: 'F' },
          { minScore: 40, maxScore: 49, gradeValue: 3.0, gradeLetter: 'E' },
          { minScore: 50, maxScore: 59, gradeValue: 4.0, gradeLetter: 'D' },
          { minScore: 60, maxScore: 69, gradeValue: 6.0, gradeLetter: 'C' },
          { minScore: 70, maxScore: 79, gradeValue: 7.0, gradeLetter: 'B' },
          { minScore: 80, maxScore: 89, gradeValue: 8.0, gradeLetter: 'A' },
          { minScore: 90, maxScore: 100, gradeValue: 10.0, gradeLetter: 'A+' }
        ]
      },
      prof1
    );

    const course2 = await courseService.createCourse(
      {
        code: 'MATH201',
        name: 'Calculus II',
        description: 'Advanced calculus concepts and applications',
        credits: 4,
        passingGrade: 50,
        gradeComponents: [
          {
            name: 'Midterm Exam',
            type: ComponentType.EXAM,
            weight: 35,
            minimumScore: 40
          },
          {
            name: 'Final Exam',
            type: ComponentType.EXAM,
            weight: 35,
            minimumScore: 40
          },
          {
            name: 'Homework',
            type: ComponentType.ASSIGNMENT,
            weight: 20,
            minimumScore: 0
          },
          {
            name: 'Quizzes',
            type: ComponentType.QUIZ,
            weight: 10,
            minimumScore: 0
          }
        ],
        gradeBands: [
          { minScore: 0, maxScore: 49, gradeValue: 2.0, gradeLetter: 'F' },
          { minScore: 50, maxScore: 59, gradeValue: 6.0, gradeLetter: 'C' },
          { minScore: 60, maxScore: 69, gradeValue: 7.0, gradeLetter: 'B' },
          { minScore: 70, maxScore: 79, gradeValue: 8.0, gradeLetter: 'A' },
          { minScore: 80, maxScore: 100, gradeValue: 10.0, gradeLetter: 'A+' }
        ]
      },
      prof2
    );

    console.log('✓ Created courses with grade components and bands');

    // Create assignments using AssignmentService
    const assignmentService = app.get(AssignmentService);

    await assignmentService.createAssignment(
      {
        title: 'Programming Assignment 1',
        description: 'Basic programming exercises in Python',
        type: AssignmentType.ASSIGNMENT,
        maxScore: 100,
        weight: 10,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
        courseId: course1.id
      },
      prof1
    );

    await assignmentService.createAssignment(
      {
        title: 'Lab 1: Setup and Basic Operations',
        description: 'Setting up development environment and basic operations',
        type: AssignmentType.LAB,
        maxScore: 50,
        weight: 15,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        courseId: course1.id
      },
      prof1
    );

    await assignmentService.createAssignment(
      {
        title: 'Derivatives Quiz',
        description: 'Quiz on basic derivative rules',
        type: AssignmentType.QUIZ,
        maxScore: 25,
        weight: 5,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
        courseId: course2.id
      },
      prof2
    );

    console.log('✓ Created assignments');

    // Enroll students in courses using UserService
    const userService = app.get(UserService);

    // Enroll first 5 students in CS101
    for (let i = 0; i < 5; i++) {
      await userService.enrollStudent({
        studentId: students[i].id,
        courseId: course1.id
      });
    }

    // Enroll last 5 students in MATH201
    for (let i = 5; i < 10; i++) {
      await userService.enrollStudent({
        studentId: students[i].id,
        courseId: course2.id
      });
    }

    // Enroll some students in both courses
    for (let i = 2; i < 4; i++) {
      await userService.enrollStudent({
        studentId: students[i].id,
        courseId: course2.id
      });
    }

    console.log('✓ Enrolled students in courses');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\nSample credentials:');
    console.log('Admin: admin / admin123');
    console.log('Professor: prof.smith / prof123');
    console.log('Student: student1 / student123');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await app.close();
  }
}

seed();
