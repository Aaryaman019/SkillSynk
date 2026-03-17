import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

// --- MOCK DATA ---
const INITIAL_TASKS = [];

const COLUMNS = ['To Do', 'In Progress', 'Done'];

const COMPLEXITY_STYLES = {
  'LOW': { badge: 'bg-slate-100 text-slate-700 border-slate-200', border: 'border-l-slate-400', hex: '#94a3b8' },
  'MEDIUM': { badge: 'bg-blue-100 text-blue-800 border-blue-200', border: 'border-l-blue-500', hex: '#3b82f6' },
  'HIGH': { badge: 'bg-orange-100 text-orange-800 border-orange-200', border: 'border-l-orange-500', hex: '#f97316' },
  'CRITICAL': { badge: 'bg-rose-100 text-rose-800 border-rose-200', border: 'border-l-rose-500', hex: '#f43f5e' },
};

export default function TaskBoard() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  
  React.useEffect(() => {
    const raw = localStorage.getItem('generatedPlan');
    if (raw) {
      try {
        const planData = JSON.parse(raw);
        if (planData.tasks && planData.tasks.length > 0) {
          const rawStatuses = localStorage.getItem('taskStatuses');
          const savedStatuses = rawStatuses ? JSON.parse(rawStatuses) : {};
          
          // Keep track of chronological start days for the Gantt view
          let currentDay = 1;
          
          const mappedTasks = planData.tasks.map((t, idx) => {
             let devName = t.assignedDeveloper || t.assignedDevUsername;
             console.log(`TaskBoard - Task ${idx} - AI assignedDeveloper:`, t.assignedDeveloper, 'assignedDevUsername:', t.assignedDevUsername);
             if (!devName) {
                if (planData.teamMembers && planData.teamMembers.length > 0) {
                   devName = planData.teamMembers[idx % planData.teamMembers.length].name;
                } else {
                   devName = 'Unknown';
                }
                console.log(`-> Fallback assigned to:`, devName);
             }

             // Generate basic initials from developer name
             const nameParts = devName.split(' ');
             const initials = nameParts.length > 1 
                ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
                : devName.slice(0, 2).toUpperCase();
                
             const duration = Math.max(1, Math.ceil(t.estimatedHours / 8)); // roughly 8 hours a day
             const startDay = currentDay;
             currentDay += duration; // simple sequential cascade for Gantt visibility
             
             return {
                id: `ai_${idx}`,
                title: t.title,
                dev: devName,
                initials: initials,
                complexity: t.complexity || 'MEDIUM',
                hours: t.estimatedHours,
                tech: t.requiredTechnology || t.requiredTech || 'General',
                status: savedStatuses[t.title] || 'To Do', // restore saved column position
                startDay: startDay,
                duration: duration
             };
          });
          setTasks(mappedTasks);
        }
      } catch(e) { console.error("Error parsing generated plan in task board", e); }
    }
  }, []);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'timeline'
  const [showSaved, setShowSaved] = useState(false);
  
  // Filters
  const [filterDev, setFilterDev] = useState('All');
  const [filterComplexity, setFilterComplexity] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const developers = ['All', ...new Set(tasks.map(t => t.dev))];
  const complexities = ['All', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  // Apply filters
  const filteredTasks = tasks.filter(task => {
    if (filterDev !== 'All' && task.dev !== filterDev) return false;
    if (filterComplexity !== 'All' && task.complexity !== filterComplexity) return false;
    if (filterStatus !== 'All' && task.status !== filterStatus) return false;
    return true;
  });

  // --- SAVE PROGRESS ---
  const handleSaveProgress = () => {
    const statuses = {};
    tasks.forEach(t => { statuses[t.title] = t.status; });
    localStorage.setItem('taskStatuses', JSON.stringify(statuses));
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId);
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow drop
    e.currentTarget.classList.add('bg-slate-100');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('bg-slate-100');
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-slate-100');
    const taskId = e.dataTransfer.getData('taskId');
    
    // Allow drop if status actually changed
    if (taskId) {
      setTasks(prev => {
         const nextTasks = prev.map(t => 
           t.id === taskId ? { ...t, status } : t
         );
         
         const newStatuses = {};
         nextTasks.forEach(t => {
             newStatuses[t.title] = t.status;
         });
         localStorage.setItem('taskStatuses', JSON.stringify(newStatuses));
         
         return nextTasks;
      });
    }
  };

  // --- TIMELINE CHART DATA TRANSFORM ---
  // Recharts BarChart needs data grouped by Y-axis category (Developer).
  // We format it so each Developer has an array of "segments".
  
  const generateTimelineData = () => {
    const devDataMap = {};
    
    // Initialize map
    developers.filter(d => d !== 'All').forEach(dev => {
      devDataMap[dev] = { name: dev };
    });

    filteredTasks.forEach((task, index) => {
      // In a real Gantt, we'd use Custom shapes in Recharts to cleanly offset bars.
      // For a BarChart hack, we stack transparent bars to push real bars forward.
      // E.g., task1_offset, task1_duration, task2_offset, task2_duration
      const devRow = devDataMap[task.dev];
      
      // Calculate delay before this task starts (offset)
      const offsetKey = `offset_${task.id}`;
      const durationKey = `dur_${task.id}`;
      devRow[offsetKey] = task.startDay;
      devRow[durationKey] = task.duration;
      devRow[`color_${task.id}`] = COMPLEXITY_STYLES[task.complexity].hex;
      devRow[`title_${task.id}`] = task.title;
    });
    
    return Object.values(devDataMap);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Find the specific bar segment being hovered by looking at `payload[0]` which contains the active dataKey
      const activeDataKey = payload[0].dataKey;
      if (activeDataKey && !activeDataKey.startsWith('offset_')) {
        const taskId = activeDataKey.replace('dur_', '');
        const title = payload[0].payload[`title_${taskId}`];
        const duration = payload[0].payload[`dur_${taskId}`];
        return (
          <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg">
            <p className="font-bold text-slate-800">{title}</p>
            <p className="text-sm text-slate-600">Developer: {label}</p>
            <p className="text-sm text-slate-600">Duration: {duration} days</p>
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl w-full mx-auto space-y-6">
        
        {/* Header & Controls */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              Project Tasks
            </h1>
            <p className="text-sm text-slate-500 mt-1">Manage and track team workload</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
             {/* View Toggle */}
             <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 mr-2">
               <button 
                 onClick={() => setViewMode('kanban')}
                 className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${viewMode === 'kanban' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
               >
                 Kanban Board
               </button>
               <button 
                 onClick={() => setViewMode('timeline')}
                 className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${viewMode === 'timeline' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
               >
                 Timeline
               </button>
             </div>

             {/* Filters */}
             <select 
               className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-primary-500"
               value={filterDev} onChange={(e) => setFilterDev(e.target.value)}
             >
               {developers.map(d => <option key={d} value={d}>{d}</option>)}
             </select>

             <select 
               className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-primary-500"
               value={filterComplexity} onChange={(e) => setFilterComplexity(e.target.value)}
             >
               {complexities.map(c => <option key={c} value={c}>{c === 'All' ? 'All Complexities' : c}</option>)}
             </select>

              {/* Status filter */}
              <select 
                className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                disabled={viewMode === 'kanban'}
              >
                <option value="All">All Statuses</option>
                {COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              {/* Save Progress button */}
              <button
                onClick={handleSaveProgress}
                className="ml-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition flex items-center gap-2 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Save Progress
              </button>
           </div>
        </div>

        {/* MAIN VIEW AREA */}

        {/* Success Toast */}
        {showSaved && (
          <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl animate-in slide-in-from-top-2 duration-300 font-semibold">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            Progress saved!
          </div>
        )}
        {viewMode === 'kanban' ? (
          /* --- KANBAN BOARD --- */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
            {COLUMNS.map(columnId => (
              <div 
                key={columnId}
                className="bg-slate-200/50 border border-slate-200 rounded-2xl flex flex-col overflow-hidden transition-colors"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, columnId)}
              >
                {/* Column Header */}
                <div className="p-4 border-b border-slate-200 bg-white/50 backdrop-blur-sm flex justify-between items-center">
                  <h3 className="font-bold text-slate-700">{columnId}</h3>
                  <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">
                    {filteredTasks.filter(t => t.status === columnId).length}
                  </span>
                </div>
                
                {/* Column Tasks */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  {filteredTasks.filter(t => t.status === columnId).map(task => (
                    
                    /* TASK CARD */
                    <div 
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      className={`bg-white select-none cursor-grab active:cursor-grabbing border-y border-r border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border-l-4 ${COMPLEXITY_STYLES[task.complexity].border}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                         <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${COMPLEXITY_STYLES[task.complexity].badge}`}>
                           {task.complexity}
                         </span>
                         <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                           <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                           {task.hours}h
                         </span>
                      </div>
                      
                      <h4 className="font-bold text-slate-800 mb-4 leading-tight">
                        {task.title}
                      </h4>
                      
                      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded-full bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center">
                             {task.initials}
                           </div>
                           <span className="text-xs font-medium text-slate-600">{task.dev}</span>
                        </div>
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded border border-slate-200">
                           {task.tech}
                        </span>
                      </div>
                    </div>

                  ))}
                  
                  {/* Empty Drop Zone Indicator */}
                  {filteredTasks.filter(t => t.status === columnId).length === 0 && (
                    <div className="h-full min-h-[100px] border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 text-sm font-medium">
                       Drop tasks here
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* --- TIMELINE CHART --- */
          <div className="bg-white border text-center border-slate-200 p-6 rounded-2xl shadow-sm h-[600px] flex flex-col">
            <h3 className="font-bold text-slate-800 mb-6 text-left">Developer Timeline (Gantt View)</h3>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                   layout="vertical" 
                   data={generateTimelineData()} 
                   margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" textAnchor="end" tick={{fill: '#64748b', fontSize: 12}} domain={[0, 'dataMax + 2']} label={{ value: 'Project Timeline (Days)', position: 'insideBottomRight', offset: -10 }}/>
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 13, fontWeight: 'bold'}} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(241, 245, 249, 0.4)'}} />
                  
                  {/* 
                     We map over all tasks to create stacked bars.
                     For real React/Recharts, doing custom shaped bars is better, but stacking 
                     a transparent offset followed by the real bar gives a pseudo-Gantt effect.
                  */}
                  {tasks.map((task) => (
                    <React.Fragment key={task.id}>
                      {/* Transparent bar for offset */}
                      <Bar dataKey={`offset_${task.id}`} stackId={task.dev} fill="transparent" />
                      {/* Actual duration bar */}
                      <Bar dataKey={`dur_${task.id}`} stackId={task.dev} fill={COMPLEXITY_STYLES[task.complexity].hex} radius={[4, 4, 4, 4]} />
                    </React.Fragment>
                  ))}

                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
