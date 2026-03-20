import React from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './Dashboard';
import NewProjectForm from './NewProjectForm';
import TaskBoard from './TaskBoard';
import CostAnalysis from './CostAnalysis';
import AppSidebar from './AppSidebar';

import LandingPage from './LandingPage';
import AuthPage from './AuthPage';

function DemoBanner() {
  const isDemo = localStorage.getItem('demoMode') === 'true';
  const navigate = useNavigate();
  const location = useLocation();
  
  if (!isDemo || location.pathname === '/' || location.pathname === '/auth') return null;

  const handleAuthRedirect = () => {
    localStorage.removeItem('demoMode');
    localStorage.removeItem('demo_generatedPlan');
    localStorage.removeItem('demo_teamMembers');
    localStorage.removeItem('demo_taskStatuses');
    navigate('/auth');
  };

  return (
    <div className="bg-primary-600 text-white py-2 px-4 flex items-center justify-center gap-4 text-sm font-medium sticky top-0 z-[110] shadow-md animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>You're viewing a demo — Your changes won't be saved.</span>
      </div>
      <button 
        onClick={handleAuthRedirect}
        className="bg-white text-primary-600 px-3 py-1 rounded-full text-xs font-bold hover:bg-slate-100 transition-colors shadow-sm"
      >
        Sign Up to Save Data
      </button>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
        {/* Global Sidebar */}
        <AppSidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <DemoBanner />
          <div className="flex-1 overflow-y-auto">
            <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/demo-dashboard" element={<Dashboard />} />
            <Route path="/new-project" element={<NewProjectForm />} />
            <Route path="/tasks" element={<TaskBoard />} />
            <Route path="/cost-analysis" element={<CostAnalysis />} />
          </Routes>
        </div>
      </div>
    </div>
    </BrowserRouter>
  );
}

export default App;
