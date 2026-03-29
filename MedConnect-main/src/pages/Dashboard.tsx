import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import PatientDashboard from '../components/dashboard/PatientDashboard';
import ResearcherDashboard from '../components/dashboard/ResearcherDashboard';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return user.userType === 'patient' ? <PatientDashboard /> : <ResearcherDashboard />;
};

export default Dashboard;