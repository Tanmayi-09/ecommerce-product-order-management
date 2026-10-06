import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { ShieldCheck, UserCheck, KeyRound } from 'lucide-react';

export const DemoSwitcher: React.FC = () => {
  const { user, switchDemoUser } = useAuth();

  return (
    <div className="bg-slate-900 text-slate-200 text-xs py-2 px-4 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 font-semibold text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded-md">
            <KeyRound className="w-3.5 h-3.5" />
            Project Review Mode
          </span>
          <span className="text-slate-400 hidden sm:inline">
            Active: <strong className="text-white">{user?.name || 'Guest'}</strong> (
            <span className={user?.role === 'admin' ? 'text-purple-400' : 'text-sky-400'}>
              {user?.role?.toUpperCase()}
            </span>
            )
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-400 mr-1 hidden md:inline">Instant Switch:</span>

          <button
            onClick={() => switchDemoUser('admin')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium ${
              user?.role === 'admin'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin (Manager)
          </button>

          <button
            onClick={() => switchDemoUser('john')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium ${
              user?.email === 'john@example.com'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Customer (John)
          </button>

          <button
            onClick={() => switchDemoUser('sarah')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium ${
              user?.email === 'sarah@example.com'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Customer (Sarah)
          </button>

          <button
            onClick={() => switchDemoUser('raj')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium ${
              user?.email === 'raj@example.com'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Customer (Rajesh)
          </button>
        </div>
      </div>
    </div>
  );
};
