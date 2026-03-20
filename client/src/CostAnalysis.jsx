import React from 'react';
import { Link } from 'react-router-dom';
import { getStorageData } from './utils/storage';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';

const DEFAULT_TOTAL_BUDGET = 2500000; // in ₹ (₹25,00,000)

const DEFAULT_COST_BREAKDOWN = [
  { name: 'Development', value: 40, color: '#3b82f6', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
  { name: 'Testing', value: 20, color: '#f59e0b', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { name: 'Design', value: 25, color: '#ec4899', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
  { name: 'Infrastructure', value: 15, color: '#10b981', icon: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01' },
];

const DEFAULT_DEVELOPER_SCORES = [
  { name: 'Alice Smith', tasks: 24, avgComplexity: 'High', score: 92, tier: 'Top Performer' },
  { name: 'Bob Jones', tasks: 18, avgComplexity: 'Medium', score: 76, tier: 'Strong' },
  { name: 'Charlie Day', tasks: 15, avgComplexity: 'Medium', score: 65, tier: 'Contributor' },
  { name: 'Diana Prince', tasks: 8, avgComplexity: 'Low', score: 42, tier: 'Learning' },
];

// Formatting Utils
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

const getTierBadge = (tier) => {
  switch(tier) {
    case 'Top Performer': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'Strong': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Contributor': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'Learning': return 'bg-slate-100 text-slate-700 border-slate-200';
    default: return 'bg-slate-100 text-slate-800';
  }
};

const getScoreColor = (score) => {
  if (score >= 90) return '#a855f7'; // purple-500
  if (score >= 70) return '#3b82f6'; // blue-500
  if (score >= 50) return '#10b981'; // emerald-500
  return '#94a3b8'; // slate-400
};

export default function CostAnalysis() {
  const [totalBudget, setTotalBudget] = React.useState(DEFAULT_TOTAL_BUDGET);
  const [costBreakdown, setCostBreakdown] = React.useState(DEFAULT_COST_BREAKDOWN);
  const [developerScores, setDeveloperScores] = React.useState(DEFAULT_DEVELOPER_SCORES);

  React.useEffect(() => {
    const raw = getStorageData('generatedPlan');
    if (raw) {
      try {
        const planData = JSON.parse(raw);
        if (planData.tasks && planData.tasks.length > 0) {
          
          if (planData.budget && !isNaN(Number(planData.budget))) {
             setTotalBudget(Number(planData.budget));
          } else {
             let totalHours = 0;
             planData.tasks.forEach(t => totalHours += (t.estimatedHours || 8));
             setTotalBudget(totalHours * 1500);
          }

          // Use fixed split requested by user
          setCostBreakdown(DEFAULT_COST_BREAKDOWN);

          // 2. Calculate Developer Contribution Index
          const savedStatuses = JSON.parse(getStorageData('taskStatuses') || '{}');
          const cxMap = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 4 };
          const devStats = {};
          
          planData.teamMembers.forEach(m => {
            devStats[m.name] = { tasks: 0, completedTasks: 0, baseScore: 0, complexitySum: 0 };
          });
          
          planData.tasks.forEach((t, idx) => {
            let dev = t.assignedDeveloper || t.assignedDevUsername;
            if (!dev) {
               if (planData.teamMembers && planData.teamMembers.length > 0) {
                  dev = planData.teamMembers[idx % planData.teamMembers.length].name;
               } else {
                  dev = 'Unknown';
               }
            }
            if (!devStats[dev]) devStats[dev] = { tasks: 0, completedTasks: 0, baseScore: 0, complexitySum: 0 };
            const m = cxMap[t.complexity?.toUpperCase()] || 2;
            devStats[dev].tasks += 1;
            devStats[dev].complexitySum += m;
            devStats[dev].baseScore += m; // base score is sum of complexity weights

            if (savedStatuses[t.title] === 'Done') {
              devStats[dev].completedTasks += 1;
            }
          });

          // Compute final combined scores
          let maxFinal = 1;
          let rawData = Object.keys(devStats).map(devName => {
             const stats = devStats[devName];
             const progressMultiplier = stats.tasks > 0 ? (stats.completedTasks / stats.tasks) : 0;
             stats.finalScore = (stats.baseScore * 0.6) + (progressMultiplier * 100 * 0.4);
             if (stats.finalScore > maxFinal) maxFinal = stats.finalScore;
             return { name: devName, stats };
          });
          
          let dynamicScores = rawData.map(item => {
            const devName = item.name;
            const stats = item.stats;
            const avgCx = stats.tasks === 0 ? 0 : stats.complexitySum / stats.tasks;
            let avgLabel = 'Low';
            if (avgCx > 3) avgLabel = 'Critical';
            else if (avgCx >= 2.5) avgLabel = 'High';
            else if (avgCx >= 1.5) avgLabel = 'Medium';
            
            // Normalize scores to 0-100 range
            const normalizedScore = Math.round((stats.finalScore / maxFinal) * 100);
            
            let tier = 'Learning';
            if (normalizedScore >= 80) tier = 'Top Performer';
            else if (normalizedScore >= 60) tier = 'Strong';
            else if (normalizedScore >= 40) tier = 'Contributor';

            return {
              name: devName,
              tasks: stats.tasks,
              avgComplexity: avgLabel,
              score: normalizedScore,
              tier: tier
            };
          });
          
          // Sort by score descending
          dynamicScores.sort((a,b) => b.score - a.score);
          setDeveloperScores(dynamicScores);
        }
      } catch(e) { console.error("Error formatting local project logic", e); }
    }
  }, []);

  // Chart tooltips
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const amount = (totalBudget * data.value) / 100;
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg">
          <p className="font-bold text-slate-800 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }}></span>
            {data.name}
          </p>
          <p className="text-sm font-semibold text-slate-600 mt-1">{formatCurrency(amount)} ({data.value}%)</p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg">
          <p className="font-bold text-slate-800">{label}</p>
          <p className="text-sm font-semibold text-slate-600 mt-1">Score: {payload[0].value} / 100</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      {!getStorageData('generatedPlan') ? (
        <div className="flex flex-col items-center justify-center p-12 text-center h-[calc(100vh-200px)]">
           <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-md w-full">
             <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-6 text-slate-400">
               <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
             </div>
             <h2 className="text-xl font-bold text-slate-900 mb-2">No project found. Create a project first.</h2>
             <p className="text-slate-500 mb-6">Create your first project to view its financial analysis.</p>
             <Link to="/new-project" className="block w-full bg-primary-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-primary-500 transition-colors shadow-sm">
               Create New Project
             </Link>
           </div>
        </div>
      ) : (
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Financial & Contribution Analysis</h1>
          <p className="text-slate-500 mt-2 text-lg">Project breakdown and advisory developer performance metrics.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* SECTION 1: COST BREAKDOWN */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col">
            <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
               <div>
                 <h2 className="text-lg font-bold text-slate-800">Project Cost Allocation</h2>
                 <p className="text-sm text-slate-500">Estimated budget distribution</p>
               </div>
               <div className="text-right">
                 <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Estimate</p>
                 <p className="text-2xl font-black text-emerald-600 mt-1">{formatCurrency(totalBudget)}</p>
               </div>
            </div>
            
            <div className="flex-1 flex flex-col items-center">
              {/* Donut Chart */}
              <div className="h-64 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={costBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {costBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text for donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Sectors</span>
                  <span className="text-2xl font-bold text-slate-800">{costBreakdown.length}</span>
                </div>
              </div>

              {/* Legend Rows */}
              <div className="w-full mt-6 space-y-3">
                {costBreakdown.map((sector) => {
                  const amount = (totalBudget * sector.value) / 100;
                  return (
                    <div key={sector.name} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-inner" style={{ backgroundColor: sector.color }}>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sector.icon} />
                          </svg>
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{sector.name}</p>
                          <p className="text-xs text-slate-500 font-medium">{sector.value}% of Budget</p>
                        </div>
                      </div>
                      <div className="text-right font-bold text-slate-700">
                        {formatCurrency(amount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 2: CONTRIBUTION INDEX */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col relative overflow-hidden">
            <div className="mb-6 border-b border-slate-100 pb-4">
               <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                 Developer Contribution Index
                 <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Internal</span>
               </h2>
               <p className="text-sm text-slate-500 mt-1">
                 Calculated via (task complexity × volume) for the current sprint.
               </p>
            </div>

            {/* Bar Chart */}
            <div className="h-64 w-full mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={developerScores}
                  margin={{ top: 0, right: 20, left: 40, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 13, fontWeight: 'bold'}} />
                  <RechartsTooltip cursor={{fill: 'rgba(241, 245, 249, 0.5)'}} content={<CustomBarTooltip />} />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={24}>
                    {developerScores.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getScoreColor(entry.score)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Table */}
            <div className="w-full overflow-x-auto flex-1 border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold tracking-wider">
                      <th className="p-3 pl-4">Developer</th>
                      <th className="p-3">Tasks</th>
                      <th className="p-3">Avg Cmplx</th>
                      <th className="p-3">Score</th>
                      <th className="p-3 pr-4 text-right">Tier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {developerScores.map(dev => (
                      <tr key={dev.name} className="hover:bg-slate-50/50 transition text-sm">
                        <td className="p-3 pl-4 font-bold text-slate-800">{dev.name}</td>
                        <td className="p-3 text-slate-600 font-medium">{dev.tasks}</td>
                        <td className="p-3 text-slate-600">{dev.avgComplexity}</td>
                        <td className="p-3 font-black" style={{ color: getScoreColor(dev.score) }}>{dev.score}</td>
                        <td className="p-3 pr-4 text-right">
                          <span className={`inline-flex px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${getTierBadge(dev.tier)}`}>
                            {dev.tier}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
              </table>
            </div>

            {/* Advisory Footer */}
            <div className="mt-6 flex items-start gap-3 bg-amber-50 rounded-lg p-3 border border-amber-200">
              <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs font-semibold text-amber-800 leading-relaxed">
                <strong className="block text-sm mb-0.5">Advisory Notice</strong>
                Contribution index is advisory only and intended solely for use in performance capability reviews. It does not represent income, salary targets, or direct compensation metrics.
              </p>
            </div>

          </div>
        </div>
      </div>
      )}
    </div>
  );
}
