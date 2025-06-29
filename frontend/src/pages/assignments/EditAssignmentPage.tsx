import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { assignmentService } from "@/services/assignmentService";
import { courseService } from "@/services/courseService";
import type { Assignment, Course, CreateAssignmentRequest } from "@/types/api";

const EditAssignmentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [formData, setFormData] = useState<CreateAssignmentRequest>({
    title: "",
    description: "",
    type: "assignment",
    maxScore: 100,
    weight: 0,
    dueDate: "",
    courseId: "",
  });

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;

      try {
        const [assignmentData, coursesData] = await Promise.all([
          assignmentService.getAssignment(id),
          user?.role === "professor"
            ? courseService.getMyCourses()
            : courseService.getCourses(),
        ]);

        setAssignment(assignmentData);
        setCourses(coursesData);

        // Pre-fill form with assignment data
        setFormData({
          title: assignmentData.title,
          description: assignmentData.description || "",
          type: assignmentData.type,
          maxScore: assignmentData.maxScore,
          weight: assignmentData.weight,
          dueDate: assignmentData.dueDate
            ? new Date(assignmentData.dueDate).toISOString().slice(0, 16)
            : "",
          courseId: assignmentData.course.id,
        });
      } catch (error) {
        console.error("Failed to load assignment or courses:", error);
        navigate("/assignments");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSaving(true);

    try {
      await assignmentService.updateAssignment(id, formData);
      navigate(`/assignments/${id}`);
    } catch (error) {
      console.error("Failed to update assignment:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    field: keyof CreateAssignmentRequest,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]:
        field === "maxScore" || field === "weight" ? Number(value) : value,
    }));
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
              The assignment you're trying to edit doesn't exist.
            </p>
            <Button onClick={() => navigate("/assignments")}>
              Back to Assignments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Assignment</h1>
          <p className="text-gray-600 mt-2">
            Update the assignment details below
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
            <CardDescription>
              Modify the information for your assignment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="course">Course</Label>
                <Select
                  value={formData.courseId}
                  onValueChange={(value) => handleChange("courseId", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.code} - {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Assignment Title</Label>
                <Input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="Enter assignment title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Assignment Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleChange("type", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lab">Lab</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxScore">Maximum Score</Label>
                  <Input
                    id="maxScore"
                    type="number"
                    min="1"
                    value={formData.maxScore}
                    onChange={(e) => handleChange("maxScore", e.target.value)}
                    placeholder="e.g. 100"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (%)</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => handleChange("weight", e.target.value)}
                    placeholder="e.g. 15.5"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Enter assignment description"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={formData.dueDate || ""}
                  onChange={(e) => handleChange("dueDate", e.target.value)}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/assignments/${id}`)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditAssignmentPage;
