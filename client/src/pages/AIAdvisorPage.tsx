import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { AIHealthGauge } from '../components/ai-advisor/AIHealthGauge';
import { RiskCardList } from '../components/ai-advisor/RiskCardList';
import { ActionableStepsList } from '../components/ai-advisor/ActionableStepsList';
import { AIChatContainer } from '../components/ai-advisor/AIChatContainer';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { api } from '../services/api';
import { HealthAuditResponse } from '../types';
import { Sparkles, Sliders } from 'lucide-react';

export const AIAdvisorPage: React.FC = () => {
  const [audit, setAudit] = useState<HealthAuditResponse | null>(null);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  // Custom Audit Configuration Modal state
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [horizonDays, setHorizonDays] = useState<'30' | '60' | '90'>('90');
  const [financialGoal, setFinancialGoal] = useState('Build 6-month buffer & eliminate debt');
  const [customInquiry, setCustomInquiry] = useState('Evaluate SaaS overhead leaks and payroll sustainability');

  const fetchLatestAudit = async () => {
    try {
      setIsLoadingAudit(true);
      const res = await api.getLatestAudit();
      if (res.audit) {
        setAudit(res.audit);
      } else {
        // Run initial audit if none exists
        await handleExecuteAudit();
      }
    } catch (err) {
      console.error('Failed to load latest health audit:', err);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  const handleExecuteAudit = async () => {
    try {
      setIsLoadingAudit(true);
      const res = await api.runHealthAudit({
        horizonDays,
        financialGoal,
        customInquiry
      });
      setAudit(res.audit);
      setIsConfigModalOpen(false);
    } catch (err) {
      console.error('Audit execution error:', err);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  useEffect(() => {
    fetchLatestAudit();
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Financial Advisor & Health Diagnostics"
        subtitle="Automated CFO audit reports, vulnerability detection, and strategic coaching powered by Google's Gemini 2.5 Flash model"
        badge="Gemini 2.5 Flash"
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsConfigModalOpen(true)}
            leftIcon={<Sliders className="w-4 h-4" />}
          >
            Configure & Run Audit
          </Button>
        }
      />

      {/* Health Score Gauge */}
      <section>
        <AIHealthGauge
          audit={audit}
          onRunAudit={() => setIsConfigModalOpen(true)}
          isLoading={isLoadingAudit}
        />
      </section>

      {/* Risks & Actions Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RiskCardList risks={audit?.keyRisks || []} />
        <ActionableStepsList steps={audit?.actionableSteps || []} />
      </div>

      {/* Interactive AI CFO Chat Container */}
      <section className="pt-4 border-t border-slate-800">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Interactive CFO Strategy Consultation
          </h2>
          <p className="text-xs text-slate-400">
            Ask targeted questions regarding hiring decisions, budget optimizations, or cash reserves
          </p>
        </div>

        <AIChatContainer />
      </section>

      {/* Configure Audit Modal */}
      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title="Initiate AI Cash Flow Health Audit"
        description="Configure target horizons and strategic priorities for Gemini 2.5 Flash evaluation"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Target Horizon</label>
            <div className="grid grid-cols-3 gap-2">
              {(['30', '60', '90'] as const).map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setHorizonDays(days)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                    horizonDays === days
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {days} Days
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Primary Financial Goal</label>
            <input
              type="text"
              value={financialGoal}
              onChange={(e) => setFinancialGoal(e.target.value)}
              placeholder="e.g. Build 6-month buffer, Reduce debt, Extend runway"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Specific Strategic Inquiry (Optional)</label>
            <textarea
              rows={3}
              value={customInquiry}
              onChange={(e) => setCustomInquiry(e.target.value)}
              placeholder="e.g. Focus on optimizing software licenses and evaluating contractor costs"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <Button variant="outline" size="md" onClick={() => setIsConfigModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleExecuteAudit}
              isLoading={isLoadingAudit}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Run Gemini Diagnostic
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
