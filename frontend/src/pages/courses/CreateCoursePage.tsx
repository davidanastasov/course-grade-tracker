import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Plus, Trash2, BookOpen, GraduationCap, AlertTriangle } from 'lucide-react';
import { useCreateCourse } from '@/hooks/useQueries';

interface LocalGradeComponent {
  id: string;
  name: string;
  category: 'Midterm' | 'Exam' | 'Lab' | 'Assignment' | 'Project';
  weight: number;
  minimumScore: number;
  totalPoints: number;
  isMandatory: boolean;
}

interface LocalGradeBand {
  id: string;
  minScore: number;
  maxScore: number;
  gradeValue: number;
}

const CreateCoursePage: React.FC = () => {
  const navigate = useNavigate();
  const createCourseMutation = useCreateCourse();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    credits: 6,
    passingGrade: 50
  });

  const [gradeComponents, setGradeComponents] = useState<LocalGradeComponent[]>([
    {
      id: '1',
      name: 'Lab 1',
      category: 'Lab',
      weight: 5,
      minimumScore: 0,
      totalPoints: 100,
      isMandatory: false
    },
    {
      id: '2',
      name: 'Lab 2',
      category: 'Lab',
      weight: 5,
      minimumScore: 0,
      totalPoints: 100,
      isMandatory: false
    },
    {
      id: '3',
      name: 'Lab 3',
      category: 'Lab',
      weight: 5,
      minimumScore: 0,
      totalPoints: 100,
      isMandatory: false
    },
    {
      id: '4',
      name: 'Lab 4',
      category: 'Lab',
      weight: 5,
      minimumScore: 0,
      totalPoints: 100,
      isMandatory: false
    },
    {
      id: '5',
      name: 'First Midterm',
      category: 'Midterm',
      weight: 30,
      minimumScore: 50,
      totalPoints: 100,
      isMandatory: true
    },
    {
      id: '6',
      name: 'Second Midterm',
      category: 'Midterm',
      weight: 30,
      minimumScore: 50,
      totalPoints: 100,
      isMandatory: true
    },
    {
      id: '7',
      name: 'Final Exam',
      category: 'Exam',
      weight: 60,
      minimumScore: 50,
      totalPoints: 100,
      isMandatory: true
    },
    {
      id: '8',
      name: 'Project',
      category: 'Project',
      weight: 20,
      minimumScore: 50,
      totalPoints: 100,
      isMandatory: false
    }
  ]);

  const [gradeBands, setGradeBands] = useState<LocalGradeBand[]>([
    { id: '1', minScore: 90, maxScore: 100, gradeValue: 10 },
    { id: '2', minScore: 80, maxScore: 90, gradeValue: 9 },
    { id: '3', minScore: 70, maxScore: 80, gradeValue: 8 },
    { id: '5', minScore: 60, maxScore: 70, gradeValue: 7 },
    { id: '7', minScore: 50, maxScore: 60, gradeValue: 6 },
    { id: '9', minScore: 0, maxScore: 50, gradeValue: 5 }
  ]);

  const [newGradeBand, setNewGradeBand] = useState({
    gradeValue: 0,
    minScore: 0,
    maxScore: 0
  });

  const [isAddBandDialogOpen, setIsAddBandDialogOpen] = useState(false);

  const [currentTab, setCurrentTab] = useState('basic');

  const handleBasicInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'credits' || name === 'passingGrade' ? Number(value) : value
    }));
  };

  const addGradeComponent = () => {
    const newComponent: LocalGradeComponent = {
      id: Date.now().toString(),
      name: '',
      category: 'Assignment',
      weight: 0,
      minimumScore: 0,
      totalPoints: 100,
      isMandatory: false
    };
    setGradeComponents((prev) => [...prev, newComponent]);
  };

  const updateGradeComponent = (id: string, updates: Partial<LocalGradeComponent>) => {
    setGradeComponents((prev) =>
      prev.map((comp) => (comp.id === id ? { ...comp, ...updates } : comp))
    );
  };

  const removeGradeComponent = (id: string) => {
    setGradeComponents((prev) => prev.filter((comp) => comp.id !== id));
  };

  const addGradeBand = () => {
    if (
      newGradeBand.gradeValue &&
      newGradeBand.gradeValue > 0 &&
      newGradeBand.minScore >= 0 &&
      newGradeBand.maxScore >= 0 &&
      newGradeBand.minScore <= newGradeBand.maxScore
    ) {
      // Check for duplicate grade values
      const existingGrade = gradeBands.find((band) => band.gradeValue === newGradeBand.gradeValue);
      if (existingGrade) {
        alert(`Grade ${newGradeBand.gradeValue} already exists!`);
        return;
      }

      const newBand: LocalGradeBand = {
        id: Date.now().toString(),
        minScore: newGradeBand.minScore,
        maxScore: newGradeBand.maxScore,
        gradeValue: newGradeBand.gradeValue
      };
      setGradeBands((prev) => [...prev, newBand]);
      setNewGradeBand({ gradeValue: 0, minScore: 0, maxScore: 0 });
      setIsAddBandDialogOpen(false);
    }
  };

  const removeGradeBand = (id: string) => {
    setGradeBands((prev) => prev.filter((band) => band.id !== id));
  };

  const validateGradeBandRanges = () => {
    const sortedBands = gradeBands.slice().sort((a, b) => a.minScore - b.minScore);

    for (let i = 0; i < sortedBands.length; i++) {
      const current = sortedBands[i];

      // Check if min > max for current band
      if (current.minScore > current.maxScore) {
        return `Grade ${current.gradeValue}: Min score (${current.minScore}%) cannot be greater than max score (${current.maxScore}%)`;
      }

      // Check overlap with next band - allow touching boundaries (e.g., 0-50 and 50-60 is OK)
      for (let j = i + 1; j < sortedBands.length; j++) {
        const next = sortedBands[j];
        // Overlap exists only if there's actual overlap, not just touching boundaries
        // E.g., 0-50 and 50-60 is OK, but 0-51 and 50-60 overlaps
        if (current.maxScore > next.minScore && current.minScore < next.maxScore) {
          return `Grades ${current.gradeValue} and ${next.gradeValue} have overlapping score ranges`;
        }
      }
    }

    return null;
  };

  const validateForm = () => {
    const errors: string[] = [];

    // Basic info validation
    if (!formData.name.trim()) errors.push('Course name is required');
    if (!formData.code.trim()) errors.push('Course code is required');
    if (formData.credits < 1) errors.push('Credits must be at least 1');
    if (formData.passingGrade < 0 || formData.passingGrade > 100) {
      errors.push('Passing grade must be between 0 and 100');
    }

    // Grade components validation - flexible for alternative completion paths
    const totalWeight = gradeComponents.reduce((sum, comp) => sum + comp.weight, 0);

    // Check if we have midterms and exams for alternative completion
    const midterms = gradeComponents.filter((comp) => comp.category === 'Midterm');
    const exams = gradeComponents.filter((comp) => comp.category === 'Exam');
    const otherComponents = gradeComponents.filter(
      (comp) => !['Midterm', 'Exam'].includes(comp.category)
    );

    const midtermWeight = midterms.reduce((sum, comp) => sum + comp.weight, 0);
    const examWeight = exams.reduce((sum, comp) => sum + comp.weight, 0);
    const otherWeight = otherComponents.reduce((sum, comp) => sum + comp.weight, 0);

    // Validate alternative completion paths
    const hasAlternativePaths = midterms.length > 0 && exams.length > 0;

    if (hasAlternativePaths) {
      // With alternative paths: midterms + other components OR exams + other components should each total 100%
      const midtermPath = midtermWeight + otherWeight;
      const examPath = examWeight + otherWeight;

      if (Math.abs(midtermPath - 100) > 0.01 && Math.abs(examPath - 100) > 0.01) {
        errors.push(
          `Alternative completion paths must total 100%. Current: Midterm path = ${midtermPath}%, Exam path = ${examPath}%`
        );
      }
    } else {
      // Traditional single path: all components must total 100%
      if (Math.abs(totalWeight - 100) > 0.01) {
        errors.push('Grade component weights must total 100%');
      }
    }

    gradeComponents.forEach((comp, index) => {
      if (!comp.name.trim()) errors.push(`Grade component ${index + 1} needs a name`);
      if (comp.weight <= 0) errors.push(`Grade component "${comp.name}" needs a positive weight`);
    });

    // Grade bands validation
    const gradeBandError = validateGradeBandRanges();
    if (gradeBandError) {
      errors.push(gradeBandError);
    }

    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      alert('Please fix the following errors:\n' + errors.join('\n'));
      return;
    }

    try {
      // Create the course with all components
      const courseData = {
        ...formData,
        gradeComponents: gradeComponents.map((comp) => ({
          name: comp.name,
          category: comp.category,
          weight: comp.weight,
          minimumScore: comp.minimumScore,
          totalPoints: comp.totalPoints,
          isMandatory: comp.isMandatory
        })),
        gradeBands: gradeBands.map((band) => ({
          minScore: band.minScore,
          maxScore: band.maxScore,
          gradeValue: band.gradeValue
        }))
      };

      const course = await createCourseMutation.mutateAsync(courseData);
      navigate(`/courses/${course.id}`);
    } catch (error) {
      console.error('Failed to create course:', error);
      alert('Failed to create course. Please try again.');
    }
  };

  const totalWeight = gradeComponents.reduce((sum, comp) => sum + comp.weight, 0);

  // Calculate alternative completion paths
  const midterms = gradeComponents.filter((comp) => comp.category === 'Midterm');
  const exams = gradeComponents.filter((comp) => comp.category === 'Exam');
  const otherComponents = gradeComponents.filter(
    (comp) => !['Midterm', 'Exam'].includes(comp.category)
  );

  const midtermWeight = midterms.reduce((sum, comp) => sum + comp.weight, 0);
  const examWeight = exams.reduce((sum, comp) => sum + comp.weight, 0);
  const otherWeight = otherComponents.reduce((sum, comp) => sum + comp.weight, 0);

  const hasAlternativePaths = midterms.length > 0 && exams.length > 0;
  const midtermPath = midtermWeight + otherWeight;
  const examPath = examWeight + otherWeight;

  const isWeightValid = hasAlternativePaths
    ? Math.abs(midtermPath - 100) < 0.01 || Math.abs(examPath - 100) < 0.01
    : Math.abs(totalWeight - 100) < 0.01;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Course</h1>
          <p className="mt-2 text-gray-600">Set up your course structure and grading components.</p>
        </div>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="components">Grade Components</TabsTrigger>
            <TabsTrigger value="bands">Grade Bands</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Course Information
                </CardTitle>
                <CardDescription>Basic information about your course</CardDescription>
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
                    {hasAlternativePaths ? (
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={Math.abs(midtermPath - 100) < 0.01 ? 'default' : 'destructive'}
                        >
                          Midterm path: {midtermPath}%
                        </Badge>
                        <Badge
                          variant={Math.abs(examPath - 100) < 0.01 ? 'default' : 'destructive'}
                        >
                          Exam path: {examPath}%
                        </Badge>
                      </div>
                    ) : (
                      <Badge variant={isWeightValid ? 'default' : 'destructive'}>
                        Total: {totalWeight}%
                      </Badge>
                    )}
                    <Button onClick={addGradeComponent} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Component
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  Define how student grades will be calculated. If you have both midterms and exams,
                  students can complete the course through alternative paths: either midterms +
                  other components OR exams + other components (each path must total 100%).
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Table Header */}
                <div className="grid grid-cols-6 gap-4 items-center p-3 bg-gray-100 border rounded-t font-medium text-sm text-gray-700">
                  <div>Component Name</div>
                  <div>Category</div>
                  <div>Weight (%)</div>
                  <div>Min Score</div>
                  <div>Total Points</div>
                  <div>Mandatory / Actions</div>
                </div>

                <div className="space-y-6">
                  {(['Midterm', 'Exam', 'Lab', 'Assignment', 'Project'] as const).map(
                    (category) => {
                      const categoryComponents = gradeComponents.filter(
                        (comp) => comp.category === category
                      );
                      if (categoryComponents.length === 0) return null;

                      return (
                        <div key={category} className="space-y-2">
                          <div className="flex items-center gap-2 mt-4">
                            <h4 className="font-medium text-lg text-gray-900">{category}</h4>
                            <Badge variant="outline" className="text-xs">
                              {categoryComponents.length} component
                              {categoryComponents.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            {categoryComponents.map((component) => (
                              <div
                                key={component.id}
                                className="grid grid-cols-6 gap-4 items-center p-3 border border-gray-200 bg-white hover:bg-gray-50"
                              >
                                <div>
                                  <Input
                                    value={component.name}
                                    onChange={(e) =>
                                      updateGradeComponent(component.id, {
                                        name: e.target.value
                                      })
                                    }
                                    placeholder="Component name"
                                    className="text-sm"
                                  />
                                </div>
                                <div>
                                  <select
                                    value={component.category}
                                    onChange={(e) =>
                                      updateGradeComponent(component.id, {
                                        category: e.target.value as
                                          | 'Lab'
                                          | 'Assignment'
                                          | 'Midterm'
                                          | 'Exam'
                                          | 'Project'
                                      })
                                    }
                                    className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="Midterm">Midterm</option>
                                    <option value="Exam">Exam</option>
                                    <option value="Lab">Lab</option>
                                    <option value="Assignment">Assignment</option>
                                    <option value="Project">Project</option>
                                  </select>
                                </div>
                                <div>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={component.weight}
                                    onChange={(e) =>
                                      updateGradeComponent(component.id, {
                                        weight: Number(e.target.value)
                                      })
                                    }
                                    className="text-sm"
                                  />
                                </div>
                                <div>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={component.minimumScore}
                                    onChange={(e) =>
                                      updateGradeComponent(component.id, {
                                        minimumScore: Number(e.target.value)
                                      })
                                    }
                                    className="text-sm"
                                  />
                                </div>
                                <div>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={component.totalPoints}
                                    onChange={(e) =>
                                      updateGradeComponent(component.id, {
                                        totalPoints: Number(e.target.value)
                                      })
                                    }
                                    className="text-sm"
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <input
                                      type="checkbox"
                                      id={`mandatory-${component.id}`}
                                      checked={component.isMandatory}
                                      onChange={(e) =>
                                        updateGradeComponent(component.id, {
                                          isMandatory: e.target.checked
                                        })
                                      }
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <Label
                                      htmlFor={`mandatory-${component.id}`}
                                      className="ml-2 text-xs text-gray-600"
                                    >
                                      Required
                                    </Label>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeGradeComponent(component.id)}
                                    disabled={gradeComponents.length <= 1}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>

                {!isWeightValid && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      {hasAlternativePaths ? (
                        <div className="text-yellow-800">
                          <p className="font-medium">
                            Warning: Alternative completion paths detected
                          </p>
                          <p className="text-sm mt-1">
                            At least one completion path must total 100%. Current: Midterm path ={' '}
                            {midtermPath}%, Exam path = {examPath}%
                          </p>
                          <p className="text-xs mt-2 text-yellow-700">
                            Students can complete the course through either midterms + other
                            components OR exams + other components.
                          </p>
                        </div>
                      ) : (
                        <p className="text-yellow-800">
                          Warning: Total weight is {totalWeight}%. It must equal 100%.
                        </p>
                      )}
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
                  <div>Grade Bands</div>
                  <Dialog open={isAddBandDialogOpen} onOpenChange={setIsAddBandDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Band
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Grade Band</DialogTitle>
                        <DialogDescription>
                          Define a new grade band with its value and score range.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="minScore">Min Score (%)</Label>
                            <Input
                              id="minScore"
                              type="number"
                              min="0"
                              max="100"
                              placeholder="e.g., 50"
                              value={newGradeBand.minScore || ''}
                              onChange={(e) =>
                                setNewGradeBand((prev) => ({
                                  ...prev,
                                  minScore: parseInt(e.target.value) || 0
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="maxScore">Max Score (%)</Label>
                            <Input
                              id="maxScore"
                              type="number"
                              min="0"
                              max="100"
                              placeholder="e.g., 59"
                              value={newGradeBand.maxScore || ''}
                              onChange={(e) =>
                                setNewGradeBand((prev) => ({
                                  ...prev,
                                  maxScore: parseInt(e.target.value) || 0
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="gradeValue">Grade Value</Label>
                            <Input
                              id="gradeValue"
                              type="number"
                              min="1"
                              max="10"
                              placeholder="e.g., 5"
                              value={newGradeBand.gradeValue || ''}
                              onChange={(e) =>
                                setNewGradeBand((prev) => ({
                                  ...prev,
                                  gradeValue: parseInt(e.target.value) || 0
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={addGradeBand}>Add Band</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
                <CardDescription>
                  Set grade boundaries and grade values. Click on any field to edit existing bands.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {gradeBands && gradeBands.length > 0 ? (
                  <div className="space-y-4">
                    {/* Table Header */}
                    <div className="grid grid-cols-4 gap-4 items-center p-3 bg-gray-100 border rounded-t font-medium text-sm text-gray-700">
                      <div>Min Score (%)</div>
                      <div>Max Score (%)</div>
                      <div>Grade Value</div>
                      <div>Actions</div>
                    </div>

                    {/* Existing Grade Bands - Editable */}
                    <div className="space-y-1">
                      {gradeBands
                        .sort((a, b) => b.gradeValue - a.gradeValue)
                        .map((band) => (
                          <div
                            key={band.id}
                            className="grid grid-cols-4 gap-4 items-center p-3 border border-gray-200 bg-white hover:bg-gray-50"
                          >
                            <div>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={band.minScore}
                                onChange={(e) => {
                                  const newValue = parseInt(e.target.value) || 0;
                                  setGradeBands((prev) =>
                                    prev.map((b) =>
                                      b.id === band.id ? { ...b, minScore: newValue } : b
                                    )
                                  );
                                }}
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={band.maxScore}
                                onChange={(e) => {
                                  const newValue = parseInt(e.target.value) || 0;
                                  setGradeBands((prev) =>
                                    prev.map((b) =>
                                      b.id === band.id ? { ...b, maxScore: newValue } : b
                                    )
                                  );
                                }}
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <Input
                                type="number"
                                min="1"
                                max="10"
                                value={band.gradeValue}
                                onChange={(e) => {
                                  const newValue = parseInt(e.target.value) || 0;
                                  setGradeBands((prev) =>
                                    prev.map((b) =>
                                      b.id === band.id ? { ...b, gradeValue: newValue } : b
                                    )
                                  );
                                }}
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeGradeBand(band.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">
                    No grade bands defined yet. Click "Add Band" to create your first grade band.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-between">
          <Button variant="outline" onClick={() => navigate('/courses')}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const currentIndex = ['basic', 'components', 'bands'].indexOf(currentTab);
                if (currentIndex > 0) {
                  setCurrentTab(['basic', 'components', 'bands'][currentIndex - 1]);
                }
              }}
              disabled={currentTab === 'basic'}
            >
              Previous
            </Button>
            {currentTab !== 'bands' ? (
              <Button
                onClick={() => {
                  const currentIndex = ['basic', 'components', 'bands'].indexOf(currentTab);
                  if (currentIndex < 2) {
                    setCurrentTab(['basic', 'components', 'bands'][currentIndex + 1]);
                  }
                }}
              >
                Next
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={createCourseMutation.isPending}>
                    {createCourseMutation.isPending ? 'Creating...' : 'Create Course'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Create Course</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to create this course? You can edit these settings
                      later.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSubmit}>Create Course</AlertDialogAction>
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
