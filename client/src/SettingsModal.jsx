import React, { useState, useEffect } from 'react';

export default function SettingsModal({ isOpen, onClose }) {
  const [teamId, setTeamId] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setTeamId(user.teamId || '');
        } catch (e) {}
      }
      setMessage('');
      setError('');
      setCurrentPassword('');
      setNewPassword('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdate = async (type) => {
    setMessage('');
    setError('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error("Not authenticated");

      const body = {};
      if (type === 'team') {
        body.teamId = teamId;
      } else if (type === 'password') {
        if (!currentPassword || !newPassword) throw new Error("Passwords required");
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      }

      const res = await fetch('http://localhost:5005/auth/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');

      setMessage(data.message || 'Updated successfully!');
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      if (type === 'password') {
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
        
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/80">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Settings</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          
          {error && (
            <div className="p-3 text-sm bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-medium rounded-xl border border-red-100 dark:border-red-500/20">
              {error}
            </div>
          )}
          {message && (
            <div className="p-3 text-sm bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium rounded-xl border border-emerald-100 dark:border-emerald-500/20">
              {message}
            </div>
          )}

          {/* Team ID Setting */}
          <div>
             <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Team Allocation</h3>
             <div className="flex gap-3">
               <input 
                 type="text" 
                 value={teamId}
                 onChange={e => setTeamId(e.target.value)}
                 placeholder="Enter Team ID"
                 className="flex-1 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all shadow-sm"
               />
               <button 
                 onClick={() => handleUpdate('team')}
                 disabled={isLoading}
                 className="bg-slate-900 dark:bg-primary-600 hover:bg-slate-800 dark:hover:bg-primary-500 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors disabled:opacity-70"
               >
                 Save
               </button>
             </div>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-700/50" />

          {/* Security Setting */}
          <div>
             <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Security</h3>
             <div className="space-y-3">
               <input 
                 type="password" 
                 value={currentPassword}
                 onChange={e => setCurrentPassword(e.target.value)}
                 placeholder="Current Password"
                 className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all shadow-sm"
               />
               <input 
                 type="password" 
                 value={newPassword}
                 onChange={e => setNewPassword(e.target.value)}
                 placeholder="New Password"
                 className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all shadow-sm"
               />
               <button 
                 onClick={() => handleUpdate('password')}
                 disabled={isLoading}
                 className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors mt-2 disabled:opacity-70"
               >
                 Update Password
               </button>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
