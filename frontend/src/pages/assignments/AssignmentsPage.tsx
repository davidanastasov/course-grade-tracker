import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { assignmentService } from "@/services/assignmentService";
import { courseService } from "@/services/courseService";
import type { Assignment, Course } from "@/types/api";

const AssignmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>(
    []
  );
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [assignmentsData, coursesData] = await Promise.all([
          assignmentService.getAssignments(),
          user?.role === "professor"
            ? courseService.getMyCourses()
            : courseService.getCourses(),
        ]);
        setAllAssignments(assignmentsData);
        setCourses(coursesData);
        setFilteredAssignments(assignmentsData);
      } catch (error) {
        console.error("Failed to load assignments:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  const applyFilters = useCallback(() => {
    let filtered = allAssignments;

    // Filter by course
    if (selectedCourse !== "all") {
      filtered = filtered.filter(
        (assignment) => assignment.course.id === selectedCourse
      );
    }

    // Filter by status
    if (selectedStatus !== "all") {
      const now = new Date();
      filtered = filtered.filter((assignment) => {
        switch (selectedStatus) {
          case "overdue":
            return assignment.dueDate && new Date(assignment.dueDate) < now;
          case "upcoming":
            return assignment.dueDate && new Date(assignment.dueDate) >= now;
          case "published":
            return assignment.status === "published";
          case "draft":
            return assignment.status === "draft";
          default:
            return true;
        }
      });
    }

    setFilteredAssignments(filtered);
  }, [allAssignments, selectedCourse, selectedStatus]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

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
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter assignments by course and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="course-filter">Course</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="All courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All courses</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredAssignments.length === 0 ? (
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
          {filteredAssignments.map((assignment: Assignment) => (
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
