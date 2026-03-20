import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [teamId, setTeamId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profession, setProfession] = useState(''); // default to empty for placeholder
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const body = isLogin 
        ? { email, password }
        : { email, password, role: profession, teamId };

      const response = await fetch(`https://skillsynk-1.onrender.com${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Success, save token and route
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        navigate('/');
      } else {
        throw new Error('No token received');
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-primary-500/30">
      
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <Link to="/" className="flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center font-bold text-white shadow-lg shadow-primary-500/20 text-xl">
            SS
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-slate-900">
            SkillSynk
          </span>
        </Link>
        <h2 className="text-center text-3xl font-extrabold text-slate-900">
          {isLogin ? 'Sign in to your account' : 'Start managing smarter'}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-medium">
          {isLogin ? 'Welcome back to your dashboard.' : 'Join the AI-powered engineering era.'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
          
          <form className="space-y-5" onSubmit={handleAuth}>
            
            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Team Email ID
              </label>
              <input
                type="email"
                required
                className="appearance-none block w-full px-4 py-2.5 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm font-medium transition-all"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            {/* The user requested team id in "Sign In / Up" */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Team ID
              </label>
              <input
                type="text"
                className="appearance-none block w-full px-4 py-2.5 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm font-medium transition-all"
                placeholder="Ex: T-1024"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Profession
                </label>
                <select
                  required
                  className="appearance-none block w-full px-4 py-2.5 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm font-medium transition-all bg-white"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                >
                  <option value="" disabled>Choose your profession...</option>
                  <option value="Developer">Developer</option>
                  <option value="Designer">Designer</option>
                  <option value="Project Manager">Project Manager</option>
                  <option value="DevOps Engineer">DevOps Engineer</option>
                  <option value="QA Engineer">QA Engineer</option>
                  <option value="Data Scientist">Data Scientist</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                className="appearance-none block w-full px-4 py-2.5 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm font-medium transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  className="appearance-none block w-full px-4 py-2.5 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm font-medium transition-all"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                />
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary-600 hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all disabled:opacity-70"
              >
                {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-slate-500 font-medium">
                  {isLogin ? "New to SkillSynk?" : "Already have an account?"}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="w-full flex justify-center py-2.5 px-4 border border-slate-300 rounded-xl shadow-sm text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 transition-all"
              >
                {isLogin ? 'Create a new account' : 'Sign in to existing account'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
