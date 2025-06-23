import { apiClient } from '../lib/api';
import type { Grade, CreateGradeRequest } from '../types/api';

export interface GradeSubmission {
  score: number;
  gradeComponentId?: string;
  assignmentId?: string;
  courseId: string;
}

export interface GradeConfirmation {
  studentId: string;
  courseId: string;
  finalGrade: number;
  confirmed: boolean;
  notes?: string;
}

export const gradeService = {
  // Student grade management
  async createGrade(gradeData: CreateGradeRequest): Promise<Grade> {
    return apiClient.post<Grade>('/grades', gradeData);
  },

  async getGrades(studentId?: string, courseId?: string): Promise<Grade[]> {
    if (studentId && courseId) {
      return apiClient.get<Grade[]>(`/grades/course/${courseId}?studentId=${studentId}`);
    } else if (studentId) {
      return apiClient.get<Grade[]>(`/grades/student/${studentId}`);
    } else if (courseId) {
      return apiClient.get<Grade[]>(`/grades/course/${courseId}`);
    }
    return apiClient.get<Grade[]>('/grades');
  },

  async getMyGrades(courseId?: string): Promise<Grade[]> {
    const endpoint = courseId ? `/grades/my?courseId=${courseId}` : '/grades/my';
    return apiClient.get<Grade[]>(endpoint);
  },

  async getGrade(id: string): Promise<Grade> {
    return apiClient.get<Grade>(`/grades/${id}`);
  },

  // Student self-reporting grades
  async submitGrade(gradeData: GradeSubmission): Promise<Grade> {
    return apiClient.post<Grade>('/grades', gradeData);
  },

  async updateGrade(id: string, gradeData: Partial<CreateGradeRequest>): Promise<Grade> {
    return apiClient.put<Grade>(`/grades/${id}`, gradeData);
  },

  async deleteGrade(id: string): Promise<void> {
    return apiClient.delete<void>(`/grades/${id}`);
  },

  // Grade component submissions
  async submitComponentGrade(courseId: string, componentId: string, score: number): Promise<Grade> {
    return apiClient.post<Grade>('/grades/component', {
      courseId,
      gradeComponentId: componentId,
      score
    });
  },

  async getComponentGrades(
    courseId: string,
    componentId: string,
    studentId?: string
  ): Promise<Grade[]> {
    const endpoint = studentId
      ? `/grades/component/${componentId}?courseId=${courseId}&studentId=${studentId}`
      : `/grades/component/${componentId}?courseId=${courseId}`;
    return apiClient.get<Grade[]>(endpoint);
  },

  // Assignment grade submissions
  async submitAssignmentGrade(assignmentId: string, score: number, notes?: string): Promise<Grade> {
    return apiClient.post<Grade>('/grades/assignment', {
      assignmentId,
      score,
      notes
    });
  },

  // Grade projection
  async getProjectedGrade(
    courseId: string,
    studentId?: string
  ): Promise<{
    projectedGrade: number;
    finalGrade?: number;
    isEligible: boolean;
    completedComponents: Array<{
      componentId: string;
      name: string;
      score: number;
      weight: number;
    }>;
    missingComponents: Array<{
      componentId: string;
      name: string;
      weight: number;
      required: boolean;
    }>;
    warnings: string[];
    canReceiveFinalGrade: boolean;
  }> {
    const endpoint = studentId
      ? `/grades/projected/${courseId}?studentId=${studentId}`
      : `/grades/projected/${courseId}`;
    return apiClient.get(endpoint);
  },

  // Professor grade confirmation
  async confirmStudentGrade(
    studentId: string,
    courseId: string,
    finalGrade: number,
    notes?: string
  ): Promise<GradeConfirmation> {
    return apiClient.post<GradeConfirmation>('/grades/confirm', {
      studentId,
      courseId,
      finalGrade,
      notes,
      confirmed: true
    });
  },

  async getConfirmedGrades(courseId: string): Promise<GradeConfirmation[]> {
    return apiClient.get<GradeConfirmation[]>(`/grades/confirmed/${courseId}`);
  },

  async updateConfirmedGrade(
    confirmationId: string,
    data: Partial<GradeConfirmation>
  ): Promise<GradeConfirmation> {
    return apiClient.put<GradeConfirmation>(`/grades/confirm/${confirmationId}`, data);
  },

  // Batch operations for professors
  async getStudentGradesSummary(courseId: string): Promise<
    Array<{
      student: {
        id: string;
        firstName: string;
        lastName: string;
        username: string;
      };
      projectedGrade: number;
      isEligible: boolean;
      completedComponents: number;
      totalComponents: number;
      finalGrade?: number;
      confirmed: boolean;
    }>
  > {
    return apiClient.get(`/grades/summary/${courseId}`);
  }
};
