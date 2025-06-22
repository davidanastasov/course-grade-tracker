import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
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
import { courseService } from "../services/courseService";
import type { Course, CreateCourseRequest } from "../types/api";

const EditCoursePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState<CreateCourseRequest>({
    name: "",
    code: "",
    description: "",
  });

  // Grade component form
  const [newComponent, setNewComponent] = useState({
    name: "",
    type: "exam" as
      | "theory"
      | "lab"
      | "assignment"
      | "quiz"
      | "exam"
      | "project",
    weight: 0,
  });

  // Grade band form
  const [newBand, setNewBand] = useState({
    grade: 0,
    minScore: 0,
    maxScore: 0,
  });

  useEffect(() => {
    const loadCourse = async () => {
      if (!id) return;

      try {
        const courseData = await courseService.getCourse(id);
        setCourse(courseData);

        // Pre-fill form with course data
        setFormData({
          name: courseData.name,
          code: courseData.code,
          description: courseData.description || "",
        });
      } catch (error) {
        console.error("Failed to load course:", error);
        navigate("/courses");
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSaving(true);

    try {
      await courseService.updateCourse(id, formData);
      navigate(`/courses/${id}`);
    } catch (error) {
      console.error("Failed to update course:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof CreateCourseRequest, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddGradeComponent = async () => {
    if (
      !id ||
      !newComponent.name ||
      !newComponent.type ||
      newComponent.weight <= 0
    )
      return;

    try {
      await courseService.createGradeComponent(id, newComponent);
      // Reload course to get updated components
      const updatedCourse = await courseService.getCourse(id);
      setCourse(updatedCourse);
      setNewComponent({ name: "", type: "exam", weight: 0 });
    } catch (error) {
      console.error("Failed to add grade component:", error);
    }
  };

  const handleAddGradeBand = async () => {
    if (
      !id ||
      newBand.grade <= 0 ||
      newBand.minScore < 0 ||
      newBand.maxScore <= newBand.minScore
    )
      return;

    try {
      await courseService.createGradeBand(id, newBand);
      // Reload course to get updated bands
      const updatedCourse = await courseService.getCourse(id);
      setCourse(updatedCourse);
      setNewBand({ grade: 0, minScore: 0, maxScore: 0 });
    } catch (error) {
      console.error("Failed to add grade band:", error);
    }
  };

  const handleDeleteCourse = async () => {
    if (!id) return;

    try {
      await courseService.deleteCourse(id);
      navigate("/courses");
    } catch (error) {
      console.error("Failed to delete course:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Course not found
            </h3>
            <p className="text-gray-600 mb-4">
              The course you're trying to edit doesn't exist.
            </p>
            <Button onClick={() => navigate("/courses")}>
              Back to Courses
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isProfessor = user?.role === "professor";
  const isOwner = course.professor.id === user?.id;

  if (!isProfessor || !isOwner) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Access Denied
            </h3>
            <p className="text-gray-600 mb-4">
              You don't have permission to edit this course.
            </p>
            <Button onClick={() => navigate("/courses")}>
              Back to Courses
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Course</h1>
            <p className="text-gray-600 mt-2">
              Manage course details, grading, and settings
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete Course</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  course and all associated assignments, grades, and
                  enrollments.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteCourse}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete Course
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Course Details</TabsTrigger>
            <TabsTrigger value="grading">Grading System</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Information</CardTitle>
                <CardDescription>
                  Update the basic information for your course
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Course Name</Label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        placeholder="Enter course name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="code">Course Code</Label>
                      <Input
                        id="code"
                        type="text"
                        value={formData.code}
                        onChange={(e) => handleChange("code", e.target.value)}
                        placeholder="Enter course code"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description || ""}
                      onChange={(e) =>
                        handleChange("description", e.target.value)
                      }
                      placeholder="Enter course description"
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button type="submit" disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(`/courses/${id}`)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grading" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Grade Components</CardTitle>
                  <CardDescription>
                    Define how the final grade is calculated
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {course.gradeComponents &&
                  course.gradeComponents.length > 0 ? (
                    <div className="space-y-2">
                      {course.gradeComponents.map((component) => (
                        <div
                          key={component.id}
                          className="flex justify-between items-center p-3 border rounded"
                        >
                          <span className="font-medium">{component.name}</span>
                          <Badge variant="secondary">{component.weight}%</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">
                      No grade components defined yet
                    </p>
                  )}

                  <div className="border-t pt-4 space-y-3">
                    <h4 className="font-medium">Add New Component</h4>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Component name"
                        value={newComponent.name}
                        onChange={(e) =>
                          setNewComponent((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                      />
                      <Select
                        value={newComponent.type}
                        onValueChange={(
                          value:
                            | "theory"
                            | "lab"
                            | "assignment"
                            | "quiz"
                            | "exam"
                            | "project"
                        ) =>
                          setNewComponent((prev) => ({
                            ...prev,
                            type: value,
                          }))
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="theory">Theory</SelectItem>
                          <SelectItem value="lab">Lab</SelectItem>
                          <SelectItem value="assignment">Assignment</SelectItem>
                          <SelectItem value="quiz">Quiz</SelectItem>
                          <SelectItem value="exam">Exam</SelectItem>
                          <SelectItem value="project">Project</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="Weight %"
                        value={newComponent.weight || ""}
                        onChange={(e) =>
                          setNewComponent((prev) => ({
                            ...prev,
                            weight: parseInt(e.target.value) || 0,
                          }))
                        }
                      />
                      <Button onClick={handleAddGradeComponent} size="sm">
                        Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Grade Bands</CardTitle>
                  <CardDescription>
                    Set grade boundaries and letter grades
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {course.gradeBands && course.gradeBands.length > 0 ? (
                    <div className="space-y-2">
                      {course.gradeBands
                        .sort((a, b) => b.minScore - a.minScore)
                        .map((band) => (
                          <div
                            key={band.id}
                            className="flex justify-between items-center p-3 border rounded"
                          >
                            <span className="font-medium">
                              Grade {band.gradeValue}
                            </span>
                            <span className="text-sm text-gray-600">
                              {band.minScore}% - {band.maxScore}%
                            </span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">
                      No grade bands defined yet
                    </p>
                  )}

                  <div className="border-t pt-4 space-y-3">
                    <h4 className="font-medium">Add New Band</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        type="number"
                        placeholder="Grade"
                        value={newBand.grade || ""}
                        onChange={(e) =>
                          setNewBand((prev) => ({
                            ...prev,
                            grade: parseInt(e.target.value) || 0,
                          }))
                        }
                      />
                      <Input
                        type="number"
                        placeholder="Min %"
                        value={newBand.minScore || ""}
                        onChange={(e) =>
                          setNewBand((prev) => ({
                            ...prev,
                            minScore: parseInt(e.target.value) || 0,
                          }))
                        }
                      />
                      <Input
                        type="number"
                        placeholder="Max %"
                        value={newBand.maxScore || ""}
                        onChange={(e) =>
                          setNewBand((prev) => ({
                            ...prev,
                            maxScore: parseInt(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                    <Button onClick={handleAddGradeBand} size="sm">
                      Add Band
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Enrolled Students</CardTitle>
                <CardDescription>
                  Manage student enrollments for this course
                </CardDescription>
              </CardHeader>
              <CardContent>
                {course.enrollments && course.enrollments.length > 0 ? (
                  <div className="space-y-3">
                    {course.enrollments.map((enrollment) => (
                      <div
                        key={enrollment.id}
                        className="flex justify-between items-center p-3 border rounded"
                      >
                        <div>
                          <span className="font-medium">
                            {enrollment.student.firstName}{" "}
                            {enrollment.student.lastName}
                          </span>
                          <p className="text-sm text-gray-600">
                            {enrollment.student.email}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">
                          Enrolled:{" "}
                          {new Date(enrollment.enrolledAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">
                    No students enrolled yet
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EditCoursePage;
