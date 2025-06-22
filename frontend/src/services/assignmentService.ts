import { apiClient } from "../lib/api";
import type {
  Assignment,
  AssignmentFile,
  AssignmentSubmission,
  CreateAssignmentRequest,
} from "../types/api";

export const assignmentService = {
  // Assignment management
  async getAssignments(courseId?: string): Promise<Assignment[]> {
    const url = courseId ? `/assignments/course/${courseId}` : "/assignments";
    return apiClient.get<Assignment[]>(url);
  },

  async getMyAssignments(): Promise<Assignment[]> {
    return apiClient.get<Assignment[]>("/assignments/my");
  },

  async getAssignment(id: string): Promise<Assignment> {
    return apiClient.get<Assignment>(`/assignments/${id}`);
  },

  async createAssignment(
    assignmentData: CreateAssignmentRequest
  ): Promise<Assignment> {
    return apiClient.post<Assignment>("/assignments", assignmentData);
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
    return apiClient.uploadFile<AssignmentFile>(
      `/assignments/${assignmentId}/upload`,
      file
    );
  },

  async getAssignmentFiles(assignmentId: string): Promise<AssignmentFile[]> {
    return apiClient.get<AssignmentFile[]>(
      `/assignments/${assignmentId}/files`
    );
  },

  async downloadFile(fileId: string): Promise<Blob> {
    const response = await fetch(
      `http://localhost:3000/api/assignments/files/${fileId}/download`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to download file");
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

  async markAsCompleted(
    id: string,
    notes?: string
  ): Promise<AssignmentSubmission> {
    return apiClient.patch<AssignmentSubmission>(
      `/assignments/${id}/complete`,
      { notes }
    );
  },

  async unmarkCompleted(id: string): Promise<AssignmentSubmission> {
    return apiClient.patch<AssignmentSubmission>(
      `/assignments/${id}/uncomplete`,
      {}
    );
  },

  // Student submissions
  async submitAssignment(
    assignmentId: string,
    data: {
      notes?: string;
      file?: File;
    }
  ): Promise<AssignmentSubmission> {
    if (data.file) {
      // Upload file first
      const fileResult = await this.uploadFile(assignmentId, data.file);
      return apiClient.post<AssignmentSubmission>("/assignments/submit", {
        assignmentId,
        fileId: fileResult.id,
        notes: data.notes,
      });
    }

    return apiClient.post<AssignmentSubmission>("/assignments/submit", {
      assignmentId,
      notes: data.notes,
    });
  },

  async getSubmission(
    assignmentId: string,
    studentId?: string
  ): Promise<AssignmentSubmission | null> {
    const endpoint = studentId
      ? `/assignments/${assignmentId}/submission/${studentId}`
      : `/assignments/${assignmentId}/submission`;

    try {
      return await apiClient.get<AssignmentSubmission>(endpoint);
    } catch {
      // Return null if no submission found
      return null;
    }
  },

  async getAssignmentSubmissions(
    assignmentId: string
  ): Promise<AssignmentSubmission[]> {
    return apiClient.get<AssignmentSubmission[]>(
      `/assignments/${assignmentId}/submissions`
    );
  },

  // Assignment progress for students
  async getStudentProgress(courseId: string): Promise<
    Array<{
      assignment: Assignment;
      submission?: AssignmentSubmission;
      isCompleted: boolean;
      isOverdue: boolean;
    }>
  > {
    return apiClient.get(`/assignments/progress/${courseId}`);
  },

  // Professor assignment overview
  async getAssignmentOverview(assignmentId: string): Promise<{
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
  }> {
    return apiClient.get(`/assignments/${assignmentId}/overview`);
  },

  // Download submission file
  async downloadSubmissionFile(
    assignmentId: string,
    studentId?: string
  ): Promise<Blob> {
    const endpoint = studentId
      ? `/assignments/${assignmentId}/submission/${studentId}/file`
      : `/assignments/${assignmentId}/submission/file`;

    return apiClient.getBlob(endpoint);
  },
};
