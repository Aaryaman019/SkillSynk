import React, { useState, useRef, useEffect } from 'react';

// For a real app, this should be accessed securely, e.g. routed through the backend.
// Since we are building a purely frontend demo component here:
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || ''; // Needs to be added to vite config/env

export default function ChatAssistant({ isOpen, onClose, projectContext }) {
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', text: "Hi! I'm your SkillSynk Project Assistant. I've reviewed the current dashboard data. How can I help you manage the team today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const QUICK_ACTIONS = [
    "What's the biggest risk?",
    "Who is behind schedule?",
    "Should I be worried?"
  ];

  const handleSend = async (textOverride) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;

    // 1. Add User Message
    const newUserMsg = { id: Date.now(), role: 'user', text: textToSend };
    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setIsTyping(true);

    // 2. Format History for Claude API Call
    // Claude Messages API format: [{role: "user"|"assistant", content: "..."}]
    const apiMessages = messages.map(m => ({
      role: m.role,
      content: m.text
    })).concat({ role: 'user', content: textToSend });

    // Ensure alternating user/assistant (Claude strict requirement)
    // If first message is assistant, Claude API usually complains if system prompt isn't used properly.
    // The current Messages API expects the first user message to be 'user'. 
    // We'll strip the initial greeting for the API history to keep it clean.
    const cleanApiHistory = apiMessages.filter(m => m.id !== 1);

    const systemPrompt = `You are SkillSynk's AI project assistant. 
You have access to the current project data:
${JSON.stringify(projectContext, null, 2)}

Answer the manager's questions about project status, team performance, and risk in 2-3 sentences max. 
Be direct and actionable. If asked for recommendations, give 1 clear recommendation.`;

    try {
      if (!ANTHROPIC_API_KEY) {
        // Fallback Mock Response if no API key is provided
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: Date.now() + 1,
            role: 'assistant',
            text: "[MOCK] I see that you're asking about the project. Based on the context, Alice is slightly behind on the React UI tasks. I recommend reassigning the routing ticket to Charlie to balance the load."
          }]);
          setIsTyping(false);
        }, 1500);
        return;
      }

      // Real API Call
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true' // Required for frontend calls (not recommended for prod)
        },
        body: JSON.stringify({
          model: 'claude-3-7-sonnet-20250219',
          max_tokens: 300,
          system: systemPrompt,
          messages: cleanApiHistory
        })
      });

      if (!response.ok) {
        const errInfo = await response.text();
        console.error("Claude API Error:", errInfo);
        throw new Error("Failed to contact API");
      }

      const data = await response.json();
      const reply = data.content[0].text;

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        text: reply
      }]);

    } catch (error) {
       console.error(error);
       setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        text: "Sorry, I had trouble connecting to the network to analyze the project context."
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 w-[360px] h-screen bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300 font-sans">
      
      {/* Header */}
      <div className="h-16 px-4 bg-slate-900 flex items-center justify-between shrink-0">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-bold text-sm tracking-wide">Project Assistant</h2>
              <div className="flex items-center gap-1.5">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                 <span className="text-[10px] text-slate-400 font-medium">Synced with {projectContext?.projectName || 'Project'}</span>
              </div>
            </div>
         </div>
         <button 
           onClick={onClose}
           className="text-slate-400 hover:text-white transition w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800"
         >
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
         </button>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4"
      >
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[85%] gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Avatar */}
              {msg.role === 'assistant' ? (
                <div className="w-6 h-6 shrink-0 rounded bg-primary-100 flex items-center justify-center text-primary-600 mt-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
              ) : (
                <div className="w-6 h-6 shrink-0 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white mt-1 shadow-sm">
                  ME
                </div>
              )}

              {/* Bubble */}
              <div className={`p-3 text-sm shadow-sm ${
                  msg.role === 'user' 
                  ? 'bg-slate-900 text-white rounded-2xl rounded-tr-sm' 
                  : 'bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-tl-sm'
                }`}
              >
                {msg.text}
              </div>

            </div>
          </div>
        ))}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex max-w-[85%] gap-2 flex-row">
                <div className="w-6 h-6 shrink-0 rounded bg-primary-100 flex items-center justify-center text-primary-600 mt-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-2xl rounded-tl-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200 shrink-0">
        
        {/* Quick Actions Scroll Horizontal */}
        <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar scroll-smooth">
          {QUICK_ACTIONS.map((action, idx) => (
            <button 
              key={idx}
              onClick={() => handleSend(action)}
              disabled={isTyping}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-full border border-slate-200 whitespace-nowrap transition disabled:opacity-50"
            >
              {action}
            </button>
          ))}
        </div>

        <div className="relative flex items-center">
          <textarea
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-4 pr-12 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none h-[46px] overflow-hidden leading-snug"
            placeholder="Ask about the project..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isTyping}
          />
          <button 
            disabled={!input.trim() || isTyping}
            onClick={() => handleSend()}
            className="absolute right-2 w-8 h-8 bg-primary-600 hover:bg-primary-500 text-white rounded-lg flex items-center justify-center transition disabled:opacity-50 disabled:bg-slate-300 shadow-sm"
          >
           <svg className="w-4 h-4 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19V5m-7 7l7-7 7 7" />
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">Assistant can make mistakes. Verify critical data.</p>
      </div>

    </div>
  );
}
