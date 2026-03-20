import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getStorageData, setStorageData } from './utils/storage';
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
  const [teamMembers, setTeamMembers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    assignedTo: '',
    complexity: 'MEDIUM',
    hours: 8,
    tech: '',
    initialStatus: 'To Do'
  });
  
  React.useEffect(() => {
    // Load Team Members
    const rawTeam = getStorageData('teamMembers');
    if (rawTeam) {
      try {
        setTeamMembers(JSON.parse(rawTeam));
      } catch(e) { console.error("Error parsing team members", e); }
    }

    const raw = getStorageData('generatedPlan');
    if (raw) {
      try {
        const planData = JSON.parse(raw);
        if (planData.tasks && planData.tasks.length > 0) {
          const rawStatuses = getStorageData('taskStatuses');
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
  const [showSaved, setShowSaved] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  React.useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    const handleAnchorClick = (e) => {
      if (!hasUnsavedChanges) return;
      const target = e.target.closest('a');
      if (target && target.href) {
        if (!window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleAnchorClick, { capture: true });

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleAnchorClick, { capture: true });
    };
  }, [hasUnsavedChanges]);

  // Filters
  const [filterDev, setFilterDev] = useState('All');
  const [filterComplexity, setFilterComplexity] = useState('All');

  const developers = ['All', ...new Set(tasks.map(t => t.dev))];
  const complexities = ['All', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  // Apply filters
  const filteredTasks = tasks.filter(task => {
    if (filterDev !== 'All' && task.dev !== filterDev) return false;
    if (filterComplexity !== 'All' && task.complexity !== filterComplexity) return false;
    return true;
  });

  // --- SAVE PROGRESS ---
  const handleSaveProgress = () => {
    // 1. Filter out deleted tasks permanently
    const activeTasks = tasks.filter(t => !t.deleted);
    setTasks(activeTasks);

    // 2. Save statuses
    const statuses = {};
    activeTasks.forEach(t => { statuses[t.title] = t.status; });
    setStorageData('taskStatuses', JSON.stringify(statuses));

    // 3. Save to generatedPlan
    const rawPlan = getStorageData('generatedPlan');
    if (rawPlan) {
      try {
        const planData = JSON.parse(rawPlan);
        planData.tasks = activeTasks.map(t => ({
          title: t.title,
          estimatedHours: t.hours,
          complexity: t.complexity,
          requiredTech: t.tech,
          assignedDeveloper: t.dev
        }));
        setStorageData('generatedPlan', JSON.stringify(planData));
      } catch(e) { console.error("Error updating plan on save", e); }
    }

    setHasUnsavedChanges(false);
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
         const taskChanged = prev.find(t => t.id === taskId)?.status !== status;
         const nextTasks = prev.map(t => 
           t.id === taskId ? { ...t, status } : t
         );
         if (taskChanged) setHasUnsavedChanges(true);
         return nextTasks;
      });
    }
  };

  // --- DELETE TASK ---
  const handleDeleteTask = (taskId) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (!taskToDelete) return;

    setTasks(prev => {
      const nextTasks = prev.map(t => 
        t.id === taskId ? { ...t, deleted: true } : t
      );
      setHasUnsavedChanges(true);
      return nextTasks;
    });
  };

  // --- ADD TASK ---
  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.title || !newTask.assignedTo) return;

    const nameParts = newTask.assignedTo.split(' ');
    const initials = nameParts.length > 1 
      ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
      : newTask.assignedTo.slice(0, 2).toUpperCase();

    const duration = Math.max(1, Math.ceil(newTask.hours / 8));
    
    // Find the next available start day (simplified)
    const lastTask = tasks[tasks.length - 1];
    const startDay = lastTask ? lastTask.startDay + lastTask.duration : 1;

    const addedTask = {
      id: `manual_${Date.now()}`,
      title: newTask.title,
      dev: newTask.assignedTo,
      initials: initials,
      complexity: newTask.complexity,
      hours: Number(newTask.hours),
      tech: newTask.tech || 'General',
      status: newTask.initialStatus,
      startDay: startDay,
      duration: duration
    };

    setTasks(prev => [...prev, addedTask]);
    setHasUnsavedChanges(true);

    setShowAddModal(false);
    setNewTask({
      title: '',
      assignedTo: '',
      complexity: 'MEDIUM',
      hours: 8,
      tech: '',
      initialStatus: 'To Do'
    });
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
             <div className="px-3 py-1.5 bg-slate-100/80 text-slate-700 text-sm font-bold rounded-lg border border-slate-200 shadow-sm flex items-center gap-1.5 mr-1">
               <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
               Kanban Board
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

              {/* Save Progress button */}
               <button
                 onClick={handleSaveProgress}
                 className={`relative px-4 py-2 text-white text-sm font-semibold rounded-lg transition flex items-center gap-2 shadow-sm ${
                   hasUnsavedChanges 
                     ? 'bg-amber-500 hover:bg-amber-400' 
                     : 'bg-emerald-600 hover:bg-emerald-500'
                 }`}
               >
                 {hasUnsavedChanges && <span className="w-2 h-2 rounded-full bg-white animate-ping absolute -top-1 -right-1"></span>}
                 {hasUnsavedChanges && <span className="w-2 h-2 rounded-full bg-white absolute -top-1 -right-1"></span>}
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                 {hasUnsavedChanges ? 'Unsaved changes' : 'Save Progress'}
               </button>

               {/* Add Task button */}
               <button
                 onClick={() => setShowAddModal(true)}
                 className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition flex items-center gap-2 shadow-sm"
               >
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                 Add Task
               </button>
            </div>
        </div>

        {/* MAIN VIEW AREA */}

        {!getStorageData('generatedPlan') ? (
          <div className="flex flex-col items-center justify-center p-12 text-center h-[calc(100vh-200px)]">
             <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-md w-full">
               <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-6 text-slate-400">
                 <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
               </div>
               <h2 className="text-xl font-bold text-slate-900 mb-2">No project found. Create a project first.</h2>
               <p className="text-slate-500 mb-6">Create your first project to view and manage tasks.</p>
               <Link to="/new-project" className="block w-full bg-primary-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-primary-500 transition-colors shadow-sm">
                 Create New Project
               </Link>
             </div>
          </div>
        ) : (
          <>
        {/* Success Toast */}
        {showSaved && (
          <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl animate-in slide-in-from-top-2 duration-300 font-semibold">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            Progress saved!
          </div>
        )}
        
          {/* --- KANBAN BOARD --- */}
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
                      draggable={!task.deleted}
                      onDragStart={(e) => !task.deleted && handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      className={`bg-white select-none ${task.deleted ? 'opacity-50 grayscale' : 'cursor-grab active:cursor-grabbing hover:shadow-md'} border-y border-r border-slate-200 rounded-xl p-4 shadow-sm transition-shadow border-l-4 ${COMPLEXITY_STYLES[task.complexity].border}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                             <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${COMPLEXITY_STYLES[task.complexity].badge}`}>
                               {task.complexity}
                             </span>
                             {!task.deleted && (
                               <button 
                                 onClick={() => handleDeleteTask(task.id)}
                                 className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                                 title="Delete Task"
                               >
                                 <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                 </svg>
                               </button>
                             )}
                          </div>
                          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {task.hours}h
                          </span>
                       </div>
                      
                      <h4 className={`font-bold mb-4 leading-tight ${task.deleted ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
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
        </>
        )}

        {/* --- ADD TASK MODAL --- */}
        {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md relative overflow-hidden animate-in fade-in zoom-in duration-200">
               <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                  <h2 className="text-xl font-bold italic tracking-tight">Create Manual Task</h2>
                  <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white transition">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
               </div>
               
               <form onSubmit={handleAddTask} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Task Title *</label>
                    <input 
                      type="text" required
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm font-medium transition-all"
                      placeholder="Enter specific task name..."
                      value={newTask.title}
                      onChange={e => setNewTask({...newTask, title: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Assign To *</label>
                      <select 
                        required
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm font-medium transition-all bg-white"
                        value={newTask.assignedTo}
                        onChange={e => setNewTask({...newTask, assignedTo: e.target.value})}
                      >
                        <option value="">Select Developer</option>
                        {teamMembers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Complexity</label>
                      <select 
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm font-medium transition-all bg-white"
                        value={newTask.complexity}
                        onChange={e => setNewTask({...newTask, complexity: e.target.value})}
                      >
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                        <option value="CRITICAL">CRITICAL</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Estimated Hours</label>
                      <input 
                        type="number" min="1"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm font-medium transition-all"
                        value={newTask.hours}
                        onChange={e => setNewTask({...newTask, hours: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
                      <select 
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm font-medium transition-all bg-white"
                        value={newTask.initialStatus}
                        onChange={e => setNewTask({...newTask, initialStatus: e.target.value})}
                      >
                        {COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tech / Skill</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm font-medium transition-all"
                      placeholder="React, CSS, Node, etc."
                      value={newTask.tech}
                      onChange={e => setNewTask({...newTask, tech: e.target.value})}
                    />
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 px-4 py-3 bg-slate-900 text-white font-bold rounded-xl border border-transparent hover:bg-slate-800 shadow-lg shadow-slate-200 transition"
                    >
                      Add Task
                    </button>
                  </div>
               </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
