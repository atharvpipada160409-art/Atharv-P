import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ReceiptText,
  LineChart,
  Sparkles,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  X
} from 'lucide-react';
import { useFinancials } from '../../context/FinancialContext';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { summary } = useFinancials();
  const { user } = useAuth();

  const navItems = [
    { to: '/dashboard', label: 'Financial Overview', icon: LayoutDashboard },
    { to: '/transactions', label: 'Ledger & Transactions', icon: ReceiptText },
    { to: '/forecasting', label: 'Forecasting & What-If', icon: LineChart },
    { to: '/ai-advisor', label: 'AI Advisor & Audit', icon: Sparkles, badge: 'Gemini' },
    { to: '/settings', label: 'Settings & Accounts', icon: Sliders },
  ];

  const runwayDays = summary?.runwayDays ?? 0;
  const isCritical = summary?.runwayStatus === 'critical';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 border-r border-slate-800 bg-slate-950 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 space-y-6">
          {/* Mobile close button & entity badge */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 md:hidden">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Navigation</span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Entity Tag */}
          <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Entity Model:</span>
            <span className="font-semibold text-indigo-400 uppercase tracking-wider text-[11px] px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
              {user?.entityType || 'SMB'}
            </span>
          </div>

          {/* Navigation links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => onClose()}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Runway Status Card */}
        <div className="p-4 border-t border-slate-800/80">
          <div className={`p-3.5 rounded-xl border ${
            isCritical
              ? 'bg-rose-500/10 border-rose-500/20'
              : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400 flex items-center gap-1.5">
                {isCritical ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                )}
                Cash Runway
              </span>
              <span className={`font-mono font-bold ${
                isCritical ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {runwayDays >= 999 ? 'Healthy' : `${Math.round(runwayDays)}d`}
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isCritical ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, (runwayDays / 120) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
