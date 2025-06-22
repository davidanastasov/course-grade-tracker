import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useAuth } from "../contexts/AuthContext";
import { assignmentService } from "../services/assignmentService";
import type { Assignment } from "../types/api";

const AssignmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        const assignmentsData = await assignmentService.getAssignments();
        setAssignments(assignmentsData);
      } catch (error) {
        console.error("Failed to load assignments:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAssignments();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const getStatusBadge = (assignment: Assignment) => {
    if (!assignment.dueDate) return null;

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

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-600 mt-2">
            {user?.role === "professor"
              ? "Manage assignments and track submissions"
              : "View your assignments and submit work"}
          </p>
        </div>
        {user?.role === "professor" && (
          <Link to="/assignments/new">
            <Button>Create Assignment</Button>
          </Link>
        )}
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No assignments found
            </h3>
            <p className="text-gray-600 text-center mb-4">
              {user?.role === "professor"
                ? "Create your first assignment to get started"
                : "No assignments have been created yet"}
            </p>
            {user?.role === "professor" && (
              <Link to="/assignments/new">
                <Button>Create Your First Assignment</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <Card
              key={assignment.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">
                        {assignment.title}
                      </CardTitle>
                      {getStatusBadge(assignment)}
                    </div>
                    <CardDescription>
                      Course: {assignment.course.name}
                    </CardDescription>
                    {assignment.description && (
                      <p className="text-sm text-gray-600 mt-2">
                        {assignment.description}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    {assignment.dueDate && (
                      <p className="text-sm text-gray-600">
                        <strong>Due:</strong>{" "}
                        {new Date(assignment.dueDate).toLocaleDateString()} at{" "}
                        {new Date(assignment.dueDate).toLocaleTimeString()}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      <strong>Created:</strong>{" "}
                      {new Date(assignment.createdAt).toLocaleDateString()}
                    </p>
                    {assignment.files && assignment.files.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {assignment.files.length} Attachment
                        {assignment.files.length !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link to={`/assignments/${assignment.id}`}>
                      <Button variant="outline">View Details</Button>
                    </Link>
                    {user?.role === "professor" && (
                      <Link to={`/assignments/${assignment.id}/edit`}>
                        <Button size="sm">Edit</Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignmentsPage;
