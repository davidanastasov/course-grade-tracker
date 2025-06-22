import React from "react";
import {
  useMyCourses,
  useMyGrades,
  useStudentProgress,
} from "../../hooks/useQueries";
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
import {
  BookOpen,
  FileText,
  TrendingUp,
  Search,
  AlertTriangle,
} from "lucide-react";

const StudentDashboard: React.FC = () => {
  const { data: courses = [], isLoading: coursesLoading } = useMyCourses();
  const { data: grades = [], isLoading: gradesLoading } = useMyGrades();

  if (coursesLoading || gradesLoading) {
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

  const completedAssignments = grades.filter((g) => g.assignment).length;
  const averageGrade =
    grades.length > 0
      ? grades.reduce((sum, grade) => sum + grade.score, 0) / grades.length
      : 0;

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Enrolled Courses
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
            <p className="text-xs text-muted-foreground">Active enrollments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Assignments Done
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedAssignments}</div>
            <p className="text-xs text-muted-foreground">
              Completed submissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageGrade.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Across all courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Grades</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{grades.length}</div>
            <p className="text-xs text-muted-foreground">Recorded grades</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks for your academic journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button asChild className="h-20 flex-col">
              <Link to="/courses">
                <Search className="h-5 w-5 mb-2" />
                Browse Courses
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link to="/assignments">
                <FileText className="h-5 w-5 mb-2" />
                My Assignments
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link to="/grades">
                <TrendingUp className="h-5 w-5 mb-2" />
                Track Grades
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link to="/courses">
                <BookOpen className="h-5 w-5 mb-2" />
                My Courses
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Course Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              My Courses
              <Button asChild size="sm" variant="outline">
                <Link to="/courses">View All</Link>
              </Button>
            </CardTitle>
            <CardDescription>Your current course enrollments</CardDescription>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No courses yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Enroll in courses to start tracking your progress.
                </p>
                <Button asChild>
                  <Link to="/courses">Browse Courses</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {courses.slice(0, 4).map((course) => (
                  <CourseProgressCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Grades
              <Button asChild size="sm" variant="outline">
                <Link to="/grades">View All</Link>
              </Button>
            </CardTitle>
            <CardDescription>Your latest grade submissions</CardDescription>
          </CardHeader>
          <CardContent>
            {grades.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No grades yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Start submitting your grades to track progress.
                </p>
                <Button asChild>
                  <Link to="/grades">Track Grades</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {grades.slice(0, 5).map((grade) => (
                  <div
                    key={grade.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                  >
                    <div>
                      <p className="font-medium">
                        {grade.assignment?.title ||
                          grade.gradeComponent?.name ||
                          "Grade"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(grade.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant={
                        grade.score >= 80
                          ? "default"
                          : grade.score >= 60
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {grade.score}%
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

interface CourseProgressCardProps {
  course: any;
}

const CourseProgressCard: React.FC<CourseProgressCardProps> = ({ course }) => {
  const { data: progress } = useStudentProgress(course.id);

  const totalAssignments = progress?.length || 0;
  const completedAssignments =
    progress?.filter((p) => p.isCompleted).length || 0;
  const overdueAssignments = progress?.filter((p) => p.isOverdue).length || 0;

  return (
    <div className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-medium">{course.name}</h3>
          <p className="text-sm text-gray-600">{course.code}</p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link to={`/courses/${course.id}`}>View</Link>
        </Button>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <Badge variant="secondary">
          {completedAssignments}/{totalAssignments} assignments
        </Badge>
        {overdueAssignments > 0 && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {overdueAssignments} overdue
          </Badge>
        )}
      </div>

      {totalAssignments > 0 && (
        <div className="mt-3">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>
              {Math.round((completedAssignments / totalAssignments) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{
                width: `${(completedAssignments / totalAssignments) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
