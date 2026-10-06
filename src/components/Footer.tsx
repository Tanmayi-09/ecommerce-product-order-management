import React from 'react';
import { Database, ShieldCheck, Cpu, Code2, HeartHandshake } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold text-white text-base">
                E-Commerce Product & Order Management System
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed max-w-lg">
              A complete, full-stack college API project featuring independent REST API modules,
              intelligent multi-warehouse stock allocation, order fulfillment tracking, simulated
              transactions, and catalog-grounded AI shopping assistant.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md text-[11px] font-mono border border-slate-700 flex items-center gap-1">
                <Code2 className="w-3 h-3 text-indigo-400" /> Express REST APIs
              </span>
              <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md text-[11px] font-mono border border-slate-700 flex items-center gap-1">
                <Database className="w-3 h-3 text-emerald-400" /> Multi-Warehouse Hubs
              </span>
              <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md text-[11px] font-mono border border-slate-700 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-purple-400" /> JWT Role-Based Auth
              </span>
              <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md text-[11px] font-mono border border-slate-700 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-amber-400" /> Gemini Catalog AI
              </span>
            </div>
          </div>

          {/* Quick Nav */}
          <div>
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] mb-3">
              Application Modules
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('products')}
                  className="hover:text-white transition-colors"
                >
                  Product Catalog & Search
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('cart')}
                  className="hover:text-white transition-colors"
                >
                  Shopping Cart & Fulfillment
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('orders')}
                  className="hover:text-white transition-colors"
                >
                  My Orders & Live Tracking
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('admin-dashboard')}
                  className="hover:text-white transition-colors"
                >
                  Admin Operations Dashboard
                </button>
              </li>
            </ul>
          </div>

          {/* College Project Evaluation */}
          <div>
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] mb-3">
              API Examination Links
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('api-docs')}
                  className="text-emerald-400 font-semibold hover:text-emerald-300 flex items-center gap-1.5"
                >
                  <Code2 className="w-3.5 h-3.5" /> Interactive REST API Tester
                </button>
              </li>
              <li>
                <a
                  href="/api/health"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white flex items-center gap-1 font-mono"
                >
                  GET /api/health
                </a>
              </li>
              <li>
                <a
                  href="/api/system/test-suite"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white flex items-center gap-1 font-mono"
                >
                  GET /api/system/test-suite
                </a>
              </li>
              <li className="pt-2 text-[11px] text-slate-500 flex items-center gap-1">
                <HeartHandshake className="w-3.5 h-3.5 text-rose-400" />
                Prepared for College Review Evaluation
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
          <p>© 2026 E-Commerce Product & Order Management System. College API Project.</p>
          <p className="font-mono text-[11px]">
            Node.js v22 • Express.js • React 19 • Vite • Google Cloud Run Ready
          </p>
        </div>
      </div>
    </footer>
  );
};
