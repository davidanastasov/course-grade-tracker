export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'professor';
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'professor';
}

export interface Course {
  id: string;
  name: string;
  code: string;
  description?: string;
  credits: number;
  passingGrade: number;
  isActive: boolean;
  professor: User;
  gradeComponents: GradeComponent[];
  gradeBands: GradeBand[];
  assignments: Assignment[];
  enrollments?: Enrollment[];
  enrollmentCount?: number;
  assignmentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface GradeComponent {
  id: string;
  name: string;
  category: 'Lab' | 'Assignment' | 'Midterm' | 'Exam' | 'Project';
  type?: 'lab' | 'assignment' | 'quiz' | 'exam' | 'project'; // Legacy field for backward compatibility
  weight: number;
  minimumScore: number;
  totalPoints: number;
  isMandatory: boolean;
  course: Course;
  grades: Grade[];
}

export interface GradeBand {
  id: string;
  minScore: number;
  maxScore: number;
  gradeValue: number;
  course: Course;
}

export interface AssignmentFile {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  type: 'lab' | 'assignment' | 'quiz' | 'exam' | 'project';
  maxScore: number;
  weight: number;
  dueDate?: string;
  status: 'draft' | 'published' | 'completed' | 'graded';
  files: AssignmentFile[];
  course: Course;
  grades: Grade[];
  createdAt: string;
  updatedAt: string;
}

export interface Grade {
  id: string;
  score: number;
  student: User;
  assignment?: Assignment;
  gradeComponent?: GradeComponent;
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  id: string;
  student: User;
  course: Course;
  enrolledAt: string;
}

export interface CreateCourseRequest {
  name: string;
  code: string;
  description?: string;
  credits?: number;
  passingGrade?: number;
  gradeComponents?: {
    name: string;
    category: 'Lab' | 'Assignment' | 'Midterm' | 'Exam' | 'Project';
    weight: number;
    minimumScore: number;
    totalPoints: number;
    isMandatory: boolean;
  }[];
  gradeBands?: {
    minScore: number;
    maxScore: number;
    gradeValue: number;
  }[];
}

export interface CreateGradeComponentRequest {
  name: string;
  category: 'Lab' | 'Assignment' | 'Midterm' | 'Exam' | 'Project';
  weight: number;
  minimumScore: number;
  totalPoints: number;
  isMandatory: boolean;
  courseId: string;
}

export interface CreateGradeBandRequest {
  minScore: number;
  maxScore: number;
  gradeValue: number;
  courseId: string;
}

export interface CreateAssignmentRequest {
  title: string;
  description?: string;
  type: 'lab' | 'assignment' | 'quiz' | 'exam' | 'project';
  maxScore: number;
  weight: number;
  dueDate?: string;
  courseId: string;
}

export interface CreateGradeRequest {
  score: number;
  studentId: string;
  assignmentId?: string;
  gradeComponentId?: string;
}

export interface AssignmentSubmission {
  id: string;
  status: 'SUBMITTED' | 'COMPLETED' | 'DRAFT' | 'GRADED';
  notes?: string;
  submittedAt?: string;
  completedAt?: string;
  isLate: boolean;
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  assignment: {
    id: string;
    title: string;
    dueDate?: string;
    maxScore: number;
  };
}

export interface ComponentScore {
  id: string;
  pointsEarned: number;
  feedback?: string;
  isSubmitted: boolean;
  isGraded: boolean;
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  gradeComponent: {
    id: string;
    name: string;
    category: 'Lab' | 'Assignment' | 'Midterm' | 'Exam' | 'Project';
    weight: number;
    minimumScore: number;
    totalPoints: number;
    isMandatory: boolean;
  };
  course: {
    id: string;
    code: string;
    name: string;
  };
}

export interface ComponentProgress {
  gradeComponent: {
    id: string;
    name: string;
    category: 'Lab' | 'Assignment' | 'Midterm' | 'Exam' | 'Project';
    weight: number;
    minimumScore: number;
    totalPoints: number;
    isMandatory: boolean;
  };
  currentScore: ComponentScore | null;
  progressPercentage: number;
  isPassingMinimum: boolean;
  pointsNeededToPass: number;
}

export interface CreateComponentScoreRequest {
  gradeComponentId: string;
  courseId: string;
  pointsEarned: number;
  feedback?: string;
}

export interface UpdateComponentScoreRequest {
  pointsEarned?: number;
  feedback?: string;
  isSubmitted?: boolean;
  isGraded?: boolean;
}

export interface AssignmentProgress {
  assignment: Assignment;
  submission?: AssignmentSubmission;
  isCompleted: boolean;
  isOverdue: boolean;
}

export interface AssignmentOverview {
  assignment: Assignment;
  totalStudents: number;
  submittedCount: number;
  completedCount: number;
  overdueCount: number;
  submissions: Array<{
    student: {
      id: string;
      firstName: string;
      lastName: string;
      username: string;
    };
    submission?: AssignmentSubmission;
    isCompleted: boolean;
    isOverdue: boolean;
  }>;
}
