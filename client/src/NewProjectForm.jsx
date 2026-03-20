import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setStorageData } from './utils/storage';

const mockAnalyzeProcess = [
  "Analyzing GitHub profiles...",
  "Matching skills...",
  "Estimating complexity...",
  "Assigning tasks...",
  "Generating final plan!"
];

export default function NewProjectForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    deadline: '',
    budget: '',
    techStack: []
  });
  
  const [techInput, setTechInput] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [suggestionsFetchedFor, setSuggestionsFetchedFor] = useState('');
  
  const [teamMembers, setTeamMembers] = useState([]);
  const [memberForm, setMemberForm] = useState({
    name: '',
    email: '',
    githubUrl: '',
    dailyHours: 8
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] = useState(0);

  // Auto-progress loading text
  useEffect(() => {
    if (isGenerating && generationPhase < mockAnalyzeProcess.length - 1) {
      const timer = setTimeout(() => {
        setGenerationPhase(prev => prev + 1);
      }, 1500);
      return () => clearTimeout(timer);
    }
    // We removed the mock auto-completion here, it will now wait for the actual API call to finish
  }, [isGenerating, generationPhase]);

  // Handlers for Step 1
  const handleTechAdd = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTech = techInput.trim();
      if (newTech && !formData.techStack.includes(newTech)) {
        setFormData({ ...formData, techStack: [...formData.techStack, newTech] });
      }
      setTechInput('');
    }
  };

  const removeTech = (techToRemove) => {
    setFormData({
      ...formData,
      techStack: formData.techStack.filter(tech => tech !== techToRemove)
    });
  };

  // Handlers for Step 2
  const handleAddMember = (e) => {
    e.preventDefault();
    if (!memberForm.name || !memberForm.email || !memberForm.githubUrl) return;

    // Create initials
    const nameParts = memberForm.name.split(' ');
    const initials = nameParts.length > 1 
      ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
      : memberForm.name.slice(0, 2).toUpperCase();

    setTeamMembers([...teamMembers, { ...memberForm, id: Date.now(), initials }]);
    setMemberForm({ name: '', email: '', githubUrl: '', dailyHours: 8 });
  };

  const removeMember = (id) => {
    setTeamMembers(teamMembers.filter(m => m.id !== id));
  };

  // Navigation validation
  const handleNext = async () => {
    if (step === 1) {
      if (!formData.name || !formData.description || !formData.deadline) {
        alert("Please fill out all required fields (Name, Description, Deadline) before proceeding.");
        return;
      }
      setStep(2);

      // Fetch suggestions if not already fetched for this description
      const searchKey = `${formData.name}-${formData.description}`;
      if (suggestionsFetchedFor !== searchKey) {
        setIsFetchingSuggestions(true);
        try {
          const response = await fetch('http://localhost:5005/projects/suggest-tech-stack', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: formData.name, description: formData.description })
          });
          if (response.ok) {
            const data = await response.json();
            setAiSuggestions(data.suggestions || []);
            setSuggestionsFetchedFor(searchKey);
          }
        } catch (err) {
          console.error("Failed to fetch suggestions", err);
        } finally {
          setIsFetchingSuggestions(false);
        }
      }
    } else if (step === 2) {
      if (formData.techStack.length === 0) {
        alert("Please add at least one technology to your tech stack.");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (teamMembers.length === 0) {
        alert("Please add at least one team member.");
        return;
      }
      setStep(4);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationPhase(0);

    try {
      const response = await fetch('http://localhost:5005/api/projects/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: {
            name: formData.name,
            description: formData.description,
            techStack: formData.techStack,
            deadline: formData.deadline
          },
          team: teamMembers
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Plan Generation Failed:", errorText);
        alert(`Failed to generate plan: ${errorText}`);
        setIsGenerating(false);
      } else {
        const planData = await response.json();
        console.log("Successfully generated plan from Gemini:", planData);
        
        // Save to localStorage for the Dashboard to pick up
        const fullProjectData = {
          projectName: formData.name,
          projectDescription: formData.description,
          budget: formData.budget,
          teamMembers: teamMembers,
          tasks: planData.tasks,
          estimatedCompletionDate: planData.estimatedCompletionDate,
          warnings: planData.warnings || []
        };
        setStorageData('generatedPlan', JSON.stringify(fullProjectData));
        setStorageData('teamMembers', JSON.stringify(teamMembers));

        // Force the loading phase to completely finish to show the final text, then navigate
        setGenerationPhase(mockAnalyzeProcess.length - 1);
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (err) {
      console.error("API Error connecting to generate-plan:", err);
      alert("Error connecting to the server. Is it running?");
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 py-12 px-4 sm:px-6 lg:px-8 flex flex-col pt-24">
      
      {/* Container */}
      <div className="max-w-3xl w-full mx-auto bg-white shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Header Ribbon / Progress */}
        <div className="bg-slate-900 px-8 py-6 text-white border-b border-slate-800">
          <div className="flex justify-between items-center mb-4">
             <h1 className="text-xl font-bold">New Project Setup</h1>
             <span className="text-sm font-medium text-slate-400">Step {step} of 4</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div 
              className="bg-primary-500 h-2 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-3 text-xs font-semibold text-slate-400">
             <span className={step >= 1 ? 'text-primary-400 flex items-center gap-1' : ''}>
               {step > 1 && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
               Project Details
             </span>
             <span className={step >= 2 ? 'text-primary-400 flex items-center gap-1' : ''}>
               {step > 2 && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
               Tech Stack
             </span>
             <span className={step >= 3 ? 'text-primary-400 flex items-center gap-1' : ''}>
               {step > 3 && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
               Team Assembly
             </span>
             <span className={step === 4 ? 'text-primary-400' : ''}>Review</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-8 pb-32 flex-1 relative overflow-hidden">
          
          {/* STEP 1: PROJECT DETAILS */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-2xl font-bold text-slate-800 border-b border-slate-100 pb-2">1. Project Details</h2>
              
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Project Name *</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                  placeholder="e.g. Skyline Dashboard"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Description *</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg h-28 resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                  placeholder="What is the goal of this project?"
                />
              </div>



              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Deadline *</label>
                  <input 
                    type="date" 
                    value={formData.deadline}
                    onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Budget Estimate (₹)</label>
                  <input 
                    type="number" 
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: TECH STACK */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
                  AI-Suggested Tech Stack
                </h2>
                <p className="text-sm text-slate-500">Based on your project description</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20"><path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"/></svg>
                  <h3 className="font-bold text-slate-800">AI Suggestions</h3>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200 font-semibold">Recommended</span>
                </div>

                {isFetchingSuggestions ? (
                  <div className="flex justify-center items-center py-8">
                    <svg className="animate-spin w-8 h-8 text-purple-500" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-100 pb-6">
                    {aiSuggestions.map(tech => {
                      const isSelected = formData.techStack.includes(tech);
                      return (
                        <button
                          key={tech}
                          onClick={() => {
                            if (!isSelected) {
                              setFormData({ ...formData, techStack: [...formData.techStack, tech] });
                            }
                          }}
                          disabled={isSelected}
                          className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                            isSelected 
                              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-default'
                              : 'bg-white border-2 border-primary-200 text-primary-700 hover:bg-primary-50 hover:border-primary-400 shadow-sm'
                          }`}
                        >
                          {tech}
                          {isSelected && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                          {!isSelected && <span className="text-primary-400 font-bold">+</span>}
                        </button>
                      );
                    })}
                    {aiSuggestions.length === 0 && <p className="text-sm text-slate-500">No suggestions available.</p>}
                  </div>
                )}

                <h3 className="text-sm font-semibold text-slate-700 mb-3">Your Tech Stack</h3>
                <div className="w-full border border-slate-300 rounded-lg p-2 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 transition flex flex-wrap gap-2 items-center min-h-[3rem] bg-slate-50">
                  {formData.techStack.map(tech => (
                    <span key={tech} className="bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-md text-sm font-medium flex items-center gap-1 shadow-sm">
                      {tech}
                      <button onClick={() => removeTech(tech)} className="hover:text-rose-500 focus:outline-none ml-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </span>
                  ))}
                  <div className="flex flex-1 min-w-[200px] gap-2">
                    <input 
                      type="text" 
                      value={techInput}
                      onChange={(e) => setTechInput(e.target.value)}
                      onKeyDown={handleTechAdd}
                      className="flex-1 outline-none bg-transparent text-sm py-1 px-2 border-b border-transparent focus:border-primary-300 transition"
                      placeholder="Add technology..."
                    />
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        const newTech = techInput.trim();
                        if (newTech && !formData.techStack.includes(newTech)) {
                          setFormData({ ...formData, techStack: [...formData.techStack, newTech] });
                        }
                        setTechInput('');
                      }}
                      className="px-4 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-md hover:bg-slate-50 text-slate-700 transition"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: TEAM MEMBERS */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col">
              <h2 className="text-2xl font-bold text-slate-800 border-b border-slate-100 pb-2">2. Assembler Team</h2>
              
              {/* Added Members List */}
              <div className="flex-1 overflow-y-auto mb-6 pr-2">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Current Roster ({teamMembers.length})</h3>
                {teamMembers.length === 0 ? (
                  <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center">
                    <p className="text-slate-500 text-sm">No team members added yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teamMembers.map(member => (
                      <div key={member.id} className="bg-white border text-left border-slate-200 rounded-xl p-4 flex items-start gap-4 shadow-sm relative group">
                        <div className="w-10 h-10 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center shrink-0">
                          {member.initials}
                        </div>
                        <div className="min-w-0 pr-6">
                           <p className="font-bold text-slate-800 truncate">{member.name}</p>
                           <p className="text-xs text-slate-500 truncate">{member.email}</p>
                           <div className="mt-2 flex gap-2">
                             <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                               {member.dailyHours} hrs/day
                             </span>
                           </div>
                        </div>
                        <button 
                          onClick={() => removeMember(member.id)}
                          className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 outline-none"
                          title="Remove member"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Member Form */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 border-t-4 border-t-primary-500 flex-shrink-0">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Add Developer</h3>
                <form onSubmit={handleAddMember} className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Full Name *</label>
                    <input 
                      type="text" required
                      value={memberForm.name}
                      onChange={(e) => setMemberForm({...memberForm, name: e.target.value})}
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Email *</label>
                    <input 
                      type="email" required
                      value={memberForm.email}
                      onChange={(e) => setMemberForm({...memberForm, email: e.target.value})}
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">GitHub Profile URL *</label>
                    <input 
                      type="url" required
                      value={memberForm.githubUrl}
                      onChange={(e) => setMemberForm({...memberForm, githubUrl: e.target.value})}
                      placeholder="https://github.com/username"
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Daily Availability (Hrs)</label>
                    <input 
                      type="number" min="1" max="24" required
                      value={memberForm.dailyHours}
                      onChange={(e) => setMemberForm({...memberForm, dailyHours: parseInt(e.target.value)})}
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div className="col-span-2 mt-2">
                    <button type="submit" className="w-full bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold py-2 rounded-lg text-sm transition">
                      + Add to Team
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & GENERATE */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
               {isGenerating ? (
                 <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
                    <div className="relative w-24 h-24 mb-8">
                       <svg className="animate-spin w-full h-full text-slate-200" viewBox="0 0 24 24">
                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                       </svg>
                       <div className="absolute inset-0 flex items-center justify-center font-bold text-xl text-primary-600">
                         {Math.round((generationPhase / (mockAnalyzeProcess.length - 1)) * 100)}%
                       </div>
                    </div>
                    <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-purple-600 mb-2">
                      Initializing SkillSynk AI
                    </h3>
                    <p className="text-lg text-slate-600 font-medium h-8 transition-all animate-[pulse_1s_ease-in-out_infinite]">
                      {mockAnalyzeProcess[generationPhase]}
                    </p>
                 </div>
               ) : (
                <>
                  <h2 className="text-2xl font-bold text-slate-800 border-b border-slate-100 pb-2">3. Review Details</h2>
                  
                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Project Scope</h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                      <div>
                        <p className="text-xs font-semibold text-slate-500">Name</p>
                        <p className="font-bold text-slate-800 text-lg">{formData.name}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500">Deadline</p>
                        <p className="font-bold text-slate-800">{formData.deadline}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs font-semibold text-slate-500">Description</p>
                        <p className="text-sm text-slate-700 mt-1">{formData.description}</p>
                      </div>
                      <div className="col-span-2">
                         <p className="text-xs font-semibold text-slate-500 mb-1.5">Tech Stack</p>
                         <div className="flex gap-2 flex-wrap">
                           {formData.techStack.map(t => <span key={t} className="bg-primary-50 text-primary-700 border border-primary-200 px-2.5 py-1 rounded text-xs font-bold">{t}</span>)}
                         </div>
                      </div>
                    </div>
                  </div>

                  <div>
                     <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Assembled Roster ({teamMembers.length})</h3>
                     <ul className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                       {teamMembers.map(m => (
                         <li key={m.id} className="p-3 bg-white flex justify-between items-center hover:bg-slate-50 transition">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
                                {m.initials}
                              </div>
                              <span className="font-bold text-slate-800 text-sm">{m.name}</span>
                            </div>
                            <span className="text-xs text-slate-500 truncate max-w-[200px] hover:text-primary-600 cursor-pointer">{m.githubUrl}</span>
                         </li>
                       ))}
                     </ul>
                  </div>
                </>
               )}
            </div>
          )}

          {/* Action Bar (Footer) */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
            {step > 1 ? (
              <button 
                onClick={handleBack} 
                disabled={isGenerating}
                className="px-6 py-2.5 rounded-lg border border-slate-300 font-medium text-slate-700 bg-white hover:bg-slate-50 transition disabled:opacity-50"
              >
                Back
              </button>
            ) : <div></div>} {/* Empty div to keep Next button on the right */}
            
            {step < 4 ? (
              <button 
                onClick={handleNext}
                disabled={step === 2 && isFetchingSuggestions}
                className="px-8 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold transition flex items-center gap-2 disabled:opacity-50"
              >
                {step === 2 && isFetchingSuggestions ? 'Please Wait...' : 'Continue'}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            ) : (
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-8 py-2.5 rounded-lg bg-gradient-to-r bg-primary-600 hover:bg-primary-500 text-white font-bold shadow-lg shadow-primary-500/30 transition flex items-center gap-2 transform active:scale-95 disabled:opacity-50 disabled:scale-100"
              >
                {isGenerating ? 'Generating...' : 'Generate Project Plan'}
                {!isGenerating && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
