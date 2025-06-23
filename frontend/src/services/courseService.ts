import { apiClient } from '../lib/api';
import type {
  Course,
  CreateCourseRequest,
  CreateGradeComponentRequest,
  CreateGradeBandRequest,
  GradeComponent,
  GradeBand,
  Enrollment,
  User
} from '../types/api';

// Helper function to map legacy 'type' field to 'category'
const mapGradeComponentType = (component: any): GradeComponent => {
  if (component.type && !component.category) {
    // Map legacy type values to category values
    const typeMapping: Record<string, 'Lab' | 'Assignment' | 'Midterm' | 'Exam' | 'Project'> = {
      lab: 'Lab',
      assignment: 'Assignment',
      quiz: 'Midterm', // Quiz maps to Midterm
      exam: 'Exam',
      project: 'Project'
    };

    component.category = typeMapping[component.type] || 'Assignment';
  }
  return component;
};

// Helper function to transform course data
const transformCourseData = (course: any): Course => {
  if (course.gradeComponents) {
    course.gradeComponents = course.gradeComponents.map(mapGradeComponentType);
  }
  return course;
};

export const courseService = {
  // Course management
  async getCourses(): Promise<Course[]> {
    return apiClient.get<Course[]>('/courses');
  },

  async getMyCourses(): Promise<Course[]> {
    return apiClient.get<Course[]>('/courses/my');
  },

  async getEnrolledCourses(): Promise<Course[]> {
    return apiClient.get<Course[]>('/courses/enrolled');
  },

  async getCourse(id: string): Promise<Course> {
    return apiClient.get<Course>(`/courses/${id}`);
  },

  async createCourse(courseData: CreateCourseRequest): Promise<Course> {
    return apiClient.post<Course>('/courses', courseData);
  },

  async updateCourse(id: string, courseData: Partial<CreateCourseRequest>): Promise<Course> {
    return apiClient.put<Course>(`/courses/${id}`, courseData);
  },

  async deleteCourse(id: string): Promise<void> {
    return apiClient.delete<void>(`/courses/${id}`);
  },

  // File management
  async uploadFile(courseId: string, file: File): Promise<{ filePath: string }> {
    return apiClient.uploadFile<{ filePath: string }>(`/courses/${courseId}/upload`, file);
  },

  // Grade components
  async createGradeComponent(
    courseId: string,
    componentData: Omit<CreateGradeComponentRequest, 'courseId'>
  ): Promise<GradeComponent> {
    return apiClient.post<GradeComponent>(`/courses/${courseId}/grade-components`, componentData);
  },

  async updateGradeComponent(
    courseId: string,
    componentId: string,
    componentData: Partial<Omit<CreateGradeComponentRequest, 'courseId'>>
  ): Promise<GradeComponent> {
    return apiClient.put<GradeComponent>(
      `/courses/${courseId}/grade-components/${componentId}`,
      componentData
    );
  },

  async deleteGradeComponent(courseId: string, componentId: string): Promise<void> {
    return apiClient.delete<void>(`/courses/${courseId}/grade-components/${componentId}`);
  },

  // Grade bands
  async createGradeBand(
    courseId: string,
    bandData: Omit<CreateGradeBandRequest, 'courseId'>
  ): Promise<GradeBand> {
    return apiClient.post<GradeBand>(`/courses/${courseId}/grade-bands`, bandData);
  },

  async updateGradeBand(
    courseId: string,
    bandId: string,
    bandData: Partial<Omit<CreateGradeBandRequest, 'courseId'>>
  ): Promise<GradeBand> {
    return apiClient.put<GradeBand>(`/courses/${courseId}/grade-bands/${bandId}`, bandData);
  },

  async deleteGradeBand(courseId: string, bandId: string): Promise<void> {
    return apiClient.delete<void>(`/courses/${courseId}/grade-bands/${bandId}`);
  },

  // Grade projection and tracking
  async getProjectedGrade(
    courseId: string,
    studentId?: string
  ): Promise<{
    projectedGrade: number;
    finalGrade?: number;
    isEligible: boolean;
    completedComponents: string[];
    missingComponents: string[];
    warnings: string[];
  }> {
    const endpoint = studentId
      ? `/courses/${courseId}/projected-grade/${studentId}`
      : `/courses/${courseId}/projected-grade`;
    return apiClient.get(endpoint);
  },

  // Enrollment management
  async enrollInCourse(courseId: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/users/enroll/self', {
      courseId
    });
  },

  async unenrollFromCourse(courseId: string): Promise<void> {
    return apiClient.delete<void>(`/enrollments/${courseId}`);
  },

  async getEnrollments(studentId?: string): Promise<Enrollment[]> {
    if (studentId) {
      return apiClient.get<Enrollment[]>(`/users/${studentId}/enrollments`);
    }
    return apiClient.get<Enrollment[]>('/enrollments/my');
  },

  async getCourseEnrollments(courseId: string): Promise<Enrollment[]> {
    return apiClient.get<Enrollment[]>(`/courses/${courseId}/enrollments`);
  },

  async getEnrolledStudents(courseId: string): Promise<User[]> {
    return apiClient.get<User[]>(`/courses/${courseId}/students`);
  },

  // Course validation
  async validateEligibility(
    courseId: string,
    studentId?: string
  ): Promise<{
    isEligible: boolean;
    requirements: Array<{
      name: string;
      completed: boolean;
      description: string;
    }>;
  }> {
    const endpoint = studentId
      ? `/courses/${courseId}/eligibility/${studentId}`
      : `/courses/${courseId}/eligibility`;
    return apiClient.get(endpoint);
  }
};
