import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  PackageCheck,
  Building2,
  Boxes,
  Users,
  RotateCcw,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { useToast } from '../context/ToastContext.tsx';

interface AdminSidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onNavigateHome: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  onNavigateHome,
}) => {
  const { success, error } = useToast();

  const handleResetDatabase = async () => {
    if (!confirm('Reset database to clean initial seed data? This restores all original demo products, inventory, and users.')) {
      return;
    }
    try {
      const res = await api.admin.resetDatabase();
      if (res.success) {
        success('Database successfully reset to demo seeds!');
        window.location.reload();
      }
    } catch {
      error('Failed to reset database.');
    }
  };

  const menuItems = [
    { id: 'admin-dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'admin-orders', label: 'Orders & Fulfillment', icon: PackageCheck },
    { id: 'admin-products', label: 'Products Management', icon: ShoppingBag },
    { id: 'admin-warehouses', label: 'Warehouse Hubs', icon: Building2 },
    { id: 'admin-inventory', label: 'Inventory & Stock Matrix', icon: Boxes },
    { id: 'admin-customers', label: 'Customer Directory', icon: Users },
  ];

  return (
    <aside className="w-full lg:w-64 bg-white rounded-3xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between shrink-0 h-fit space-y-6">
      <div className="space-y-4">
        <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-purple-600 tracking-wider">
              Management Portal
            </span>
            <h2 className="text-sm font-extrabold text-slate-900">Admin Operations</h2>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-slate-100 space-y-2">
        {/* Reset Database demo helper */}
        <button
          onClick={handleResetDatabase}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 transition-colors"
          title="Restore clean seed data for fresh reviewer demo"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Demo Data
        </button>

        <button
          onClick={onNavigateHome}
          className="w-full text-center text-xs text-slate-400 hover:text-slate-700 font-medium py-1"
        >
          ← Return to Storefront
        </button>
      </div>
    </aside>
  );
};
