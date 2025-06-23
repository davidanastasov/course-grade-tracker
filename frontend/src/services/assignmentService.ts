import { apiClient } from '../lib/api';
import type {
  Assignment,
  AssignmentFile,
  AssignmentSubmission,
  AssignmentProgress,
  AssignmentOverview,
  CreateAssignmentRequest
} from '../types/api';

export const assignmentService = {
  // Assignment management
  async getAssignments(courseId?: string): Promise<Assignment[]> {
    const url = courseId ? `/assignments/course/${courseId}` : '/assignments';
    return apiClient.get<Assignment[]>(url);
  },

  async getMyAssignments(): Promise<Assignment[]> {
    return apiClient.get<Assignment[]>('/assignments/my');
  },

  async getAssignment(id: string): Promise<Assignment> {
    return apiClient.get<Assignment>(`/assignments/${id}`);
  },

  async createAssignment(assignmentData: CreateAssignmentRequest): Promise<Assignment> {
    return apiClient.post<Assignment>('/assignments', assignmentData);
  },

  async updateAssignment(
    id: string,
    assignmentData: Partial<CreateAssignmentRequest>
  ): Promise<Assignment> {
    return apiClient.put<Assignment>(`/assignments/${id}`, assignmentData);
  },

  async deleteAssignment(id: string): Promise<void> {
    return apiClient.delete<void>(`/assignments/${id}`);
  },

  // File management
  async uploadFile(assignmentId: string, file: File): Promise<AssignmentFile> {
    return apiClient.uploadFile<AssignmentFile>(`/assignments/${assignmentId}/upload`, file);
  },

  async getAssignmentFiles(assignmentId: string): Promise<AssignmentFile[]> {
    return apiClient.get<AssignmentFile[]>(`/assignments/${assignmentId}/files`);
  },

  async downloadFile(fileId: string): Promise<Blob> {
    const response = await fetch(`http://localhost:3000/api/assignments/files/${fileId}/download`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to download file');
    }

    return response.blob();
  },

  async deleteFile(fileId: string): Promise<void> {
    return apiClient.delete<void>(`/assignments/files/${fileId}`);
  },

  // Assignment status
  async publishAssignment(id: string): Promise<Assignment> {
    return apiClient.patch<Assignment>(`/assignments/${id}/publish`, {});
  },

  // Student assignment submission methods
  async markAsCompleted(assignmentId: string, notes?: string): Promise<AssignmentSubmission> {
    return apiClient.post<AssignmentSubmission>('/assignment-submissions/complete', {
      assignmentId,
      notes
    });
  },

  async submitAssignment(
    assignmentId: string,
    data: {
      notes?: string;
      status?: string;
    }
  ): Promise<AssignmentSubmission> {
    return apiClient.post<AssignmentSubmission>('/assignment-submissions', {
      assignmentId,
      notes: data.notes,
      status: data.status || 'SUBMITTED'
    });
  },

  async updateSubmission(
    submissionId: string,
    data: {
      notes?: string;
      status?: string;
    }
  ): Promise<AssignmentSubmission> {
    return apiClient.put<AssignmentSubmission>(`/assignment-submissions/${submissionId}`, data);
  },

  async getSubmission(
    assignmentId: string,
    studentId?: string
  ): Promise<AssignmentSubmission | null> {
    try {
      const params = new URLSearchParams();
      params.append('assignmentId', assignmentId);
      if (studentId) {
        params.append('studentId', studentId);
      }
      return await apiClient.get<AssignmentSubmission>(
        `/assignment-submissions?${params.toString()}`
      );
    } catch {
      // Return null if no submission found
      return null;
    }
  },

  async getMySubmissions(): Promise<AssignmentSubmission[]> {
    return apiClient.get<AssignmentSubmission[]>('/assignment-submissions/my');
  },

  async getAssignmentSubmissions(assignmentId: string): Promise<AssignmentSubmission[]> {
    return apiClient.get<AssignmentSubmission[]>(
      `/assignment-submissions/assignment/${assignmentId}`
    );
  },

  // Assignment progress for students
  async getStudentProgress(courseId: string): Promise<AssignmentProgress[]> {
    // Get assignments for the course
    const assignments = await this.getAssignments(courseId);

    // Get student's submissions
    const submissions = await this.getMySubmissions();

    // Map assignments with their submission status
    return assignments.map((assignment) => {
      const submission = submissions.find((sub) => sub.assignment.id === assignment.id);

      const isCompleted = submission?.status === 'COMPLETED';
      const isOverdue = assignment.dueDate
        ? new Date() > new Date(assignment.dueDate) && !submission
        : false;

      return {
        assignment,
        submission,
        isCompleted,
        isOverdue
      };
    });
  },

  // Professor assignment overview
  async getAssignmentOverview(assignmentId: string): Promise<AssignmentOverview> {
    // Get assignment details
    const assignment = await this.getAssignment(assignmentId);

    // Get all submissions for this assignment
    const submissions = await this.getAssignmentSubmissions(assignmentId);

    const submittedCount = submissions.filter((sub) => sub.status !== 'DRAFT').length;
    const completedCount = submissions.filter((sub) => sub.status === 'COMPLETED').length;
    const overdueCount = submissions.filter((sub) => sub.isLate).length;

    // Map submissions with status information
    const submissionData = submissions.map((submission) => ({
      student: submission.student,
      submission,
      isCompleted: submission.status === 'COMPLETED',
      isOverdue: submission.isLate
    }));

    return {
      assignment,
      totalStudents: submissionData.length, // This should be improved to get actual enrolled students
      submittedCount,
      completedCount,
      overdueCount,
      submissions: submissionData
    };
  }
};
