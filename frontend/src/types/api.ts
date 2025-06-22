export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "student" | "professor";
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
  role: "student" | "professor";
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
  enrollments: Enrollment[];
  createdAt: string;
  updatedAt: string;
}

export interface GradeComponent {
  id: string;
  name: string;
  weight: number;
  course: Course;
  grades: Grade[];
}

export interface GradeBand {
  id: string;
  minScore: number;
  maxScore: number;
  grade: number;
  course: Course;
}

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  type: "lab" | "assignment" | "quiz" | "exam" | "project";
  maxScore: number;
  weight: number;
  dueDate?: string;
  status: "draft" | "published" | "completed" | "graded";
  filePath?: string;
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
}

export interface CreateGradeComponentRequest {
  name: string;
  weight: number;
  courseId: string;
}

export interface CreateGradeBandRequest {
  minScore: number;
  maxScore: number;
  grade: number;
  courseId: string;
}

export interface CreateAssignmentRequest {
  title: string;
  description?: string;
  type: "lab" | "assignment" | "quiz" | "exam" | "project";
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
  assignmentId: string;
  studentId?: string;
  filePath?: string;
  notes?: string;
  submittedAt: string;
  isCompleted: boolean;
}
