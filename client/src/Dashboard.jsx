import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ChatAssistant from './ChatAssistant';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

// Mock Data
const progressData = [
  { name: 'Week 1', planned: 20, actual: 20 },
  { name: 'Week 2', planned: 40, actual: 35 },
  { name: 'Week 3', planned: 60, actual: 50 },
  { name: 'Week 4', planned: 80, actual: 65 },
  { name: 'Week 5', planned: 100, actual: 75 },
];

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
    const raw = localStorage.getItem('generatedPlan');
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

  if (isRealData) {
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

    // Brand new project starts at 0%
    healthCompletion = 0;
    healthDeficit = 0;

    // Read task statuses saved by the Task Board drag-and-drop
    const savedStatuses = JSON.parse(localStorage.getItem('taskStatuses') || '{}');

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
      ? Object.values(JSON.parse(localStorage.getItem('taskStatuses') || '{}')).filter(s => s === 'Done').length
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
                 <p className="text-3xl font-bold text-slate-800 dark:text-white mt-2">12</p>
                 <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 mt-4 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full w-1/3"></div>
                 </div>
               </div>
               
               <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm flex flex-col justify-between transition-colors duration-200">
                 <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tasks Completed</p>
                 <p className="text-3xl font-bold text-slate-800 dark:text-white mt-2">
                   {isRealData
                     ? Object.values(JSON.parse(localStorage.getItem('taskStatuses') || '{}')).filter(s => s === 'Done').length
                     : 10}
                   <span className="text-lg text-slate-400 font-normal">/{displayTasksTotal}</span>
                 </p>
                 <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 mt-4 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-500"
                      style={{ width: isRealData
                        ? `${Math.round((Object.values(JSON.parse(localStorage.getItem('taskStatuses') || '{}')).filter(s => s === 'Done').length / Math.max(displayTasksTotal, 1)) * 100)}%`
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
            
            {/* Timeline Chart */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm transition-colors duration-200">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                 Progress Burnup
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}/>
                    <Line type="monotone" dataKey="planned" name="Planned %" stroke="#94a3b8" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="actual" name="Actual %" stroke="#6366f1" strokeWidth={3} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
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
