import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './Dashboard';
import NewProjectForm from './NewProjectForm';
import TaskBoard from './TaskBoard';
import CostAnalysis from './CostAnalysis';
import AppSidebar from './AppSidebar';

import LandingPage from './LandingPage';
import AuthPage from './AuthPage';

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
        {/* Global Sidebar */}
        <AppSidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/new-project" element={<NewProjectForm />} />
            <Route path="/tasks" element={<TaskBoard />} />
            <Route path="/cost-analysis" element={<CostAnalysis />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
