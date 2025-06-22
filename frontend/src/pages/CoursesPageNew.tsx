import React, { useState } from "react";
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
import { Input } from "../components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useAuth } from "../contexts/AuthContext";
import {
  useCourses,
  useMyCourses,
  useEnrollInCourse,
} from "../hooks/useQueries";
import { Plus, Search, Users, BookOpen, GraduationCap } from "lucide-react";
import type { Course } from "../types/api";

const CoursesPage: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: allCourses = [], isLoading: allCoursesLoading } = useCourses();
  const { data: myCourses = [], isLoading: myCoursesLoading } = useMyCourses();
  const enrollMutation = useEnrollInCourse();

  const isProfessor = user?.role === "professor";

  // Filter courses based on search term
  const filteredAllCourses = allCourses.filter(
    (course) =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMyCourses = myCourses.filter(
    (course) =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get available courses for students (not enrolled)
  const enrolledCourseIds = new Set(myCourses.map((course) => course.id));
  const availableCourses = filteredAllCourses.filter(
    (course) =>
      !enrolledCourseIds.has(course.id) &&
      (!isProfessor || course.professor.id !== user?.id)
  );

  const handleEnroll = async (courseId: string) => {
    try {
      await enrollMutation.mutateAsync(courseId);
    } catch (error) {
      console.error("Failed to enroll in course:", error);
    }
  };

  if (allCoursesLoading || myCoursesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isProfessor ? "Course Management" : "My Courses"}
            </h1>
            <p className="mt-2 text-gray-600">
              {isProfessor
                ? "Manage your courses, track student progress, and create assignments"
                : "View your enrolled courses and discover new ones"}
            </p>
          </div>
          {isProfessor && (
            <Button asChild>
              <Link to="/courses/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </Link>
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs
          defaultValue={isProfessor ? "my-courses" : "enrolled"}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value={isProfessor ? "my-courses" : "enrolled"}>
              {isProfessor ? "My Courses" : "Enrolled Courses"}
            </TabsTrigger>
            <TabsTrigger value={isProfessor ? "all-courses" : "available"}>
              {isProfessor ? "All Courses" : "Available Courses"}
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value={isProfessor ? "my-courses" : "enrolled"}
            className="mt-6"
          >
            <CourseGrid
              courses={filteredMyCourses}
              title={
                isProfessor
                  ? "Courses You're Teaching"
                  : "Your Enrolled Courses"
              }
              emptyMessage={
                isProfessor
                  ? "You haven't created any courses yet. Create your first course to get started."
                  : "You're not enrolled in any courses yet. Browse available courses to get started."
              }
              isProfessor={isProfessor}
              showEnrollButton={false}
            />
          </TabsContent>

          <TabsContent
            value={isProfessor ? "all-courses" : "available"}
            className="mt-6"
          >
            <CourseGrid
              courses={isProfessor ? filteredAllCourses : availableCourses}
              title={
                isProfessor ? "All Courses in System" : "Available Courses"
              }
              emptyMessage={
                isProfessor
                  ? "No courses found in the system."
                  : "No available courses to enroll in."
              }
              isProfessor={isProfessor}
              showEnrollButton={!isProfessor}
              onEnroll={handleEnroll}
              enrollLoading={enrollMutation.isPending}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

interface CourseGridProps {
  courses: Course[];
  title: string;
  emptyMessage: string;
  isProfessor: boolean;
  showEnrollButton: boolean;
  onEnroll?: (courseId: string) => void;
  enrollLoading?: boolean;
}

const CourseGrid: React.FC<CourseGridProps> = ({
  courses,
  title,
  emptyMessage,
  isProfessor,
  showEnrollButton,
  onEnroll,
  enrollLoading,
}) => {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No courses found
            </h3>
            <p className="text-gray-600 mb-4">{emptyMessage}</p>
            {isProfessor && (
              <Button asChild>
                <Link to="/courses/new">Create Your First Course</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              isProfessor={isProfessor}
              showEnrollButton={showEnrollButton}
              onEnroll={onEnroll}
              enrollLoading={enrollLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface CourseCardProps {
  course: Course;
  isProfessor: boolean;
  showEnrollButton: boolean;
  onEnroll?: (courseId: string) => void;
  enrollLoading?: boolean;
}

const CourseCard: React.FC<CourseCardProps> = ({
  course,
  isProfessor,
  showEnrollButton,
  onEnroll,
  enrollLoading,
}) => {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{course.name}</CardTitle>
            <CardDescription className="text-sm font-medium text-blue-600">
              {course.code}
            </CardDescription>
          </div>
          <Badge variant="secondary">{course.credits || 3} credits</Badge>
        </div>
        {course.description && (
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
            {course.description}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-2" />
            <span>{course.enrollments?.length || 0} students enrolled</span>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <GraduationCap className="h-4 w-4 mr-2" />
            <span>
              Prof. {course.professor.firstName} {course.professor.lastName}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="outline">
              {course.gradeComponents?.length || 0} components
            </Badge>
            <Badge variant="outline">
              {course.assignments?.length || 0} assignments
            </Badge>
          </div>

          <div className="flex gap-2 mt-4">
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link to={`/courses/${course.id}`}>View Details</Link>
            </Button>

            {showEnrollButton && onEnroll && (
              <Button
                onClick={() => onEnroll(course.id)}
                disabled={enrollLoading}
                size="sm"
                className="flex-1"
              >
                {enrollLoading ? "Enrolling..." : "Enroll"}
              </Button>
            )}

            {isProfessor && (
              <Button asChild size="sm" variant="secondary">
                <Link to={`/courses/${course.id}/edit`}>Edit</Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CoursesPage;
