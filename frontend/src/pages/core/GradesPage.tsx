import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { gradeService } from '@/services/gradeService';
import { courseService } from '@/services/courseService';
import { userService } from '@/services/userService';
import type { Grade, Course, User } from '@/types/api';

const GradesPage: React.FC = () => {
  const { user } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<string>('all');

  // New grade form
  const [newGrade, setNewGrade] = useState({
    score: 0,
    studentId: '',
    assignmentId: '',
    gradeComponentId: ''
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        if (user?.role === 'professor') {
          const [gradesData, coursesData, studentsData] = await Promise.all([
            gradeService.getGrades(),
            courseService.getMyCourses(),
            userService.getStudents()
          ]);
          setGrades(gradesData);
          setCourses(coursesData);
          setStudents(studentsData);
        } else if (user?.role === 'student') {
          const [myGrades, coursesData] = await Promise.all([
            gradeService.getMyGrades(),
            courseService.getCourses()
          ]);
          setGrades(myGrades);
          setCourses(coursesData);
        }
      } catch (error) {
        console.error('Failed to load grades data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleFilterChange = useCallback(async () => {
    setLoading(true);
    try {
      let filteredGrades;
      if (selectedCourse !== 'all' && selectedStudent !== 'all') {
        filteredGrades = await gradeService.getGrades(selectedStudent, selectedCourse);
      } else if (selectedCourse !== 'all') {
        filteredGrades = await gradeService.getGrades(undefined, selectedCourse);
      } else if (selectedStudent !== 'all') {
        filteredGrades = await gradeService.getGrades(selectedStudent);
      } else {
        filteredGrades =
          user?.role === 'student'
            ? await gradeService.getMyGrades()
            : await gradeService.getGrades();
      }
      setGrades(filteredGrades);
    } catch (error) {
      console.error('Failed to filter grades:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCourse, selectedStudent, user]);

  // Auto-apply filters when selections change
  useEffect(() => {
    if (!loading && user && (selectedCourse !== 'all' || selectedStudent !== 'all')) {
      handleFilterChange();
    }
  }, [selectedCourse, selectedStudent, loading, user, handleFilterChange]);

  const handleCreateGrade = async () => {
    if (!newGrade.studentId || newGrade.score < 0) return;

    try {
      await gradeService.createGrade(newGrade);
      // Reload grades
      await handleFilterChange();
      // Reset form
      setNewGrade({
        score: 0,
        studentId: '',
        assignmentId: '',
        gradeComponentId: ''
      });
    } catch (error) {
      console.error('Failed to create grade:', error);
    }
  };

  const getGradeColor = (score: number, maxScore: number = 100) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const calculateAverage = (courseGrades: Grade[]) => {
    if (courseGrades.length === 0) return 0;
    const total = courseGrades.reduce((sum, grade) => sum + grade.score, 0);
    return (total / courseGrades.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const isProfessor = user?.role === 'professor';

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Grades</h1>
          <p className="text-gray-600 mt-2">
            {isProfessor
              ? 'Manage student grades and track performance'
              : 'View your grades and academic progress'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter grades by course and student</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="course-filter">Course</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="All courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All courses</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isProfessor && (
              <div className="flex-1">
                <Label htmlFor="student-filter">Student</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="All students" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All students</SelectItem>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.firstName} {student.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-end">
              <Button onClick={handleFilterChange}>Apply Filters</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Grade Form for Professors */}
      {isProfessor && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Grade</CardTitle>
            <CardDescription>Record a new grade for a student</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="student">Student</Label>
                <Select
                  value={newGrade.studentId}
                  onValueChange={(value) => setNewGrade((prev) => ({ ...prev, studentId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.firstName} {student.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="score">Score</Label>
                <Input
                  id="score"
                  type="number"
                  min="0"
                  max="100"
                  value={newGrade.score || ''}
                  onChange={(e) =>
                    setNewGrade((prev) => ({
                      ...prev,
                      score: parseFloat(e.target.value) || 0
                    }))
                  }
                  placeholder="Enter score"
                />
              </div>

              <div>
                <Label htmlFor="assignment">Assignment (Optional)</Label>
                <Input
                  id="assignment"
                  value={newGrade.assignmentId}
                  onChange={(e) =>
                    setNewGrade((prev) => ({
                      ...prev,
                      assignmentId: e.target.value
                    }))
                  }
                  placeholder="Assignment ID"
                />
              </div>

              <div className="flex items-end">
                <Button onClick={handleCreateGrade} className="w-full">
                  Add Grade
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grades Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Grades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{grades.length}</div>
            <p className="text-xs text-muted-foreground">
              {isProfessor ? 'Grades recorded' : 'Your grades'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {grades.length > 0 ? calculateAverage(grades) : '0'}%
            </div>
            <p className="text-xs text-muted-foreground">Overall performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
            <p className="text-xs text-muted-foreground">
              {isProfessor ? 'Teaching' : 'Enrolled in'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grades Table */}
      <Card>
        <CardHeader>
          <CardTitle>Grade Records</CardTitle>
          <CardDescription>
            {selectedCourse !== 'all' || selectedStudent !== 'all'
              ? 'Filtered grade records'
              : 'All grade records'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {grades.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No grades found</h3>
              <p className="text-gray-600">
                {isProfessor
                  ? 'Start by adding some grades for your students'
                  : 'No grades have been recorded yet'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {isProfessor && <TableHead>Student</TableHead>}
                  <TableHead>Course</TableHead>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grades.map((grade) => (
                  <TableRow key={grade.id}>
                    {isProfessor && (
                      <TableCell>
                        {grade.student.firstName} {grade.student.lastName}
                      </TableCell>
                    )}
                    <TableCell>{grade.assignment?.course.code || 'N/A'}</TableCell>
                    <TableCell>
                      {grade.assignment ? (
                        <Link
                          to={`/assignments/${grade.assignment.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {grade.assignment.title}
                        </Link>
                      ) : (
                        grade.gradeComponent?.name || 'Manual Entry'
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={getGradeColor(grade.score)}>{grade.score}%</span>
                    </TableCell>
                    <TableCell>{new Date(grade.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {isProfessor && (
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GradesPage;
