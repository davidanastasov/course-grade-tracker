import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import { StudentGradeTracking } from '../components/grade/StudentGradeTracking';
import {
  useCourse,
  useCourseStudents,
  useCourseAssignments,
  useProjectedGrade,
  useGradesSummary,
  useCreateGradeComponent,
  useConfirmGrade
} from '../hooks/useQueries';
import {
  BookOpen,
  Users,
  FileText,
  TrendingUp,
  Settings,
  Plus,
  AlertTriangle,
  GraduationCap,
  Calendar
} from 'lucide-react';
import type { Assignment, User, GradeComponent, GradeBand, Course } from '../types/api';

const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { data: course, isLoading: courseLoading } = useCourse(id!);
  const { data: students = [] } = useCourseStudents(id!);
  const { data: assignments = [] } = useCourseAssignments(id!);
  const { data: gradesSummary = [] } = useGradesSummary(id!);
  const { data: projectedGrade } = useProjectedGrade(
    id!,
    user?.role === 'student' ? user.id : undefined
  );

  const isProfessor = user?.role === 'professor';

  if (courseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Course Not Found</h1>
          <p className="mt-2 text-gray-600">The course you're looking for doesn't exist.</p>
          <Button asChild className="mt-4">
            <Link to="/courses">Back to Courses</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Header */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="px-6 py-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{course.name}</h1>
                  <Badge variant="secondary" className="text-sm">
                    {course.code}
                  </Badge>
                </div>
                <p className="text-gray-600 mb-4">
                  {course.description || 'No description available'}
                </p>
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    <span>
                      Prof. {course.professor.firstName} {course.professor.lastName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{students.length} students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>{assignments.length} assignments</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {isProfessor ? (
                  <>
                    <Button asChild variant="outline">
                      <Link to={`/courses/${course.id}/edit`}>
                        <Settings className="h-4 w-4 mr-2" />
                        Manage Course
                      </Link>
                    </Button>
                    <Button asChild>
                      <Link to={`/assignments/new?courseId=${course.id}`}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Assignment
                      </Link>
                    </Button>
                  </>
                ) : (
                  <Button asChild variant="outline">
                    <Link to="/courses">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Back to Courses
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Student Grade Overview */}
        {!isProfessor && projectedGrade && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Your Grade Projection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {projectedGrade.projectedGrade?.toFixed(1)}%
                  </div>
                  <p className="text-sm text-gray-600">Projected Grade</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-green-600">
                    {projectedGrade.completedComponents?.length || 0}
                  </div>
                  <p className="text-sm text-gray-600">Components Done</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-orange-600">
                    {projectedGrade.missingComponents?.length || 0}
                  </div>
                  <p className="text-sm text-gray-600">Missing Components</p>
                </div>
                <div className="text-center">
                  <div
                    className={`text-2xl font-semibold ${
                      projectedGrade.isEligible ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {projectedGrade.isEligible ? '✓' : '✗'}
                  </div>
                  <p className="text-sm text-gray-600">Eligible for Final</p>
                </div>
              </div>
              {projectedGrade.warnings && projectedGrade.warnings.length > 0 && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <h4 className="font-medium text-yellow-800">Warnings</h4>
                  </div>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {projectedGrade.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue={isProfessor ? 'overview' : 'assignments'} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value={isProfessor ? 'students' : 'grades'}>
              {isProfessor ? 'Students' : 'Grades'}
            </TabsTrigger>
            <TabsTrigger value="structure">Structure</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Course Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Course Code</h4>
                    <p className="text-gray-600">{course.code}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Credits</h4>
                    <p className="text-gray-600">{course.credits || 3} credits</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Passing Grade</h4>
                    <p className="text-gray-600">{course.passingGrade || 50}%</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Professor</h4>
                    <p className="text-gray-600">
                      {course.professor.firstName} {course.professor.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{course.professor.email}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Course Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Students</span>
                    <span className="font-medium">{students.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Assignments</span>
                    <span className="font-medium">{assignments.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Grade Components</span>
                    <span className="font-medium">{course.gradeComponents?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Grade Bands</span>
                    <span className="font-medium">{course.gradeBands?.length || 0}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="mt-6">
            <CourseAssignments
              assignments={assignments}
              courseId={course.id}
              isProfessor={isProfessor}
            />
          </TabsContent>

          <TabsContent value={isProfessor ? 'students' : 'grades'} className="mt-6">
            {isProfessor ? (
              <StudentManagement
                students={students}
                gradesSummary={gradesSummary}
                courseId={course.id}
              />
            ) : (
              <StudentGradeTracking courseId={course.id} />
            )}
          </TabsContent>

          <TabsContent value="structure" className="mt-6">
            <CourseStructure course={course} isProfessor={isProfessor} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Sub-components would go here, but for brevity I'll create them as separate files
interface CourseAssignmentsProps {
  assignments: Assignment[];
  courseId: string;
  isProfessor: boolean;
}

const CourseAssignments: React.FC<CourseAssignmentsProps> = ({
  assignments,
  courseId,
  isProfessor
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Assignments</h2>
        {isProfessor && (
          <Button asChild>
            <Link to={`/assignments/new?courseId=${courseId}`}>
              <Plus className="h-4 w-4 mr-2" />
              Create Assignment
            </Link>
          </Button>
        )}
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments yet</h3>
            <p className="text-gray-600">
              {isProfessor
                ? 'Create your first assignment to get started.'
                : 'No assignments have been created for this course yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{assignment.title}</CardTitle>
                    <CardDescription>{assignment.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {assignment.dueDate && (
                      <Badge
                        variant={
                          new Date(assignment.dueDate) < new Date() ? 'destructive' : 'secondary'
                        }
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(assignment.dueDate).toLocaleDateString()}
                      </Badge>
                    )}
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/assignments/${assignment.id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

interface StudentManagementProps {
  students: User[];
  gradesSummary: Array<{
    student: {
      id: string;
      firstName: string;
      lastName: string;
      username: string;
    };
    projectedGrade: number;
    isEligible: boolean;
    completedComponents: number;
    totalComponents: number;
    finalGrade?: number;
    confirmed: boolean;
  }>;
  courseId: string;
}

const StudentManagement: React.FC<StudentManagementProps> = ({
  students,
  gradesSummary,
  courseId
}) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Student Management</h2>

      {students.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No students enrolled</h3>
            <p className="text-gray-600">
              Students will appear here once they enroll in your course.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {students.map((student) => {
            const summary = gradesSummary.find((s) => s.student.id === student.id);
            return (
              <Card key={student.id}>
                <CardContent className="flex justify-between items-center p-6">
                  <div>
                    <h3 className="font-medium">
                      {student.firstName} {student.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {student.username} • {student.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {summary && (
                      <>
                        <div className="text-right">
                          <div className="font-medium">{summary.projectedGrade?.toFixed(1)}%</div>
                          <div className="text-sm text-gray-600">Projected</div>
                        </div>
                        <Badge variant={summary.isEligible ? 'default' : 'destructive'}>
                          {summary.isEligible ? 'Eligible' : 'Not Eligible'}
                        </Badge>
                      </>
                    )}
                    <div className="flex gap-2">
                      <SetFinalGradeDialog student={student} courseId={courseId} />
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/grades/confirm/${student.id}/${courseId}`}>Confirm Grades</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface CourseStructureProps {
  course: Course;
  isProfessor: boolean;
}

const CourseStructure: React.FC<CourseStructureProps> = ({ course, isProfessor }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Course Structure</h2>
        {isProfessor && (
          <Button asChild variant="outline">
            <Link to={`/courses/${course.id}/edit`}>Edit Structure</Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Grade Components</CardTitle>
                <CardDescription>How grades are calculated</CardDescription>
              </div>
              {isProfessor && <AddGradeComponentDialog courseId={course.id} />}
            </div>
          </CardHeader>
          <CardContent>
            {course.gradeComponents?.length === 0 ? (
              <p className="text-gray-600">No grade components defined</p>
            ) : (
              <div className="space-y-6">
                {(() => {
                  // Group components by category
                  const groupedComponents =
                    course.gradeComponents?.reduce(
                      (acc, component) => {
                        const category = component.category || component.type || 'Other';
                        if (!acc[category]) {
                          acc[category] = [];
                        }
                        acc[category].push(component);
                        return acc;
                      },
                      {} as Record<string, GradeComponent[]>
                    ) || {};

                  // Define category order and display names
                  const categoryOrder: Array<
                    'Midterm' | 'Exam' | 'Lab' | 'Assignment' | 'Project'
                  > = ['Midterm', 'Exam', 'Lab', 'Assignment', 'Project'];
                  const categoryDisplayNames: Record<
                    'Midterm' | 'Exam' | 'Lab' | 'Assignment' | 'Project',
                    string
                  > = {
                    Midterm: 'Midterm Exams',
                    Exam: 'Final Exams',
                    Lab: 'Lab Work',
                    Assignment: 'Assignments',
                    Project: 'Projects'
                  };

                  return categoryOrder
                    .map((category) => {
                      const components = groupedComponents[category];
                      if (!components || components.length === 0) return null;

                      // Calculate category totals
                      const totalWeight = components.reduce(
                        (sum, comp) => sum + Number(comp.weight),
                        0
                      );
                      const totalPoints = components.reduce(
                        (sum, comp) => sum + Number(comp.totalPoints),
                        0
                      );

                      const sectionContent = (
                        <div key={category} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-3">
                              <h4 className="font-semibold text-lg text-gray-900">
                                {categoryDisplayNames[
                                  category as keyof typeof categoryDisplayNames
                                ] || category}
                              </h4>
                              <Badge variant="outline" className="text-sm">
                                {components.length} component{components.length !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Total: {totalWeight}%</span>
                              <span className="mx-2">•</span>
                              <span>{totalPoints} points</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {components.map((component: GradeComponent) => (
                              <div key={component.id} className="border rounded-lg p-3 bg-white">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium">{component.name}</span>
                                      {component.isMandatory && (
                                        <Badge variant="destructive" className="text-xs">
                                          Mandatory
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1">
                                      <p>
                                        Weight: {component.weight}% | Total Points:{' '}
                                        {component.totalPoints}
                                      </p>
                                      <p>Minimum Required: {component.minimumScore} points</p>
                                    </div>
                                  </div>
                                  {isProfessor && (
                                    <div className="flex gap-1">
                                      <Button variant="outline" size="sm">
                                        Edit
                                      </Button>
                                      <Button variant="destructive" size="sm">
                                        Delete
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );

                      // Check if we need to add "or" after this section
                      const shouldAddOr =
                        category === 'Midterm' &&
                        groupedComponents['Exam'] &&
                        groupedComponents['Exam'].length > 0;

                      return (
                        <React.Fragment key={category}>
                          {sectionContent}
                          {shouldAddOr && (
                            <div className="flex justify-center items-center py-2">
                              <span className="text-gray-500 font-medium text-sm bg-gray-100 px-3 py-1 rounded">
                                or
                              </span>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })
                    .filter(Boolean);
                })()}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grade Bands</CardTitle>
            <CardDescription>Grade scale for final marks</CardDescription>
          </CardHeader>
          <CardContent>
            {course.gradeBands?.length === 0 ? (
              <p className="text-gray-600">No grade bands defined</p>
            ) : (
              <div className="space-y-2">
                {course.gradeBands
                  ?.sort((a, b) => b.gradeValue - a.gradeValue)
                  .map((band: GradeBand) => (
                    <div key={band.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">
                            {band.minScore}% - {band.maxScore}%
                          </span>
                          <p className="text-sm text-gray-600">
                            Grade: {band.gradeValue} (Integer value)
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{band.gradeValue}</Badge>
                          {isProfessor && (
                            <div className="flex gap-1">
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                              <Button variant="destructive" size="sm">
                                Delete
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
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

interface AddGradeComponentDialogProps {
  courseId: string;
}

const AddGradeComponentDialog: React.FC<AddGradeComponentDialogProps> = ({ courseId }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '' as 'Lab' | 'Assignment' | 'Midterm' | 'Exam' | 'Project',
    weight: '',
    minimumScore: '',
    totalPoints: '',
    isMandatory: false
  });

  const createGradeComponent = useCreateGradeComponent();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createGradeComponent.mutateAsync({
        courseId,
        data: {
          name: formData.name,
          category: formData.category,
          weight: Number(formData.weight),
          minimumScore: Number(formData.minimumScore),
          totalPoints: Number(formData.totalPoints),
          isMandatory: formData.isMandatory
        }
      });

      // Reset form and close dialog
      setFormData({
        name: '',
        category: '' as 'Lab' | 'Assignment' | 'Midterm' | 'Exam' | 'Project',
        weight: '',
        minimumScore: '',
        totalPoints: '',
        isMandatory: false
      });
      setOpen(false);
    } catch (error) {
      console.error('Failed to create grade component:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Component
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Grade Component</DialogTitle>
          <DialogDescription>
            Create a new grade component for this course. Students will earn points in this
            component that contribute to their final grade.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Component Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Lab Work, Midterm Exam"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value: 'Lab' | 'Assignment' | 'Midterm' | 'Exam' | 'Project') =>
                  setFormData((prev) => ({ ...prev, category: value }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lab">Lab</SelectItem>
                  <SelectItem value="Assignment">Assignment</SelectItem>
                  <SelectItem value="Midterm">Midterm</SelectItem>
                  <SelectItem value="Exam">Exam</SelectItem>
                  <SelectItem value="Project">Project</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (%)</Label>
              <Input
                id="weight"
                type="number"
                min="0"
                max="100"
                value={formData.weight}
                onChange={(e) => setFormData((prev) => ({ ...prev, weight: e.target.value }))}
                placeholder="25"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalPoints">Total Points</Label>
              <Input
                id="totalPoints"
                type="number"
                min="1"
                value={formData.totalPoints}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    totalPoints: e.target.value
                  }))
                }
                placeholder="100"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minimumScore">Min Required</Label>
              <Input
                id="minimumScore"
                type="number"
                min="0"
                value={formData.minimumScore}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    minimumScore: e.target.value
                  }))
                }
                placeholder="50"
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isMandatory"
              checked={formData.isMandatory}
              onCheckedChange={(checked: boolean) =>
                setFormData((prev) => ({ ...prev, isMandatory: checked }))
              }
            />
            <Label htmlFor="isMandatory">This component is mandatory for passing the course</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createGradeComponent.isPending}>
              {createGradeComponent.isPending ? 'Creating...' : 'Create Component'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

interface SetFinalGradeDialogProps {
  student: User;
  courseId: string;
}

const SetFinalGradeDialog: React.FC<SetFinalGradeDialogProps> = ({ student, courseId }) => {
  const [open, setOpen] = useState(false);
  const [finalGrade, setFinalGrade] = useState('');
  const [notes, setNotes] = useState('');

  const confirmGrade = useConfirmGrade();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const gradeValue = Number(finalGrade);
    if (gradeValue < 5 || gradeValue > 10) {
      alert('Grade must be between 5 and 10');
      return;
    }

    try {
      await confirmGrade.mutateAsync({
        studentId: student.id,
        courseId,
        finalGrade: gradeValue,
        notes: notes || undefined
      });

      // Reset form and close dialog
      setFinalGrade('');
      setNotes('');
      setOpen(false);
    } catch (error) {
      console.error('Failed to set final grade:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          Set Final Grade
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Set Final Grade</DialogTitle>
          <DialogDescription>
            Set the final grade for {student.firstName} {student.lastName}. Grade must be between
            5-10.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="finalGrade">Final Grade (5-10)</Label>
            <Input
              id="finalGrade"
              type="number"
              min="5"
              max="10"
              step="0.1"
              value={finalGrade}
              onChange={(e) => setFinalGrade(e.target.value)}
              placeholder="8.5"
              required
            />
            <p className="text-sm text-gray-600">Enter a grade between 5.0 and 10.0</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional comments about the grade..."
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={confirmGrade.isPending}>
              {confirmGrade.isPending ? 'Setting Grade...' : 'Set Grade'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CourseDetailPage;
