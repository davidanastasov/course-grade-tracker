import { apiClient } from '../lib/api';
import type { User } from '../types/api';

export const userService = {
  async getUsers(): Promise<User[]> {
    return apiClient.get<User[]>('/users');
  },

  async getStudents(): Promise<User[]> {
    return apiClient.get<User[]>('/users/students');
  },

  async getProfessors(): Promise<User[]> {
    return apiClient.get<User[]>('/users/professors');
  },

  async getUser(id: string): Promise<User> {
    return apiClient.get<User>(`/users/${id}`);
  },

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    return apiClient.put<User>(`/users/${id}`, userData);
  },

  async updateProfile(userData: Partial<User>): Promise<User> {
    return apiClient.put<User>('/users/profile', userData);
  },

  async deleteUser(id: string): Promise<void> {
    return apiClient.delete<void>(`/users/${id}`);
  },

  async enrollStudent(enrollmentData: {
    courseId: string;
    studentId: string;
  }): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/users/enroll', enrollmentData);
  },

  async getMyEnrollments(): Promise<unknown[]> {
    return apiClient.get<unknown[]>('/users/enrollments/my');
  },

  async getStudentEnrollments(studentId: string): Promise<unknown[]> {
    return apiClient.get<unknown[]>(`/users/${studentId}/enrollments`);
  },

  async removeStudentFromCourse(studentId: string, courseId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/users/enrollments/${studentId}/${courseId}`);
  }
};
