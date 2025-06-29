import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
  DialogTitle
} from '@/components/ui/dialog';
import { Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRemoveStudentFromCourse } from '@/hooks/useQueries';
import { courseService } from '@/services/courseService';
import type { Course, CreateCourseRequest, GradeComponent, GradeBand } from '@/types/api';

const EditCoursePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState<CreateCourseRequest>({
    name: '',
    code: '',
    description: '',
    credits: 3,
    passingGrade: 50
  });

  // Grade component form
  const [newComponent, setNewComponent] = useState({
    name: '',
    category: 'Exam' as 'Midterm' | 'Exam' | 'Lab' | 'Assignment' | 'Project',
    weight: 0,
    minimumScore: 0,
    totalPoints: 100,
    isMandatory: false
  });

  // Grade band form
  const [newBand, setNewBand] = useState({
    gradeValue: 0,
    minScore: 0,
    maxScore: 0
  });

  // Edit state
  const [editingComponent, setEditingComponent] = useState<GradeComponent | null>(null);
  const [editingBand, setEditingBand] = useState<GradeBand | null>(null);
  const [isEditComponentOpen, setIsEditComponentOpen] = useState(false);
  const [isEditBandOpen, setIsEditBandOpen] = useState(false);

  // Mutations
  const removeStudentMutation = useRemoveStudentFromCourse();

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
          description: courseData.description || '',
          credits: courseData.credits || 3,
          passingGrade: courseData.passingGrade || 50
        });
      } catch (error) {
        console.error('Failed to load course:', error);
        navigate('/courses');
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
      // Ensure numeric fields are properly converted
      const submitData = {
        ...formData,
        credits: Number(formData.credits) || 3,
        passingGrade: Number(formData.passingGrade) || 50
      };

      await courseService.updateCourse(id, submitData);
      navigate(`/courses/${id}`);
    } catch (error) {
      console.error('Failed to update course:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof CreateCourseRequest, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddGradeComponent = async () => {
    if (
      !id ||
      !newComponent.name ||
      !newComponent.category ||
      newComponent.weight <= 0 ||
      newComponent.totalPoints <= 0 ||
      newComponent.minimumScore < 0
    )
      return;

    try {
      await courseService.createGradeComponent(id, newComponent);
      // Reload course to get updated components
      const updatedCourse = await courseService.getCourse(id);
      setCourse(updatedCourse);
      setNewComponent({
        name: '',
        category: 'Exam',
        weight: 0,
        minimumScore: 0,
        totalPoints: 100,
        isMandatory: false
      });
    } catch (error) {
      console.error('Failed to add grade component:', error);
    }
  };

  const handleAddGradeBand = async () => {
    if (
      !id ||
      newBand.gradeValue <= 0 ||
      newBand.minScore < 0 ||
      newBand.maxScore <= newBand.minScore
    )
      return;

    try {
      await courseService.createGradeBand(id, newBand);
      // Reload course to get updated bands
      const updatedCourse = await courseService.getCourse(id);
      setCourse(updatedCourse);
      setNewBand({ gradeValue: 0, minScore: 0, maxScore: 0 });
    } catch (error) {
      console.error('Failed to add grade band:', error);
    }
  };

  const handleDeleteCourse = async () => {
    if (!id) return;

    try {
      await courseService.deleteCourse(id);
      navigate('/courses');
    } catch (error) {
      console.error('Failed to delete course:', error);
    }
  };

  // Grade Component handlers
  const handleEditComponent = (component: GradeComponent) => {
    setEditingComponent(component);
    setIsEditComponentOpen(true);
  };
  const handleUpdateComponent = async () => {
    if (!id || !editingComponent) return;

    // Validate numeric values
    const weight = Number(editingComponent.weight);
    const minimumScore = Number(editingComponent.minimumScore);
    const totalPoints = Number(editingComponent.totalPoints);

    if (
      isNaN(weight) ||
      weight < 0 ||
      weight > 100 ||
      isNaN(minimumScore) ||
      minimumScore < 0 ||
      isNaN(totalPoints) ||
      totalPoints <= 0
    ) {
      console.error('Invalid numeric values in form');
      return;
    }

    try {
      await courseService.updateGradeComponent(id, editingComponent.id, {
        name: editingComponent.name,
        category: editingComponent.category,
        weight,
        minimumScore,
        totalPoints,
        isMandatory: editingComponent.isMandatory
      });

      // Reload course to get updated components
      const updatedCourse = await courseService.getCourse(id);
      setCourse(updatedCourse);
      setIsEditComponentOpen(false);
      setEditingComponent(null);
    } catch (error) {
      console.error('Failed to update grade component:', error);
    }
  };

  const handleDeleteComponent = async (componentId: string) => {
    if (!id) return;

    try {
      await courseService.deleteGradeComponent(id, componentId);
      // Reload course to get updated components
      const updatedCourse = await courseService.getCourse(id);
      setCourse(updatedCourse);
    } catch (error) {
      console.error('Failed to delete grade component:', error);
    }
  };

  // Grade Band handlers
  const handleEditBand = (band: GradeBand) => {
    setEditingBand(band);
    setIsEditBandOpen(true);
  };
  const handleUpdateBand = async () => {
    if (!id || !editingBand) return;

    // Validate numeric values
    const gradeValue = Number(editingBand.gradeValue);
    const minScore = Number(editingBand.minScore);
    const maxScore = Number(editingBand.maxScore);

    if (
      isNaN(gradeValue) ||
      gradeValue <= 0 ||
      isNaN(minScore) ||
      minScore < 0 ||
      minScore > 100 ||
      isNaN(maxScore) ||
      maxScore < 0 ||
      maxScore > 100 ||
      maxScore <= minScore
    ) {
      console.error('Invalid numeric values in grade band form');
      return;
    }

    try {
      await courseService.updateGradeBand(id, editingBand.id, {
        gradeValue,
        minScore,
        maxScore
      });

      // Reload course to get updated bands
      const updatedCourse = await courseService.getCourse(id);
      setCourse(updatedCourse);
      setIsEditBandOpen(false);
      setEditingBand(null);
    } catch (error) {
      console.error('Failed to update grade band:', error);
    }
  };

  const handleDeleteBand = async (bandId: string) => {
    if (!id) return;

    try {
      await courseService.deleteGradeBand(id, bandId);
      // Reload course to get updated bands
      const updatedCourse = await courseService.getCourse(id);
      setCourse(updatedCourse);
    } catch (error) {
      console.error('Failed to delete grade band:', error);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!id) return;

    try {
      await removeStudentMutation.mutateAsync({
        studentId,
        courseId: id
      });

      // Reload course to get updated enrollments
      const updatedCourse = await courseService.getCourse(id);
      setCourse(updatedCourse);
    } catch (error) {
      console.error('Failed to remove student:', error);
      alert('Failed to remove student. Please try again.');
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">Course not found</h3>
            <p className="text-gray-600 mb-4">The course you're trying to edit doesn't exist.</p>
            <Button onClick={() => navigate('/courses')}>Back to Courses</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isProfessor = user?.role === 'professor';
  const isOwner = course.professor.id === user?.id;

  if (!isProfessor || !isOwner) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600 mb-4">You don't have permission to edit this course.</p>
            <Button onClick={() => navigate('/courses')}>Back to Courses</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Course</h1>
            <p className="text-gray-600 mt-2">Manage course details, grading, and settings</p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete Course</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the course and all
                  associated assignments, grades, and enrollments.
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
                <CardDescription>Update the basic information for your course</CardDescription>
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
                        onChange={(e) => handleChange('name', e.target.value)}
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
                        onChange={(e) => handleChange('code', e.target.value)}
                        placeholder="Enter course code"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description || ''}
                      onChange={(e) => handleChange('description', e.target.value)}
                      placeholder="Enter course description"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="credits">Credits</Label>
                      <Input
                        id="credits"
                        type="number"
                        min="1"
                        max="10"
                        value={formData.credits || 3}
                        onChange={(e) => handleChange('credits', parseInt(e.target.value) || 3)}
                        placeholder="Enter credit hours"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="passingGrade">Passing Grade (%)</Label>
                      <Input
                        id="passingGrade"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={formData.passingGrade || 50}
                        onChange={(e) =>
                          handleChange('passingGrade', parseFloat(e.target.value) || 50)
                        }
                        placeholder="Enter passing grade percentage"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
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
                  <CardDescription>Define how the final grade is calculated</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {course.gradeComponents && course.gradeComponents.length > 0 ? (
                    <div className="space-y-6">
                      {(['Midterm', 'Exam', 'Lab', 'Assignment', 'Project'] as const).map(
                        (category) => {
                          const categoryComponents = course.gradeComponents.filter(
                            (comp) => comp.category?.toLowerCase() === category.toLowerCase()
                          );
                          if (categoryComponents.length === 0) return null;

                          return (
                            <div key={category} className="space-y-4">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-lg text-gray-900">{category}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {categoryComponents.length} component
                                  {categoryComponents.length !== 1 ? 's' : ''}
                                </Badge>
                              </div>
                              <div className="space-y-2">
                                {categoryComponents.map((component) => (
                                  <div
                                    key={component.id}
                                    className="flex justify-between items-center p-3 border rounded bg-gray-50"
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium">{component.name}</span>
                                        <Badge variant="outline">{component.category}</Badge>
                                        {component.isMandatory && (
                                          <Badge variant="destructive" className="text-xs">
                                            Mandatory
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        Weight: {component.weight}% | Total Points:{' '}
                                        {component.totalPoints} | Min Score:{' '}
                                        {component.minimumScore}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEditComponent(component)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button variant="outline" size="sm">
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>
                                              Delete Grade Component
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Are you sure you want to delete "{component.name}"?
                                              This action cannot be undone.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() => handleDeleteComponent(component.id)}
                                            >
                                              Delete
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No grade components defined yet</p>
                  )}

                  <div className="border-t pt-4 space-y-4">
                    <h4 className="font-medium">Add New Component</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="component-name">Component Name</Label>
                        <Input
                          id="component-name"
                          placeholder="e.g., Midterm Exam"
                          value={newComponent.name}
                          onChange={(e) =>
                            setNewComponent((prev) => ({
                              ...prev,
                              name: e.target.value
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="component-category">Category</Label>
                        <Select
                          value={newComponent.category}
                          onValueChange={(
                            value: 'Midterm' | 'Exam' | 'Lab' | 'Assignment' | 'Project'
                          ) =>
                            setNewComponent((prev) => ({
                              ...prev,
                              category: value
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Midterm">Midterm</SelectItem>
                            <SelectItem value="Exam">Exam</SelectItem>
                            <SelectItem value="Lab">Lab</SelectItem>
                            <SelectItem value="Assignment">Assignment</SelectItem>
                            <SelectItem value="Project">Project</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="component-weight">Weight (%)</Label>
                        <Input
                          id="component-weight"
                          type="number"
                          placeholder="e.g., 30"
                          min="0"
                          max="100"
                          value={newComponent.weight || ''}
                          onChange={(e) =>
                            setNewComponent((prev) => ({
                              ...prev,
                              weight: parseInt(e.target.value) || 0
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="component-total-points">Total Points</Label>
                        <Input
                          id="component-total-points"
                          type="number"
                          placeholder="e.g., 100"
                          min="1"
                          value={newComponent.totalPoints || ''}
                          onChange={(e) =>
                            setNewComponent((prev) => ({
                              ...prev,
                              totalPoints: parseInt(e.target.value) || 0
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="component-min-score">Minimum Score</Label>
                        <Input
                          id="component-min-score"
                          type="number"
                          placeholder="e.g., 50"
                          min="0"
                          value={newComponent.minimumScore || ''}
                          onChange={(e) =>
                            setNewComponent((prev) => ({
                              ...prev,
                              minimumScore: parseInt(e.target.value) || 0
                            }))
                          }
                        />
                      </div>

                      <div className="flex items-center space-x-2 pt-6">
                        <input
                          type="checkbox"
                          id="mandatory"
                          checked={newComponent.isMandatory}
                          onChange={(e) =>
                            setNewComponent((prev) => ({
                              ...prev,
                              isMandatory: e.target.checked
                            }))
                          }
                        />
                        <label htmlFor="mandatory" className="text-sm font-medium">
                          Mandatory Component
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button onClick={handleAddGradeComponent}>Add Component</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Grade Bands</CardTitle>
                  <CardDescription>Set grade boundaries and grade values</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {course.gradeBands && course.gradeBands.length > 0 ? (
                    <div className="space-y-2">
                      {course.gradeBands
                        .sort((a, b) => a.gradeValue - b.gradeValue)
                        .map((band) => (
                          <div
                            key={band.id}
                            className="flex justify-between items-center p-3 border rounded"
                          >
                            <div className="flex-1">
                              <span className="font-medium">Grade {band.gradeValue}</span>
                              <span className="text-sm text-gray-600 ml-4">
                                {band.minScore}% - {band.maxScore}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditBand(band)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Grade Band</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete Grade {band.gradeValue} (
                                      {band.minScore}% - {band.maxScore}%)? This action cannot be
                                      undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteBand(band.id)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No grade bands defined yet</p>
                  )}

                  <div className="border-t pt-4 space-y-3">
                    <h4 className="font-medium">Add New Band</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        type="number"
                        placeholder="Grade"
                        value={newBand.gradeValue || ''}
                        onChange={(e) =>
                          setNewBand((prev) => ({
                            ...prev,
                            gradeValue: parseInt(e.target.value) || 0
                          }))
                        }
                      />
                      <Input
                        type="number"
                        placeholder="Min %"
                        value={newBand.minScore || ''}
                        onChange={(e) =>
                          setNewBand((prev) => ({
                            ...prev,
                            minScore: parseInt(e.target.value) || 0
                          }))
                        }
                      />
                      <Input
                        type="number"
                        placeholder="Max %"
                        value={newBand.maxScore || ''}
                        onChange={(e) =>
                          setNewBand((prev) => ({
                            ...prev,
                            maxScore: parseInt(e.target.value) || 0
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
                <CardDescription>Manage student enrollments for this course</CardDescription>
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
                            {enrollment.student.firstName} {enrollment.student.lastName}
                          </span>
                          <p className="text-sm text-gray-600">{enrollment.student.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}
                          </span>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={removeStudentMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Student</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove {enrollment.student.firstName}{' '}
                                  {enrollment.student.lastName} from this course? This action cannot
                                  be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemoveStudent(enrollment.student.id)}
                                  disabled={removeStudentMutation.isPending}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {removeStudentMutation.isPending
                                    ? 'Removing...'
                                    : 'Remove Student'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No students enrolled yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Grade Component Dialog */}
        <Dialog open={isEditComponentOpen} onOpenChange={setIsEditComponentOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Grade Component</DialogTitle>
              <DialogDescription>
                Make changes to the grade component. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            {editingComponent && (
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-component-name">Component Name</Label>
                  <Input
                    id="edit-component-name"
                    value={editingComponent.name}
                    onChange={(e) =>
                      setEditingComponent((prev) =>
                        prev ? { ...prev, name: e.target.value } : null
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-component-category">Category</Label>
                  <Select
                    value={editingComponent.category}
                    onValueChange={(value: 'Midterm' | 'Exam' | 'Lab' | 'Assignment' | 'Project') =>
                      setEditingComponent((prev) => (prev ? { ...prev, category: value } : null))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Midterm">Midterm</SelectItem>
                      <SelectItem value="Exam">Exam</SelectItem>
                      <SelectItem value="Lab">Lab</SelectItem>
                      <SelectItem value="Assignment">Assignment</SelectItem>
                      <SelectItem value="Project">Project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-component-weight">Weight (%)</Label>
                    <Input
                      id="edit-component-weight"
                      type="number"
                      min="0"
                      max="100"
                      value={editingComponent.weight || ''}
                      onChange={(e) =>
                        setEditingComponent((prev) =>
                          prev ? { ...prev, weight: parseInt(e.target.value) || 0 } : null
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-component-total-points">Total Points</Label>
                    <Input
                      id="edit-component-total-points"
                      type="number"
                      min="1"
                      value={editingComponent.totalPoints || ''}
                      onChange={(e) =>
                        setEditingComponent((prev) =>
                          prev
                            ? {
                                ...prev,
                                totalPoints: parseInt(e.target.value) || 0
                              }
                            : null
                        )
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-component-min-score">Minimum Score</Label>
                  <Input
                    id="edit-component-min-score"
                    type="number"
                    min="0"
                    value={editingComponent.minimumScore || ''}
                    onChange={(e) =>
                      setEditingComponent((prev) =>
                        prev
                          ? {
                              ...prev,
                              minimumScore: parseInt(e.target.value) || 0
                            }
                          : null
                      )
                    }
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-mandatory"
                    checked={editingComponent.isMandatory}
                    onChange={(e) =>
                      setEditingComponent((prev) =>
                        prev ? { ...prev, isMandatory: e.target.checked } : null
                      )
                    }
                  />
                  <label htmlFor="edit-mandatory" className="text-sm font-medium">
                    Mandatory Component
                  </label>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditComponentOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleUpdateComponent}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Grade Band Dialog */}
        <Dialog open={isEditBandOpen} onOpenChange={setIsEditBandOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Grade Band</DialogTitle>
              <DialogDescription>
                Make changes to the grade band. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            {editingBand && (
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-band-grade">Grade Value</Label>
                  <Input
                    id="edit-band-grade"
                    type="number"
                    min="0"
                    value={editingBand.gradeValue || ''}
                    onChange={(e) =>
                      setEditingBand((prev) =>
                        prev
                          ? {
                              ...prev,
                              gradeValue: parseInt(e.target.value) || 0
                            }
                          : null
                      )
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-band-min">Minimum Score (%)</Label>
                    <Input
                      id="edit-band-min"
                      type="number"
                      min="0"
                      max="100"
                      value={editingBand.minScore || ''}
                      onChange={(e) =>
                        setEditingBand((prev) =>
                          prev
                            ? {
                                ...prev,
                                minScore: parseInt(e.target.value) || 0
                              }
                            : null
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-band-max">Maximum Score (%)</Label>
                    <Input
                      id="edit-band-max"
                      type="number"
                      min="0"
                      max="100"
                      value={editingBand.maxScore || ''}
                      onChange={(e) =>
                        setEditingBand((prev) =>
                          prev
                            ? {
                                ...prev,
                                maxScore: parseInt(e.target.value) || 0
                              }
                            : null
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditBandOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleUpdateBand}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default EditCoursePage;
