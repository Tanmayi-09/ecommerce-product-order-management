import React, { useState } from 'react';
import { LogIn, KeyRound, ShieldCheck, UserCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('john@example.com');
  const [password, setPassword] = useState('customer123');
  const { login, isLoading, switchDemoUser } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await login(email, password);
    if (ok) {
      onNavigate('products');
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Sign In</h1>
          <p className="text-xs text-slate-500">
            Access your orders, multi-warehouse cart, and profile
          </p>
        </div>

        {/* Demo Credentials Box */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <KeyRound className="w-4 h-4 text-amber-500" />
            <span>Instant Demo Accounts (One-Click Login)</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={async () => {
                await switchDemoUser('admin');
                onNavigate('admin-dashboard');
              }}
              className="p-2 text-left bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors"
            >
              <div className="font-bold text-purple-900 flex items-center gap-1 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" /> Admin
              </div>
              <div className="text-[10px] text-purple-700">admin@ecommerce.com</div>
              <div className="text-[10px] text-slate-500 font-mono">admin123</div>
            </button>

            <button
              type="button"
              onClick={async () => {
                await switchDemoUser('john');
                onNavigate('products');
              }}
              className="p-2 text-left bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors"
            >
              <div className="font-bold text-indigo-900 flex items-center gap-1 text-[11px]">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" /> Customer (John)
              </div>
              <div className="text-[10px] text-indigo-700">john@example.com</div>
              <div className="text-[10px] text-slate-500 font-mono">customer123</div>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? 'Verifying...' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-slate-500">
          Don't have an account?{' '}
          <button
            onClick={() => onNavigate('register')}
            className="text-indigo-600 font-semibold hover:underline"
          >
            Register new account
          </button>
        </div>
      </div>
    </div>
  );
};
