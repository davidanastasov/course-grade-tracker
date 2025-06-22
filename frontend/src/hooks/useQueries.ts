import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { courseService } from "../services/courseService";
import { gradeService } from "../services/gradeService";
import { assignmentService } from "../services/assignmentService";
import { useAuth } from "../contexts/AuthContext";

// Query Keys
export const queryKeys = {
  // Auth
  profile: ["profile"] as const,

  // Courses
  courses: ["courses"] as const,
  course: (id: string) => ["courses", id] as const,
  myCourses: ["courses", "my"] as const,
  enrolledCourses: ["courses", "enrolled"] as const,
  courseEnrollments: (courseId: string) =>
    ["courses", courseId, "enrollments"] as const,
  courseStudents: (courseId: string) =>
    ["courses", courseId, "students"] as const,

  // Grades
  grades: ["grades"] as const,
  myGrades: (courseId?: string) =>
    courseId ? ["grades", "my", courseId] : (["grades", "my"] as const),
  projectedGrade: (courseId: string, studentId?: string) =>
    studentId
      ? ["grades", "projected", courseId, studentId]
      : (["grades", "projected", courseId] as const),
  gradesSummary: (courseId: string) => ["grades", "summary", courseId] as const,
  confirmedGrades: (courseId: string) =>
    ["grades", "confirmed", courseId] as const,

  // Assignments
  assignments: ["assignments"] as const,
  assignment: (id: string) => ["assignments", id] as const,
  courseAssignments: (courseId: string) =>
    ["assignments", "course", courseId] as const,
  myAssignments: ["assignments", "my"] as const,
  assignmentSubmission: (assignmentId: string, studentId?: string) =>
    studentId
      ? ["assignments", assignmentId, "submission", studentId]
      : (["assignments", assignmentId, "submission"] as const),
  assignmentOverview: (assignmentId: string) =>
    ["assignments", assignmentId, "overview"] as const,
  studentProgress: (courseId: string) =>
    ["assignments", "progress", courseId] as const,
};

// Course Hooks
export const useCourses = () => {
  return useQuery({
    queryKey: queryKeys.courses,
    queryFn: courseService.getCourses,
  });
};

export const useMyCourses = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.myCourses,
    queryFn:
      user?.role === "professor"
        ? courseService.getMyCourses
        : courseService.getEnrolledCourses,
    enabled: !!user,
  });
};

export const useCourse = (courseId: string) => {
  return useQuery({
    queryKey: queryKeys.course(courseId),
    queryFn: () => courseService.getCourse(courseId),
    enabled: !!courseId,
  });
};

export const useCourseEnrollments = (courseId: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.courseEnrollments(courseId),
    queryFn: () => courseService.getCourseEnrollments(courseId),
    enabled: !!courseId && user?.role === "professor",
  });
};

export const useCourseStudents = (courseId: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.courseStudents(courseId),
    queryFn: () => courseService.getEnrolledStudents(courseId),
    enabled: !!courseId && user?.role === "professor",
  });
};

// Grade Hooks
export const useMyGrades = (courseId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.myGrades(courseId),
    queryFn: () => gradeService.getMyGrades(courseId),
    enabled: !!user && user.role === "student",
  });
};

export const useProjectedGrade = (courseId: string, studentId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.projectedGrade(courseId, studentId),
    queryFn: () => gradeService.getProjectedGrade(courseId, studentId),
    enabled: !!courseId && !!user,
  });
};

export const useGradesSummary = (courseId: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.gradesSummary(courseId),
    queryFn: () => gradeService.getStudentGradesSummary(courseId),
    enabled: !!courseId && user?.role === "professor",
  });
};

export const useConfirmedGrades = (courseId: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.confirmedGrades(courseId),
    queryFn: () => gradeService.getConfirmedGrades(courseId),
    enabled: !!courseId && user?.role === "professor",
  });
};

// Assignment Hooks
export const useCourseAssignments = (courseId: string) => {
  return useQuery({
    queryKey: queryKeys.courseAssignments(courseId),
    queryFn: () => assignmentService.getAssignments(courseId),
    enabled: !!courseId,
  });
};

export const useAssignment = (assignmentId: string) => {
  return useQuery({
    queryKey: queryKeys.assignment(assignmentId),
    queryFn: () => assignmentService.getAssignment(assignmentId),
    enabled: !!assignmentId,
  });
};

export const useAssignmentSubmission = (
  assignmentId: string,
  studentId?: string
) => {
  return useQuery({
    queryKey: queryKeys.assignmentSubmission(assignmentId, studentId),
    queryFn: () => assignmentService.getSubmission(assignmentId, studentId),
    enabled: !!assignmentId,
  });
};

export const useAssignmentOverview = (assignmentId: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.assignmentOverview(assignmentId),
    queryFn: () => assignmentService.getAssignmentOverview(assignmentId),
    enabled: !!assignmentId && user?.role === "professor",
  });
};

export const useStudentProgress = (courseId: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.studentProgress(courseId),
    queryFn: () => assignmentService.getStudentProgress(courseId),
    enabled: !!courseId && user?.role === "student",
  });
};

// Mutation Hooks
export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: courseService.createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses });
      queryClient.invalidateQueries({ queryKey: queryKeys.myCourses });
    },
  });
};

export const useEnrollInCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: courseService.enrollInCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myCourses });
      queryClient.invalidateQueries({ queryKey: queryKeys.enrolledCourses });
    },
  });
};

export const useSubmitGrade = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: gradeService.submitGrade,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.myGrades(variables.courseId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projectedGrade(variables.courseId),
      });
    },
  });
};

export const useSubmitComponentGrade = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      componentId,
      score,
    }: {
      courseId: string;
      componentId: string;
      score: number;
    }) => gradeService.submitComponentGrade(courseId, componentId, score),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.myGrades(variables.courseId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projectedGrade(variables.courseId),
      });
    },
  });
};

export const useConfirmGrade = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      studentId,
      courseId,
      finalGrade,
      notes,
    }: {
      studentId: string;
      courseId: string;
      finalGrade: number;
      notes?: string;
    }) =>
      gradeService.confirmStudentGrade(studentId, courseId, finalGrade, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.gradesSummary(variables.courseId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.confirmedGrades(variables.courseId),
      });
    },
  });
};

export const useCreateAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignmentService.createAssignment,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.courseAssignments(variables.courseId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.assignments });
    },
  });
};

export const useSubmitAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      assignmentId,
      data,
    }: {
      assignmentId: string;
      data: { notes?: string; file?: File };
    }) => assignmentService.submitAssignment(assignmentId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.assignmentSubmission(variables.assignmentId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.assignmentOverview(variables.assignmentId),
      });
    },
  });
};

export const useMarkAssignmentCompleted = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      assignmentId,
      notes,
    }: {
      assignmentId: string;
      notes?: string;
    }) => assignmentService.markAsCompleted(assignmentId, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.assignmentSubmission(variables.assignmentId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.assignmentOverview(variables.assignmentId),
      });
    },
  });
};

export const useCreateGradeComponent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      data,
    }: {
      courseId: string;
      data: { name: string; weight: number };
    }) => courseService.createGradeComponent(courseId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.course(variables.courseId),
      });
    },
  });
};

export const useCreateGradeBand = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      data,
    }: {
      courseId: string;
      data: { minScore: number; maxScore: number; grade: number };
    }) => courseService.createGradeBand(courseId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.course(variables.courseId),
      });
    },
  });
};
