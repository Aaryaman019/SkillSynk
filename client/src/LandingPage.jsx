import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

function FadeIn({ children, delay = 0, className = "" }) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setIsVisible(true);
        if (domRef.current) observer.unobserve(domRef.current);
      }
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    if (domRef.current) observer.observe(domRef.current);
    
    return () => {
      if (domRef.current) observer.unobserve(domRef.current);
    };
  }, []);

  return (
    <div
      ref={domRef}
      className={`transition-all duration-[800ms] ease-out ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
        transitionDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
  );
}
export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      const sections = ['how-it-works', 'features', 'benefits'];
      let current = '';
      for (const section of sections) {
        const el = document.getElementById(section);
        // Track the current section roughly 150px before the element physically touches the browser roof.
        if (el && window.scrollY >= (el.offsetTop - 150)) {
          current = section;
        }
      }
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-primary-500/30">
      
      {/* Navigation */}
      <nav className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center font-bold text-white shadow-sm hover:scale-105 transition-transform duration-300">
              SS
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">
              SkillSynk
            </span>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className={`text-sm font-semibold transition-colors hover:text-primary-600 relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-primary-600 after:origin-bottom-right after:transition-transform hover:after:scale-x-100 hover:after:origin-bottom-left ${activeSection === 'how-it-works' ? 'text-primary-600 after:scale-x-100' : 'text-slate-600'}`}>How It Works</a>
            <a href="#features" className={`text-sm font-semibold transition-colors hover:text-primary-600 relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-primary-600 after:origin-bottom-right after:transition-transform hover:after:scale-x-100 hover:after:origin-bottom-left ${activeSection === 'features' ? 'text-primary-600 after:scale-x-100' : 'text-slate-600'}`}>Features</a>
            <a href="#benefits" className={`text-sm font-semibold transition-colors hover:text-primary-600 relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-primary-600 after:origin-bottom-right after:transition-transform hover:after:scale-x-100 hover:after:origin-bottom-left ${activeSection === 'benefits' ? 'text-primary-600 after:scale-x-100' : 'text-slate-600'}`}>Benefits</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/auth" className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm px-5 py-2 rounded-full transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
              Sign In / Up
            </Link>
            
            {/* Mobile Menu Toggle */}
            <button className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-lg py-4 px-6 flex flex-col gap-4 animate-in slide-in-from-top-2">
            <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className={`text-sm font-semibold transition-colors ${activeSection === 'how-it-works' ? 'text-primary-600' : 'text-slate-600'}`}>How It Works</a>
            <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className={`text-sm font-semibold transition-colors ${activeSection === 'features' ? 'text-primary-600' : 'text-slate-600'}`}>Features</a>
            <a href="#benefits" onClick={() => setIsMobileMenuOpen(false)} className={`text-sm font-semibold transition-colors ${activeSection === 'benefits' ? 'text-primary-600' : 'text-slate-600'}`}>Benefits</a>
          </div>
        )}
      </nav>

      <main className="overflow-hidden">
        {/* Hero Section */}
        <section className="pt-24 pb-32 px-4">
          <div className="text-center max-w-4xl mx-auto space-y-8 flex flex-col items-center">
            
            <FadeIn delay={0}>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white hover:shadow-sm transition-all duration-300 cursor-default">
                <svg className="w-3.5 h-3.5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI-Powered Project Management
              </div>
            </FadeIn>
            
            <FadeIn delay={100}>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight text-slate-900">
                AI Project Manager for
                <br/>
                <span className="text-primary-500 mt-2 block">
                  Smarter Development Teams
                </span>
              </h1>
            </FadeIn>
            
            <FadeIn delay={200}>
              <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed max-w-3xl mx-auto">
                Analyze developer skills using GitHub and AI to form optimal teams, assign tasks intelligently, and predict project timelines with mathematical precision.
              </p>
            </FadeIn>
            
            <FadeIn delay={300}>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-8">
                <Link 
                  to="/new-project" 
                  className="bg-primary-600 hover:bg-primary-500 text-white font-bold text-base px-8 py-3.5 rounded-xl shadow-lg shadow-primary-500/30 transition-all duration-300 flex items-center gap-2 hover:-translate-y-1 hover:shadow-primary-500/40"
                >
                  Create Project
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                </Link>
                <button 
                  className="bg-white hover:bg-slate-50 text-slate-800 font-bold text-base px-8 py-3.5 rounded-xl border border-slate-200 transition-all duration-300 shadow-sm flex items-center gap-2 hover:-translate-y-1 hover:shadow-md"
                >
                  View Demo
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                </button>
              </div>
            </FadeIn>

          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="bg-slate-50 py-24 px-4">
          <div className="max-w-7xl mx-auto">
            
            <FadeIn delay={0}>
              <div className="text-center mb-16">
                <h2 className="text-3xl font-extrabold text-slate-900 mb-3">How It Works</h2>
                <p className="text-slate-500 font-medium">Four steps to an AI-optimized project plan</p>
              </div>
            </FadeIn>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              <FadeIn delay={100} className="flex h-full">
                <div className="bg-white border text-center border-slate-200 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 hover:scale-[1.03] transition-all duration-300 flex flex-col items-center w-full">
                  <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mb-5">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  </div>
                  <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2">Step 1</span>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Create Project</h3>
                  <p className="text-sm text-slate-500 font-medium">Define requirements, tech stack, and deadlines</p>
                </div>
              </FadeIn>

              <FadeIn delay={200} className="flex h-full">
                <div className="bg-white border text-center border-slate-200 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 hover:scale-[1.03] transition-all duration-300 flex flex-col items-center w-full">
                  <div className="w-12 h-12 bg-primary-600 text-white rounded-xl flex items-center justify-center mb-5">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
                  </div>
                  <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2">Step 2</span>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Add Team</h3>
                  <p className="text-sm text-slate-500 font-medium">Add developers and connect GitHub profiles</p>
                </div>
              </FadeIn>

              <FadeIn delay={300} className="flex h-full">
                <div className="bg-white border text-center border-slate-200 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 hover:scale-[1.03] transition-all duration-300 flex flex-col items-center w-full">
                  <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center mb-5 border border-primary-100">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/></svg>
                  </div>
                  <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2">Step 3</span>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">AI Analyzes</h3>
                  <p className="text-sm text-slate-500 font-medium">AI scans repos, commits, and skill patterns</p>
                </div>
              </FadeIn>

              <FadeIn delay={400} className="flex h-full">
                <div className="bg-white border text-center border-slate-200 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 hover:scale-[1.03] transition-all duration-300 flex flex-col items-center w-full">
                  <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center mb-5 border border-primary-100">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                  </div>
                  <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2">Step 4</span>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">AI Assigns</h3>
                  <p className="text-sm text-slate-500 font-medium">Optimal team formed, tasks assigned, timeline set</p>
                </div>
              </FadeIn>

            </div>
          </div>
        </section>

        {/* Key Features Section */}
        <section id="features" className="bg-white py-24 px-4 border-t border-slate-100">
          <div className="max-w-7xl mx-auto">
            
            <FadeIn delay={0}>
              <div className="text-center mb-16">
                <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Key Features</h2>
                <p className="text-slate-500 font-medium">Everything you need to manage engineering teams with AI</p>
              </div>
            </FadeIn>
            
            <div className="grid md:grid-cols-3 gap-6">
              <FadeIn delay={100}>
                <div className="bg-slate-50 border border-slate-100 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 hover:scale-[1.03] transition-all duration-300 h-full">
                  <div className="w-10 h-10 bg-white text-primary-600 rounded-lg flex items-center justify-center mb-4 shadow-sm">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">GitHub Skill Analyzer</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">Analyzes repositories, languages, commit patterns to build accurate skill profiles.</p>
                </div>
              </FadeIn>

              <FadeIn delay={200}>
                <div className="bg-slate-50 border border-slate-100 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 hover:scale-[1.03] transition-all duration-300 h-full">
                  <div className="w-10 h-10 bg-white text-primary-600 rounded-lg flex items-center justify-center mb-4 shadow-sm">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">AI Team Formation</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">Suggests the best team composition based on project requirements and skill gaps.</p>
                </div>
              </FadeIn>

              <FadeIn delay={300}>
                <div className="bg-slate-50 border border-slate-100 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 hover:scale-[1.03] transition-all duration-300 h-full">
                  <div className="w-10 h-10 bg-white text-primary-600 rounded-lg flex items-center justify-center mb-4 shadow-sm">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">Smart Task Allocation</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">Assigns tasks to developers based on skills, workload, and past performance.</p>
                </div>
              </FadeIn>

              <FadeIn delay={100}>
                <div className="bg-slate-50 border border-slate-100 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 hover:scale-[1.03] transition-all duration-300 h-full">
                  <div className="w-10 h-10 bg-white text-primary-600 rounded-lg flex items-center justify-center mb-4 shadow-sm">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">Timeline Prediction</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">AI estimates realistic completion dates factoring in team velocity and complexity.</p>
                </div>
              </FadeIn>

              <FadeIn delay={200}>
                <div className="bg-slate-50 border border-slate-100 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 hover:scale-[1.03] transition-all duration-300 h-full">
                  <div className="w-10 h-10 bg-white text-primary-600 rounded-lg flex items-center justify-center mb-4 shadow-sm">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">Project Health Dashboard</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">Real-time green/yellow/red health indicators with actionable AI alerts.</p>
                </div>
              </FadeIn>

              <FadeIn delay={300}>
                <div className="bg-slate-50 border border-slate-100 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 hover:scale-[1.03] transition-all duration-300 h-full">
                  <div className="w-10 h-10 bg-primary-600 text-white rounded-lg flex items-center justify-center mb-4 shadow-sm hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">Contribution Scoring</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">Evaluates developer impact through code quality, velocity, and collaboration metrics.</p>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* Why SkillSynk AI */}
        <section id="benefits" className="bg-slate-100 py-24 px-4 border-t border-slate-200">
          <div className="max-w-5xl mx-auto text-center">
            
            <FadeIn delay={0}>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-16">Why SkillSynk AI?</h2>
            </FadeIn>
            
            <div className="grid md:grid-cols-3 gap-10">
              <FadeIn delay={100}>
                <div className="flex flex-col items-center text-center p-6 rounded-2xl hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="w-12 h-12 bg-white shadow-sm text-primary-600 rounded-xl flex items-center justify-center mb-4">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-2">2x Faster Team Formation</h3>
                  <p className="text-sm text-slate-500 font-medium">AI eliminates guesswork in assembling the right team.</p>
                </div>
              </FadeIn>

              <FadeIn delay={200}>
                <div className="flex flex-col items-center text-center p-6 rounded-2xl hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="w-12 h-12 bg-white shadow-sm text-primary-600 rounded-xl flex items-center justify-center mb-4">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-2">Reduce Project Risk</h3>
                  <p className="text-sm text-slate-500 font-medium">Skill mismatch warnings prevent costly bottlenecks.</p>
                </div>
              </FadeIn>

              <FadeIn delay={300}>
                <div className="flex flex-col items-center text-center p-6 rounded-2xl hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="w-12 h-12 bg-white shadow-sm text-primary-600 rounded-xl flex items-center justify-center mb-4">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-2">Data-Driven Decisions</h3>
                  <p className="text-sm text-slate-500 font-medium">Every recommendation backed by GitHub activity analysis.</p>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-12 text-center text-slate-500 text-sm font-medium">
         <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-5 h-5 rounded bg-primary-600 flex items-center justify-center font-bold text-[8px] text-white">
              SS
            </div>
            <span className="font-bold text-slate-900 text-base">SkillSynk AI</span>
         </div>
         <p>&copy; 2026 SkillSynk AI. Intelligent project management for engineering teams.</p>
      </footer>
    </div>
  );
}
