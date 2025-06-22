import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
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
import {
  Plus,
  Trash2,
  BookOpen,
  GraduationCap,
  Settings,
  AlertTriangle,
} from "lucide-react";
import { useCreateCourse } from "../hooks/useQueries";

interface GradeComponent {
  id: string;
  name: string;
  weight: number;
  required: boolean;
}

interface GradeBand {
  id: string;
  minScore: number;
  maxScore: number;
  grade: number;
  letterGrade: string;
}

const CreateCoursePage: React.FC = () => {
  const navigate = useNavigate();
  const createCourseMutation = useCreateCourse();

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    credits: 3,
    passingGrade: 50,
  });

  const [gradeComponents, setGradeComponents] = useState<GradeComponent[]>([
    {
      id: "1",
      name: "Assignments",
      weight: 30,
      required: false,
    },
    {
      id: "2",
      name: "Midterm Exam",
      weight: 30,
      required: true,
    },
    {
      id: "3",
      name: "Final Exam",
      weight: 40,
      required: true,
    },
  ]);

  const [gradeBands, setGradeBands] = useState<GradeBand[]>([
    { id: "1", minScore: 90, maxScore: 100, grade: 10, letterGrade: "A+" },
    { id: "2", minScore: 85, maxScore: 89, grade: 9, letterGrade: "A" },
    { id: "3", minScore: 80, maxScore: 84, grade: 8, letterGrade: "A-" },
    { id: "4", minScore: 75, maxScore: 79, grade: 7, letterGrade: "B+" },
    { id: "5", minScore: 70, maxScore: 74, grade: 6, letterGrade: "B" },
    { id: "6", minScore: 65, maxScore: 69, grade: 5, letterGrade: "B-" },
    { id: "7", minScore: 60, maxScore: 64, grade: 4, letterGrade: "C+" },
    { id: "8", minScore: 55, maxScore: 59, grade: 3, letterGrade: "C" },
    { id: "9", minScore: 50, maxScore: 54, grade: 2, letterGrade: "C-" },
    { id: "10", minScore: 0, maxScore: 49, grade: 0, letterGrade: "F" },
  ]);

  const [passingRequirements, setPassingRequirements] = useState({
    requireAllComponents: false,
    minimumComponentsRequired: 0,
    specificRequirements: [] as string[],
  });

  const [currentTab, setCurrentTab] = useState("basic");

  const handleBasicInfoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "credits" || name === "passingGrade" ? Number(value) : value,
    }));
  };

  const addGradeComponent = () => {
    const newComponent: GradeComponent = {
      id: Date.now().toString(),
      name: "",
      weight: 0,
      required: false,
    };
    setGradeComponents((prev) => [...prev, newComponent]);
  };

  const updateGradeComponent = (
    id: string,
    updates: Partial<GradeComponent>
  ) => {
    setGradeComponents((prev) =>
      prev.map((comp) => (comp.id === id ? { ...comp, ...updates } : comp))
    );
  };

  const removeGradeComponent = (id: string) => {
    setGradeComponents((prev) => prev.filter((comp) => comp.id !== id));
  };

  const addGradeBand = () => {
    const newBand: GradeBand = {
      id: Date.now().toString(),
      minScore: 0,
      maxScore: 0,
      grade: 0,
      letterGrade: "",
    };
    setGradeBands((prev) => [...prev, newBand]);
  };

  const updateGradeBand = (id: string, updates: Partial<GradeBand>) => {
    setGradeBands((prev) =>
      prev.map((band) => (band.id === id ? { ...band, ...updates } : band))
    );
  };

  const removeGradeBand = (id: string) => {
    setGradeBands((prev) => prev.filter((band) => band.id !== id));
  };

  const validateForm = () => {
    const errors: string[] = [];

    // Basic info validation
    if (!formData.name.trim()) errors.push("Course name is required");
    if (!formData.code.trim()) errors.push("Course code is required");
    if (formData.credits < 1) errors.push("Credits must be at least 1");
    if (formData.passingGrade < 0 || formData.passingGrade > 100) {
      errors.push("Passing grade must be between 0 and 100");
    }

    // Grade components validation
    const totalWeight = gradeComponents.reduce(
      (sum, comp) => sum + comp.weight,
      0
    );
    if (Math.abs(totalWeight - 100) > 0.01) {
      errors.push("Grade component weights must total 100%");
    }

    gradeComponents.forEach((comp, index) => {
      if (!comp.name.trim())
        errors.push(`Grade component ${index + 1} needs a name`);
      if (comp.weight <= 0)
        errors.push(`Grade component "${comp.name}" needs a positive weight`);
    });

    // Grade bands validation
    const sortedBands = [...gradeBands].sort((a, b) => b.minScore - a.minScore);
    for (let i = 0; i < sortedBands.length - 1; i++) {
      const current = sortedBands[i];
      const next = sortedBands[i + 1];
      if (current.minScore <= next.maxScore) {
        errors.push("Grade bands cannot overlap");
        break;
      }
    }

    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      alert("Please fix the following errors:\n" + errors.join("\n"));
      return;
    }

    try {
      // Create the course with all components
      const courseData = {
        ...formData,
        gradeComponents: gradeComponents.map((comp) => ({
          name: comp.name,
          weight: comp.weight,
          required: comp.required,
        })),
        gradeBands: gradeBands.map((band) => ({
          minScore: band.minScore,
          maxScore: band.maxScore,
          grade: band.grade,
          letterGrade: band.letterGrade,
        })),
        passingRequirements,
      };

      const course = await createCourseMutation.mutateAsync(courseData);
      navigate(`/courses/${course.id}`);
    } catch (error) {
      console.error("Failed to create course:", error);
      alert("Failed to create course. Please try again.");
    }
  };

  const totalWeight = gradeComponents.reduce(
    (sum, comp) => sum + comp.weight,
    0
  );
  const isWeightValid = Math.abs(totalWeight - 100) < 0.01;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Create New Course
          </h1>
          <p className="mt-2 text-gray-600">
            Set up your course structure, grading components, and requirements.
          </p>
        </div>

        <Tabs
          value={currentTab}
          onValueChange={setCurrentTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="components">Grade Components</TabsTrigger>
            <TabsTrigger value="bands">Grade Bands</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Course Information
                </CardTitle>
                <CardDescription>
                  Basic information about your course
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Course Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleBasicInfoChange}
                      placeholder="e.g. Introduction to Computer Science"
                    />
                  </div>
                  <div>
                    <Label htmlFor="code">Course Code *</Label>
                    <Input
                      id="code"
                      name="code"
                      value={formData.code}
                      onChange={handleBasicInfoChange}
                      placeholder="e.g. CS101"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleBasicInfoChange}
                    placeholder="Describe what this course covers..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="credits">Credits</Label>
                    <Input
                      id="credits"
                      name="credits"
                      type="number"
                      min="1"
                      max="10"
                      value={formData.credits}
                      onChange={handleBasicInfoChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="passingGrade">Passing Grade (%)</Label>
                    <Input
                      id="passingGrade"
                      name="passingGrade"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.passingGrade}
                      onChange={handleBasicInfoChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="components" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Grade Components
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={isWeightValid ? "default" : "destructive"}>
                      Total: {totalWeight}%
                    </Badge>
                    <Button onClick={addGradeComponent} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Component
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  Define how student grades will be calculated. Total weight
                  must equal 100%.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {gradeComponents.map((component) => (
                    <div key={component.id} className="p-4 border rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                          <Label>Component Name</Label>
                          <Input
                            value={component.name}
                            onChange={(e) =>
                              updateGradeComponent(component.id, {
                                name: e.target.value,
                              })
                            }
                            placeholder="e.g. Assignments"
                          />
                        </div>
                        <div>
                          <Label>Weight (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={component.weight}
                            onChange={(e) =>
                              updateGradeComponent(component.id, {
                                weight: Number(e.target.value),
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`required-${component.id}`}
                            checked={component.required}
                            onChange={(e) =>
                              updateGradeComponent(component.id, {
                                required: e.target.checked,
                              })
                            }
                          />
                          <Label htmlFor={`required-${component.id}`}>
                            Required for passing
                          </Label>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeGradeComponent(component.id)}
                          disabled={gradeComponents.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {!isWeightValid && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <p className="text-yellow-800">
                        Warning: Total weight is {totalWeight}%. It must equal
                        100%.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bands" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Grade Bands
                  </div>
                  <Button onClick={addGradeBand} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Band
                  </Button>
                </CardTitle>
                <CardDescription>
                  Define the grading scale for final marks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {gradeBands.map((band) => (
                    <div key={band.id} className="p-4 border rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div>
                          <Label>Min Score (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={band.minScore}
                            onChange={(e) =>
                              updateGradeBand(band.id, {
                                minScore: Number(e.target.value),
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>Max Score (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={band.maxScore}
                            onChange={(e) =>
                              updateGradeBand(band.id, {
                                maxScore: Number(e.target.value),
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>Numeric Grade</Label>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            value={band.grade}
                            onChange={(e) =>
                              updateGradeBand(band.id, {
                                grade: Number(e.target.value),
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>Letter Grade</Label>
                          <Input
                            value={band.letterGrade}
                            onChange={(e) =>
                              updateGradeBand(band.id, {
                                letterGrade: e.target.value,
                              })
                            }
                            placeholder="A, B, C..."
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeGradeBand(band.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requirements" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Passing Requirements</CardTitle>
                <CardDescription>
                  Define specific requirements students must meet to pass
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="requireAll"
                    checked={passingRequirements.requireAllComponents}
                    onChange={(e) =>
                      setPassingRequirements((prev) => ({
                        ...prev,
                        requireAllComponents: e.target.checked,
                      }))
                    }
                  />
                  <Label htmlFor="requireAll">
                    Students must complete ALL grade components to be eligible
                    for final grade
                  </Label>
                </div>

                <div>
                  <Label>Minimum Components Required</Label>
                  <Input
                    type="number"
                    min="0"
                    max={gradeComponents.length}
                    value={passingRequirements.minimumComponentsRequired}
                    onChange={(e) =>
                      setPassingRequirements((prev) => ({
                        ...prev,
                        minimumComponentsRequired: Number(e.target.value),
                      }))
                    }
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Minimum number of components that must be completed (0 = no
                    requirement)
                  </p>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Examples of Requirements:
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>
                      • Students must complete all lab assignments to qualify
                      for the final exam
                    </li>
                    <li>
                      • At least 80% attendance required for course completion
                    </li>
                    <li>
                      • Must pass the midterm exam to be eligible for the final
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-between">
          <Button variant="outline" onClick={() => navigate("/courses")}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const currentIndex = [
                  "basic",
                  "components",
                  "bands",
                  "requirements",
                ].indexOf(currentTab);
                if (currentIndex > 0) {
                  setCurrentTab(
                    ["basic", "components", "bands", "requirements"][
                      currentIndex - 1
                    ]
                  );
                }
              }}
              disabled={currentTab === "basic"}
            >
              Previous
            </Button>
            {currentTab !== "requirements" ? (
              <Button
                onClick={() => {
                  const currentIndex = [
                    "basic",
                    "components",
                    "bands",
                    "requirements",
                  ].indexOf(currentTab);
                  if (currentIndex < 3) {
                    setCurrentTab(
                      ["basic", "components", "bands", "requirements"][
                        currentIndex + 1
                      ]
                    );
                  }
                }}
              >
                Next
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={createCourseMutation.isPending}>
                    {createCourseMutation.isPending
                      ? "Creating..."
                      : "Create Course"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Create Course</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to create this course? You can edit
                      these settings later.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSubmit}>
                      Create Course
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCoursePage;
