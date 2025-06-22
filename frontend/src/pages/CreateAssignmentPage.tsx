import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { useAuth } from "../contexts/AuthContext";
import { assignmentService } from "../services/assignmentService";
import { courseService } from "../services/courseService";
import type { Course, CreateAssignmentRequest } from "../types/api";

const CreateAssignmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
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
    const loadCourses = async () => {
      try {
        if (user?.role === "professor") {
          const coursesData = await courseService.getMyCourses();
          setCourses(coursesData);
        }
      } catch (error) {
        console.error("Failed to load courses:", error);
      }
    };

    loadCourses();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await assignmentService.createAssignment(formData);
      navigate("/assignments");
    } catch (error) {
      console.error("Failed to create assignment:", error);
    } finally {
      setLoading(false);
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

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Create Assignment
          </h1>
          <p className="text-gray-600 mt-2">
            Create a new assignment for your students
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
            <CardDescription>
              Fill in the information for your new assignment
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
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Creating..." : "Create Assignment"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/assignments")}
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

export default CreateAssignmentPage;
