import React from 'react';
import { Cpu, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-6 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-400">CashFlowIQ</span>
          <span>— Production AI Financial Intelligence Platform</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-indigo-400 font-mono text-[11px] px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
            <Cpu className="w-3 h-3" />
            Gemini 2.5 Flash
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Strict Data Isolation (RLS)
          </span>
        </div>
      </div>
    </footer>
  );
};
