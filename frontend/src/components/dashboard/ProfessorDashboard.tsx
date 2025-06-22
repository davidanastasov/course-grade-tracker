import React from "react";
import { useMyCourses } from "../../hooks/useQueries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";
import { Plus, BookOpen, Users, GraduationCap, FileText } from "lucide-react";

const ProfessorDashboard: React.FC = () => {
  const { data: courses = [], isLoading: coursesLoading } = useMyCourses();

  if (coursesLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalStudents = courses.reduce(
    (sum, course) => sum + (course.enrollments?.length || 0),
    0
  );
  const totalAssignments = courses.reduce(
    (sum, course) => sum + (course.assignments?.length || 0),
    0
  );

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
            <p className="text-xs text-muted-foreground">
              Active courses you're teaching
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Across all your courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssignments}</div>
            <p className="text-xs text-muted-foreground">Created assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Grades
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Grades to confirm</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to get you started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button asChild className="h-20 flex-col">
              <Link to="/courses/new">
                <Plus className="h-5 w-5 mb-2" />
                Create Course
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link to="/assignments/new">
                <FileText className="h-5 w-5 mb-2" />
                New Assignment
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link to="/grades">
                <GraduationCap className="h-5 w-5 mb-2" />
                Grade Students
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link to="/courses">
                <BookOpen className="h-5 w-5 mb-2" />
                Manage Courses
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Courses Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Your Courses
            <Button asChild size="sm">
              <Link to="/courses">View All</Link>
            </Button>
          </CardTitle>
          <CardDescription>Courses you're currently teaching</CardDescription>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No courses yet
              </h3>
              <p className="text-gray-600 mb-4">
                Create your first course to get started.
              </p>
              <Button asChild>
                <Link to="/courses/new">Create Course</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.slice(0, 6).map((course) => (
                <Card
                  key={course.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{course.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {course.code} • {course.enrollments?.length || 0} students
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Badge variant="secondary">
                          {course.gradeComponents?.length || 0} components
                        </Badge>
                        <Badge variant="outline">
                          {course.assignments?.length || 0} assignments
                        </Badge>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/courses/${course.id}`}>View</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfessorDashboard;
