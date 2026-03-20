import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ChatAssistant from './ChatAssistant';
import { getStorageData } from './utils/storage';

// Mock Data
const teamMembers = [
  { id: 1, name: 'Alice Smith', initials: 'AS', skill: 'React', workload: 'yellow' },
  { id: 2, name: 'Bob Jones', initials: 'BJ', skill: 'Node.js', workload: 'red' },
  { id: 3, name: 'Charlie Day', initials: 'CD', skill: 'PostgreSQL', workload: 'green' },
  { id: 4, name: 'Diana Prince', initials: 'DP', skill: 'DevOps', workload: 'green' },
];

const tasks = [
  { id: 1, dev: 'Alice Smith', assigned: 5, completed: 3, progress: 60, status: 'On Track' },
  { id: 2, dev: 'Bob Jones', assigned: 8, completed: 2, progress: 25, status: 'At Risk' },
  { id: 3, dev: 'Charlie Day', assigned: 4, completed: 4, progress: 100, status: 'On Track' },
  { id: 4, dev: 'Diana Prince', assigned: 3, completed: 1, progress: 33, status: 'Behind' },
];

const getWorkloadColor = (workload) => {
  switch (workload) {
    case 'green': return 'bg-emerald-500';
    case 'yellow': return 'bg-amber-500';
    case 'red': return 'bg-rose-500';
    default: return 'bg-slate-500';
  }
};

const getStatusBadge = (status) => {
  switch (status) {
    case 'On Track':    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'Done':        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Behind':      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'At Risk':     return 'bg-rose-100 text-rose-800 border-rose-200';
    case 'Not Started': return 'bg-slate-100 text-slate-600 border-slate-200';
    default:            return 'bg-slate-100 text-slate-800 border-slate-200';
  }
};

const getStatusBgColor = (status) => {
  switch (status) {
    case 'On Track':    return 'bg-emerald-500';
    case 'Done':        return 'bg-emerald-500';
    case 'In Progress': return 'bg-blue-500';
    case 'Behind':      return 'bg-amber-500';
    case 'At Risk':     return 'bg-rose-500';
    case 'Not Started': return 'bg-slate-300';
    default:            return 'bg-slate-500';
  }
};

// >10% is yellow, >25% is red.
// Let's assume current completion is 75%, planned is 100%. Deficit = 25% -> RED.
const projectHealth = {
  completion: 75,
  deficit: 25, // 100 - 75
};

const getHealthColor = (deficit) => {
  if (deficit > 25) return 'border-rose-500 text-rose-600';
  if (deficit > 10) return 'border-amber-500 text-amber-600';
  return 'border-emerald-500 text-emerald-600';
};

const getHealthStrokeColor = (deficit) => {
  if (deficit > 25) return '#f43f5e'; // rose-500
  if (deficit > 10) return '#f59e0b'; // amber-500
  return '#10b981'; // emerald-500
};

