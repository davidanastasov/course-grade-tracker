import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProfessorDashboard from '@/components/dashboard/ProfessorDashboard';
import StudentDashboard from '@/components/dashboard/StudentDashboard';

const DashboardPage: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="mt-2 text-gray-600">Please log in to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.firstName}!</h1>
          <p className="mt-2 text-gray-600">
            {user.role === 'professor'
              ? 'Manage your courses, track student progress, and confirm grades.'
              : 'Track your course progress, submit grades, and view your academic journey.'}
          </p>
        </div>

        {user.role === 'professor' ? <ProfessorDashboard /> : <StudentDashboard />}
      </div>
    </div>
  );
};

export default DashboardPage;
