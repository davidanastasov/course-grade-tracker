import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/layout/Header';
import { Toaster } from './components/ui/sonner';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CoursesPage from './pages/CoursesPage';
import CreateCoursePage from './pages/CreateCoursePage';
import EditCoursePage from './pages/EditCoursePage';
import AssignmentsPage from './pages/AssignmentsPage';
import CreateAssignmentPage from './pages/CreateAssignmentPage';
import AssignmentDetailPage from './pages/AssignmentDetailPage';
import EditAssignmentPage from './pages/EditAssignmentPage';
import GradesPage from './pages/GradesPage';
import CourseDetailPage from './pages/CourseDetailPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Header />
          <main className="flex-1">
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
          </main>
          <Toaster />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