export default function Dashboard() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [planData, setPlanData] = useState(null);

  React.useEffect(() => {
    const raw = getStorageData('generatedPlan');
    if (raw) {
      try {
        setPlanData(JSON.parse(raw));
      } catch(e) { console.error("Error parsing generated plan", e); }
    }
  }, []);

  const isRealData = !!planData;
  const displayProjectName = isRealData ? planData.projectName : "Frontend Core";
  const displayTeamSize = isRealData ? planData.teamMembers.length : teamMembers.length;
  const displayEstimatedDate = isRealData ? planData.estimatedCompletionDate : "2026-04-15";
  const displayTasksTotal = isRealData ? planData.tasks.length : 20;

  // Derive Team & Task Data
  let displayTeamMembers = teamMembers;
  let displayDeveloperWorkload = tasks;
  let healthCompletion = projectHealth.completion;
  let healthDeficit = projectHealth.deficit;
  let displayBudgetFormatted = '₹24k';
  let daysRemaining = 12;

  let timelineProgress = 67; // Mock default
  let timelineStart = "Oct 1, 2023";
  let timelineEnd = "Nov 15, 2023";
  let timelineRiskStr = "Low";
  let timelineRiskColorBadge = "bg-emerald-100 text-emerald-800 border-emerald-200";
  let timelineSprint = 3;

  if (isRealData) {
    if (planData.deadline) {
      const diffMs = new Date(planData.deadline) - new Date();
      daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }

    let calculatedTotalBudget = 0;
    if (planData.budget && !isNaN(Number(planData.budget))) {
      calculatedTotalBudget = Number(planData.budget);
    } else {
      let totalHours = 0;
      planData.tasks.forEach(t => {
        totalHours += (t.estimatedHours || 8);
      });
      calculatedTotalBudget = totalHours * 1500; // default rate
    }

    if (calculatedTotalBudget >= 100000) {
      displayBudgetFormatted = `₹${(calculatedTotalBudget / 100000).toFixed(1)}L`;
    } else if (calculatedTotalBudget >= 1000) {
      displayBudgetFormatted = `₹${Math.round(calculatedTotalBudget / 1000)}k`;
    } else {
      displayBudgetFormatted = `₹${calculatedTotalBudget}`;
    }

    // Read task statuses saved by the Task Board drag-and-drop
    const savedStatuses = JSON.parse(getStorageData('taskStatuses') || '{}');

    // Calculate actual completion
    const totalDone = planData.tasks.filter(t => savedStatuses[t.title] === 'Done').length;
    healthCompletion = planData.tasks.length > 0 ? Math.round((totalDone / planData.tasks.length) * 100) : 0;
    healthDeficit = 0;

    const rawStartDate = planData.startDate || new Date().toISOString();
    const rawEndDate = planData.deadline || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
     
    timelineProgress = healthCompletion; 
    timelineStart = new Date(rawStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    timelineEnd = new Date(rawEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
     
    const startMs = new Date(rawStartDate).getTime();
    const endMs = new Date(rawEndDate).getTime();
    const nowMs = Date.now();
     
    let elapsedRatio = 0;
    if (endMs > startMs) {
      elapsedRatio = Math.max(0, Math.min(100, ((nowMs - startMs) / (endMs - startMs)) * 100));
    }
     
    if (timelineProgress >= Math.floor(elapsedRatio) + 5) {
      timelineRiskStr = "Low";
      timelineRiskColorBadge = "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800";
    } else if (timelineProgress >= Math.floor(elapsedRatio) - 5) {
      timelineRiskStr = "Medium";
      timelineRiskColorBadge = "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800";
    } else {
      timelineRiskStr = "High";
      timelineRiskColorBadge = "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-400 dark:border-rose-800";
    }
     
    const weeksElapsed = Math.max(0, (nowMs - startMs) / (1000 * 60 * 60 * 24 * 7));
    timelineSprint = Math.floor(weeksElapsed / 2) + 1;

    // Group tasks by assignedDeveloper — skip tasks with no developer name
    const devStats = {};
    planData.tasks.forEach(task => {
      const dev = task.assignedDeveloper || task.assignedDevUsername;
      if (!dev) return; // skip tasks with no developer assigned
      if (!devStats[dev]) devStats[dev] = { name: dev, assigned: 0, completed: 0 };
      devStats[dev].assigned += 1;
      if (savedStatuses[task.title] === 'Done') {
        devStats[dev].completed += 1;
      }
    });

    displayDeveloperWorkload = Object.values(devStats).map((stat, i) => {
       const progress = stat.assigned > 0 ? Math.round((stat.completed / stat.assigned) * 100) : 0;
       let statusLabel;
       if (progress === 0) statusLabel = 'Not Started';
       else if (progress < 50) statusLabel = 'Behind';
       else if (progress < 100) statusLabel = 'In Progress';
       else statusLabel = 'Done';
       return {
         id: i,
         dev: stat.name,
         assigned: stat.assigned,
         completed: stat.completed,
         progress,
         status: statusLabel
       };
    });

    displayTeamMembers = planData.teamMembers.map((m, i) => ({
       id: m.id || i,
       name: m.name,
       initials: m.initials,
       workload: 'green'
    }));
  }
  
  const isCritical = healthDeficit >= 25;

  // Context to pass to the AI Assistant
  const projectContextForAI = {
    projectName: displayProjectName,
    teamSize: displayTeamSize,
    healthStatus: healthDeficit >= 25 ? 'Critical' : healthDeficit > 10 ? 'At Risk' : 'On Track',
    tasksCompleted: isRealData
      ? Object.values(JSON.parse(getStorageData('taskStatuses') || '{}')).filter(s => s === 'Done').length
      : 10,
    tasksTotal: displayTasksTotal,
    estimatedDate: displayEstimatedDate,
    topRisk: isRealData ? "None, project just started." : tasks.find(t => t.status === 'At Risk' || t.status === 'Behind')?.dev + " is behind schedule."
  };

  return (
    <div className="h-full bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 overflow-hidden flex flex-col transition-colors duration-200">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 transition-colors duration-200">
        <header className="h-16 px-8 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10 transition-colors duration-200">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Project Overview: {displayProjectName}</h1>
          <div className="flex items-center gap-4">
            <Link to="/new-project" className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition">
              Manage Project
            </Link>
          </div>
        </header>

        {!planData ? (
          <div className="flex flex-col items-center justify-center p-12 text-center h-[calc(100vh-100px)]">
             <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm max-w-md w-full">
               <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700/50 rounded-xl flex items-center justify-center mx-auto mb-6 text-slate-400">
                 <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
               </div>
               <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No project found for your account</h2>
               <p className="text-slate-500 dark:text-slate-400 mb-6">Create your first project to get started with AI-powered task management.</p>
               <Link to="/new-project" className="block w-full bg-primary-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-primary-500 transition-colors shadow-sm">
                 Create New Project
               </Link>
             </div>
          </div>
        ) : (
          <div className="p-8 max-w-7xl mx-auto space-y-8">
            
            {/* Top Row: Health Badge & Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Health Badge */}
            <div className="bg-white dark:bg-slate-800 border text-center border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm flex flex-col justify-center items-center col-span-1 min-h-[200px] transition-colors duration-200">
              <h3 className="font-semibold text-slate-600 dark:text-slate-300 mb-4 text-sm uppercase tracking-wider">Project Health</h3>
               <div className="relative flex items-center justify-center">
                 {/* SVG Circle for progress */}
                 <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                    <circle 
                      cx="64" cy="64" r="56" 
                      stroke={getHealthStrokeColor(healthDeficit)} 
                      strokeWidth="8" 
                      fill="transparent" 
                      strokeDasharray="351.858" 
                      strokeDashoffset={351.858 - (351.858 * healthCompletion) / 100}
                      className="transition-all duration-1000 ease-in-out"
                    />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-4xl font-extrabold tracking-tighter ${getHealthColor(healthDeficit)}`}>
                        {healthCompletion}%
                    </span>
                 </div>
                 {/* Pulse ring if critical */}
                 {isCritical && (
                   <span className="absolute w-32 h-32 rounded-full border border-rose-500 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] opacity-75"></span>
                 )}
               </div>
               <p className={`mt-4 text-sm font-medium ${healthDeficit >= 25 ? 'text-rose-600' : healthDeficit > 10 ? 'text-amber-600' : 'text-emerald-600'}`}>
                 {healthDeficit >= 25 ? 'Critical (Slipping > 25%)' : healthDeficit > 10 ? 'Action Needed (> 10%)' : 'On Track'}
               </p>
            </div>

            {/* 4 Metric Cards container */}
            <div className="col-span-1 lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-6">
               <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm flex flex-col justify-between transition-colors duration-200">
                 <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Days Remaining</p>
                 <p className={`text-3xl font-bold mt-2 ${daysRemaining <= 0 ? 'text-rose-500' : 'text-slate-800 dark:text-white'}`}>
                   {daysRemaining <= 0 ? 'Overdue' : daysRemaining}
                 </p>
                 <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 mt-4 rounded-full overflow-hidden">
                    <div className={`${daysRemaining <= 0 ? 'bg-rose-500' : 'bg-blue-500'} h-full w-1/3`}></div>
                 </div>
               </div>
               
               <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm flex flex-col justify-between transition-colors duration-200">
                 <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tasks Completed</p>
                 <p className="text-3xl font-bold text-slate-800 dark:text-white mt-2">
                   {isRealData
                     ? Object.values(JSON.parse(getStorageData('taskStatuses') || '{}')).filter(s => s === 'Done').length
                     : 10}
                   <span className="text-lg text-slate-400 font-normal">/{displayTasksTotal}</span>
                 </p>
                 <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 mt-4 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-500"
                      style={{ width: isRealData
                        ? `${Math.round((Object.values(JSON.parse(getStorageData('taskStatuses') || '{}')).filter(s => s === 'Done').length / Math.max(displayTasksTotal, 1)) * 100)}%`
                        : '50%'
                      }}
                    ></div>
                 </div>
               </div>

               <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm flex flex-col justify-between transition-colors duration-200">
                 <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Estimated Cost</p>
                 <p className="text-3xl font-bold text-slate-800 dark:text-white mt-2">{displayBudgetFormatted}</p>
                 <p className="text-xs font-medium text-rose-500 mt-auto pt-4 flex items-center gap-1">
                   <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                   +12% over budget
                 </p>
               </div>

               <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm flex flex-col justify-between transition-colors duration-200">
                 <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Team Size</p>
                 <p className="text-3xl font-bold text-slate-800 dark:text-white mt-2">{displayTeamSize}</p>
                 <div className="flex -space-x-2 overflow-hidden mt-4">
                    {displayTeamMembers.slice(0, 3).map(m => (
                       <div key={m.id} title={m.name} className="inline-block h-8 w-8 rounded-full ring-2 ring-white border border-slate-200 bg-slate-50 flex items-center justify-center text-xs font-semibold text-slate-500">
                        {m.initials}
                      </div>
                    ))}
                    {displayTeamSize > 3 && (
                      <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-500">
                        +{displayTeamSize - 3}
                      </div>
                    )}
                 </div>
               </div>
            </div>
          </div>

          {/* Lower Row: Table & Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Timeline Estimation Card */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm flex flex-col transition-colors duration-200 h-full">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Timeline Estimation
              </h3>
              
              <div className="flex-1 flex flex-col justify-center mb-8">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Progress</span>
                  <span className="text-2xl font-bold text-slate-800 dark:text-white">{timelineProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 mb-2 overflow-hidden shadow-inner">
                  <div className="bg-primary-500 h-full rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${timelineProgress}%` }}>
                    <div className="absolute inset-0 bg-white/20"></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-auto">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Start Date</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-4">{timelineStart}</p>
                  
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Est. Completion</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{timelineEnd}</p>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 flex flex-col">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Risk Level</p>
                  <div className="mb-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${timelineRiskColorBadge}`}>
                      {timelineRiskStr}
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Current Sprint</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 text-lg">Sprint {timelineSprint}</p>
                </div>
              </div>
            </div>

            {/* Task Progress Table */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-colors duration-200">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Developer Workload</h3>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold tracking-wider">
                      <th className="p-4 pl-6">Developer</th>
                      <th className="p-4">Tasks</th>
                      <th className="p-4 w-1/3">Progress</th>
                      <th className="p-4 pr-6 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {displayDeveloperWorkload.map(task => (
                      <tr key={task.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition duration-150">
                        <td className="p-4 pl-6 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">{task.dev}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-400">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{task.completed}</span> / {task.assigned}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              {task.progress > 0 ? (
                                <div className={`h-2 rounded-full ${getStatusBgColor(task.status)}`} style={{ width: `${task.progress}%` }}></div>
                              ) : (
                                <div className="h-2 rounded-full bg-slate-300 w-2"></div>
                              )}
                            </div>
                            <span className="text-xs font-semibold text-slate-600 min-w-[2rem]">{task.progress}%</span>
                          </div>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(task.status)}`}>
                            {task.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
          </div>
        </div>
        )}
      </main>

      {/* Floating Chat Button */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-8 right-8 w-14 h-14 bg-slate-900 border-2 border-white text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 hover:bg-slate-800 transition-all z-40 group"
          title="Open Project Assistant"
        >
          <svg className="w-6 h-6 group-hover:animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          {/* Notification Dot */}
          <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 border-2 border-white rounded-full animate-pulse"></span>
        </button>
      )}

      {/* Chat Assistant Side Panel */}
      <ChatAssistant 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        projectContext={projectContextForAI} 
      />

    </div>
  );
}
