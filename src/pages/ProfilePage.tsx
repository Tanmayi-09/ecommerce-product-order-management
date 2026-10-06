import React, { useState } from 'react';
import { User as UserIcon, Mail, Phone, MapPin, ShieldCheck, ArrowRight, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';

interface ProfilePageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { user, isAdmin } = useAuth();
  const { success } = useToast();

  const [address, setAddress] = useState({
    street: user?.address?.street || '14 Hill Road, Bandra West',
    city: user?.address?.city || 'Mumbai',
    state: user?.address?.state || 'Maharashtra',
    zipCode: user?.address?.zipCode || '400050',
    country: user?.address?.country || 'India',
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    success('Shipping profile updated.');
  };

  if (!user) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
        <p className="text-slate-600">Please log in to view your profile.</p>
        <button
          onClick={() => onNavigate('login')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Customer Profile</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your account credentials, security role, and default shipping destination
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        {/* User Card */}
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl shadow-inner">
            {user.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{user.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold uppercase">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Account ID: {user.id}</p>
          </div>
        </div>

        {/* Contact details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Email Address
            </span>
            <span className="font-semibold text-slate-800">{user.email}</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Phone Number
            </span>
            <span className="font-semibold text-slate-800">{user.phone || '+91 91234 56789'}</span>
          </div>
        </div>

        {/* Address edit form */}
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-indigo-600" />
            Default Shipping Destination
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-slate-600 font-medium mb-1">Street Address</label>
              <input
                type="text"
                value={address.street}
                onChange={(e) => setAddress({ ...address, street: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">City</label>
              <input
                type="text"
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">State</label>
              <input
                type="text"
                value={address.state}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Postal / PIN Code</label>
              <input
                type="text"
                value={address.zipCode}
                onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Country</label>
              <input
                type="text"
                value={address.country}
                onChange={(e) => setAddress({ ...address, country: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              Save Changes
            </button>
          </div>
        </form>

        {/* Quick action links */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <button
            onClick={() => onNavigate('orders')}
            className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
          >
            View My Orders History
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {isAdmin && (
            <button
              onClick={() => onNavigate('admin-dashboard')}
              className="text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Open Admin Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
