import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './Dashboard';
import NewProjectForm from './NewProjectForm';
import TaskBoard from './TaskBoard';
import CostAnalysis from './CostAnalysis';
import AppSidebar from './AppSidebar';

function Landing() {
  return (
    <div className="min-h-screen bg-dark-bg text-slate-100 selection:bg-primary-500/30">
      {/* Navigation */}
      <nav className="border-b border-dark-border bg-dark-surface/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-primary-500/20">
              SS
            </div>
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              SkillSynk
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">Dashboard</Link>
            <button className="btn-primary text-sm">Sign In</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <div className="text-center max-w-4xl mx-auto mb-20 space-y-8">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
            SkillSynk
            <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-purple-500 text-4xl md:text-5xl mt-2 block">
              AI-Powered Project Management
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 font-light leading-relaxed max-w-3xl mx-auto">
            The AI that tells you who should do what, how long it'll take, and what it'll cost.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-5 pt-8">
            <Link 
              to="/new-project" 
              className="bg-primary-600 hover:bg-primary-500 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg shadow-primary-500/30 transition-all transform hover:-translate-y-1 w-full sm:w-auto"
            >
              Get Started
            </Link>
            <Link 
              to="/dashboard" 
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-lg px-8 py-4 rounded-xl border border-slate-700 hover:border-slate-500 transition-all w-full sm:w-auto"
            >
              View Dashboard
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-8 rounded-2xl flex flex-col items-center text-center gap-4 transform transition duration-300 hover:-translate-y-2 hover:border-primary-500/50 hover:shadow-xl hover:shadow-primary-500/10">
            <div className="w-16 h-16 bg-primary-500/10 rounded-2xl text-primary-400 flex items-center justify-center mb-2">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white">Skill Matching</h3>
            <p className="text-slate-400 text-base leading-relaxed">
              Analyze GitHub repositories to objectively measure developer capabilities vs. self-assessments.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-8 rounded-2xl flex flex-col items-center text-center gap-4 transform transition duration-300 hover:-translate-y-2 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10">
            <div className="w-16 h-16 bg-purple-500/10 rounded-2xl text-purple-400 flex items-center justify-center mb-2">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white">Smart Assignment</h3>
            <p className="text-slate-400 text-base leading-relaxed">
              Use Claude AI to autonomously break down projects and assign tasks for optimal workload balance.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-8 rounded-2xl flex flex-col items-center text-center gap-4 transform transition duration-300 hover:-translate-y-2 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl text-emerald-400 flex items-center justify-center mb-2">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white">Live Tracking</h3>
            <p className="text-slate-400 text-base leading-relaxed">
              Monitor team health, timeline deficits, and budget pacing in real-time on the project dashboard.
            </p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center font-bold text-[10px] text-white">
              SS
            </div>
            <span className="font-bold text-slate-300">SkillSynk</span>
          </div>
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} SkillSynk Inc. All rights reserved.
          </p>
        </div>
      </footer>
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
        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Landing />} />
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
