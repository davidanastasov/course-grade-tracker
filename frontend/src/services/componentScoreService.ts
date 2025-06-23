import { apiClient } from '../lib/api';
import type {
  ComponentScore,
  ComponentProgress,
  CreateComponentScoreRequest,
  UpdateComponentScoreRequest
} from '../types/api';

export const componentScoreService = {
  // Submit points for a grade component
  async createComponentScore(data: CreateComponentScoreRequest): Promise<ComponentScore> {
    return apiClient.post<ComponentScore>('/component-scores', data);
  },

  // Get my component scores
  async getMyComponentScores(): Promise<ComponentScore[]> {
    return apiClient.get<ComponentScore[]>('/component-scores/my');
  },

  // Get component scores for a course
  async getComponentScoresByCourse(
    courseId: string,
    studentId?: string
  ): Promise<ComponentScore[]> {
    const url = studentId
      ? `/component-scores/course/${courseId}?studentId=${studentId}`
      : `/component-scores/course/${courseId}`;
    return apiClient.get<ComponentScore[]>(url);
  },

  // Get component progress for a course
  async getComponentProgress(courseId: string, studentId?: string): Promise<ComponentProgress[]> {
    const url = studentId
      ? `/component-scores/progress/${courseId}?studentId=${studentId}`
      : `/component-scores/progress/${courseId}`;
    return apiClient.get<ComponentProgress[]>(url);
  },

  // Get component scores for a student
  async getComponentScoresByStudent(studentId: string): Promise<ComponentScore[]> {
    return apiClient.get<ComponentScore[]>(`/component-scores/student/${studentId}`);
  },

  // Update a component score
  async updateComponentScore(
    id: string,
    data: UpdateComponentScoreRequest
  ): Promise<ComponentScore> {
    return apiClient.put<ComponentScore>(`/component-scores/${id}`, data);
  },

  // Delete a component score
  async deleteComponentScore(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/component-scores/${id}`);
  }
};
