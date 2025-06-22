import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import { useAuth } from "../contexts/AuthContext";
import { assignmentService } from "../services/assignmentService";
import type { Assignment, AssignmentSubmission } from "../types/api";

const AssignmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // Submission form state
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadAssignment = async () => {
      if (!id) return;

      try {
        const assignmentData = await assignmentService.getAssignment(id);
        setAssignment(assignmentData);

        // Load submission data for students
        if (user?.role === "student") {
          try {
            const submissionData = await assignmentService.getSubmission(id);
            setSubmission(submissionData);
          } catch {
            // No submission found, that's okay
            setSubmission(null);
          }
        }
      } catch (error) {
        console.error("Failed to load assignment:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAssignment();
  }, [id, user]);

  const handleSubmitAssignment = async () => {
    if (!id) return;

    setIsSubmitting(true);
    try {
      const submissionData = await assignmentService.submitAssignment(id, {
        notes: submissionNotes,
        file: submissionFile || undefined,
      });
      setSubmission(submissionData);
      setSubmissionNotes("");
      setSubmissionFile(null);
      alert("Assignment submitted successfully!");
    } catch (error) {
      console.error("Failed to submit assignment:", error);
      alert("Failed to submit assignment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    setDeleting(true);
    try {
      await assignmentService.deleteAssignment(id);
      navigate("/assignments");
    } catch (error) {
      console.error("Failed to delete assignment:", error);
    } finally {
      setDeleting(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!id) return;

    try {
      await assignmentService.uploadFile(id, file);
      // Reload assignment to get updated file info
      const updatedAssignment = await assignmentService.getAssignment(id);
      setAssignment(updatedAssignment);
    } catch (error) {
      console.error("Failed to upload file:", error);
    }
  };

  const handleFileDownload = async (fileId: string, fileName: string) => {
    try {
      const blob = await assignmentService.downloadFile(fileId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download file:", error);
    }
  };

  const handleFileDelete = async (fileId: string) => {
    if (!id) return;

    try {
      await assignmentService.deleteFile(fileId);
      // Reload assignment to get updated file info
      const updatedAssignment = await assignmentService.getAssignment(id);
      setAssignment(updatedAssignment);
    } catch (error) {
      console.error("Failed to delete file:", error);
    }
  };

  const getStatusBadge = () => {
    if (!assignment?.dueDate) return null;

    const now = new Date();
    const deadline = new Date(assignment.dueDate);
    const daysDiff = Math.ceil(
      (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff < 0) {
      return <Badge variant="destructive">Overdue</Badge>;
    } else if (daysDiff <= 3) {
      return <Badge variant="destructive">Due Soon</Badge>;
    } else if (daysDiff <= 7) {
      return <Badge variant="outline">Due This Week</Badge>;
    }
    return <Badge variant="secondary">Upcoming</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Assignment not found
            </h3>
            <p className="text-gray-600 mb-4">
              The assignment you're looking for doesn't exist.
            </p>
            <Link to="/assignments">
              <Button>Back to Assignments</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isProfessor = user?.role === "professor";
  const canEdit = isProfessor; // Could add more logic for ownership checking

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              {assignment.title}
            </h1>
            {getStatusBadge()}
          </div>
          <p className="text-gray-600">
            Course: {assignment.course.code} - {assignment.course.name}
          </p>
        </div>

        {canEdit && (
          <div className="flex gap-2">
            <Link to={`/assignments/${assignment.id}/edit`}>
              <Button variant="outline">Edit Assignment</Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the assignment and all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {deleting ? "Deleting..." : "Delete Assignment"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignment.description && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-gray-600">{assignment.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Type</h4>
                <Badge variant="outline" className="capitalize">
                  {assignment.type}
                </Badge>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Max Score</h4>
                <p className="text-gray-600">{assignment.maxScore} points</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Weight</h4>
                <p className="text-gray-600">{assignment.weight}%</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Status</h4>
              <Badge variant="outline" className="capitalize">
                {assignment.status}
              </Badge>
            </div>

            {assignment.dueDate && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Due Date</h4>
                <p className="text-gray-600">
                  {new Date(assignment.dueDate).toLocaleDateString()} at{" "}
                  {new Date(assignment.dueDate).toLocaleTimeString()}
                </p>
              </div>
            )}

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Created</h4>
              <p className="text-gray-600">
                {new Date(assignment.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Last Updated</h4>
              <p className="text-gray-600">
                {new Date(assignment.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Files & Resources</CardTitle>
            <CardDescription>Assignment files and attachments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignment.files && assignment.files.length > 0 ? (
              <div className="space-y-3">
                {assignment.files.map((file) => (
                  <div key={file.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{file.originalName}</p>
                        <p className="text-sm text-gray-600">
                          {(file.size / 1024).toFixed(1)} KB •
                          Uploaded on{" "}
                          {new Date(file.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() =>
                            handleFileDownload(file.id, file.originalName)
                          }
                          variant="outline"
                          size="sm"
                        >
                          Download
                        </Button>
                        {canEdit && (
                          <Button
                            onClick={() => handleFileDelete(file.id)}
                            variant="destructive"
                            size="sm"
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No files attached</p>
            )}

            {canEdit && (
              <div className="border-t pt-4">
                <Label htmlFor="file-upload" className="block mb-2">
                  Upload New File
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(file);
                    }
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {canEdit && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Assignment Actions</CardTitle>
            <CardDescription>
              Manage assignment status and visibility
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                onClick={() =>
                  assignmentService.publishAssignment(assignment.id)
                }
                variant="outline"
              >
                Publish Assignment
              </Button>
              <Button
                onClick={() => assignmentService.markAsCompleted(assignment.id)}
                variant="outline"
              >
                Mark as Completed
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student Submission Section */}
      {user?.role === "student" && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              {submission ? "Your Submission" : "Submit Assignment"}
            </CardTitle>
            <CardDescription>
              {submission
                ? "You have submitted this assignment"
                : "Submit your work for this assignment"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submission ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-green-900">Submitted</p>
                      <p className="text-sm text-green-700">
                        {new Date(submission.submittedAt).toLocaleDateString()}{" "}
                        at{" "}
                        {new Date(submission.submittedAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <Badge variant="default" className="bg-green-600">
                      ✓ Submitted
                    </Badge>
                  </div>
                </div>

                {submission.notes && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {submission.notes}
                    </p>
                  </div>
                )}

                {submission.fileId && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Submitted File
                    </h4>
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                          File submitted with assignment
                        </p>
                        <Button
                          onClick={async () => {
                            try {
                              const blob = await assignmentService.downloadFile(
                                submission.fileId!
                              );
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `submission-${
                                assignment?.title || "file"
                              }`;
                              document.body.appendChild(a);
                              a.click();
                              URL.revokeObjectURL(url);
                              document.body.removeChild(a);
                            } catch (error) {
                              console.error("Failed to download file:", error);
                            }
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    To update your submission, submit again with new content.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="submission-notes">Notes (Optional)</Label>
                  <Textarea
                    id="submission-notes"
                    value={submissionNotes}
                    onChange={(e) => setSubmissionNotes(e.target.value)}
                    placeholder="Add any notes about your submission..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="submission-file">
                    Upload File (Optional)
                  </Label>
                  <Input
                    id="submission-file"
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setSubmissionFile(file || null);
                    }}
                    accept=".pdf,.doc,.docx,.txt,.zip,.rar"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Accepted formats: PDF, DOC, DOCX, TXT, ZIP, RAR
                  </p>
                </div>

                <Button
                  onClick={handleSubmitAssignment}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? "Submitting..." : "Submit Assignment"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AssignmentDetailPage;
