import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/layout/Header';
import { Toaster } from './components/ui/sonner';
import PageLoadingSpinner from './components/ui/PageLoadingSpinner';

// Lazy load page modules for code splitting
const LoginPage = lazy(() =>
  import('./pages/auth').then(({ LoginPage }) => ({ default: LoginPage }))
);
const RegisterPage = lazy(() =>
  import('./pages/auth').then(({ RegisterPage }) => ({ default: RegisterPage }))
);

const DashboardPage = lazy(() =>
  import('./pages/core').then(({ DashboardPage }) => ({ default: DashboardPage }))
);
const GradesPage = lazy(() =>
  import('./pages/core').then(({ GradesPage }) => ({ default: GradesPage }))
);

const CoursesPage = lazy(() =>
  import('./pages/courses').then(({ CoursesPage }) => ({ default: CoursesPage }))
);
const CourseDetailPage = lazy(() =>
  import('./pages/courses').then(({ CourseDetailPage }) => ({ default: CourseDetailPage }))
);
const CreateCoursePage = lazy(() =>
  import('./pages/courses').then(({ CreateCoursePage }) => ({ default: CreateCoursePage }))
);
const EditCoursePage = lazy(() =>
  import('./pages/courses').then(({ EditCoursePage }) => ({ default: EditCoursePage }))
);

const AssignmentsPage = lazy(() =>
  import('./pages/assignments').then(({ AssignmentsPage }) => ({ default: AssignmentsPage }))
);
const AssignmentDetailPage = lazy(() =>
  import('./pages/assignments').then(({ AssignmentDetailPage }) => ({
    default: AssignmentDetailPage
  }))
);
const CreateAssignmentPage = lazy(() =>
  import('./pages/assignments').then(({ CreateAssignmentPage }) => ({
    default: CreateAssignmentPage
  }))
);
const EditAssignmentPage = lazy(() =>
  import('./pages/assignments').then(({ EditAssignmentPage }) => ({ default: EditAssignmentPage }))
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Header />
          <main className="flex-1">
            <Suspense fallback={<PageLoadingSpinner />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Dashboard */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />

                {/* Course Routes */}
                <Route
                  path="/courses"
                  element={
                    <ProtectedRoute>
                      <CoursesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/courses/new"
                  element={
                    <ProtectedRoute requiredRole="professor">
                      <CreateCoursePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/courses/:id"
                  element={
                    <ProtectedRoute>
                      <CourseDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/courses/:id/edit"
                  element={
                    <ProtectedRoute requiredRole="professor">
                      <EditCoursePage />
                    </ProtectedRoute>
                  }
                />

                {/* Assignment Routes */}
                <Route
                  path="/assignments"
                  element={
                    <ProtectedRoute>
                      <AssignmentsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/assignments/new"
                  element={
                    <ProtectedRoute requiredRole="professor">
                      <CreateAssignmentPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/assignments/:id"
                  element={
                    <ProtectedRoute>
                      <AssignmentDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/assignments/:id/edit"
                  element={
                    <ProtectedRoute requiredRole="professor">
                      <EditAssignmentPage />
                    </ProtectedRoute>
                  }
                />

                {/* Grade Routes */}
                <Route
                  path="/grades"
                  element={
                    <ProtectedRoute>
                      <GradesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/grades/confirm/:studentId/:courseId"
                  element={
                    <ProtectedRoute requiredRole="professor">
                      <GradesPage />
                    </ProtectedRoute>
                  }
                />

                {/* Default redirect */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
          </main>
          <Toaster />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
