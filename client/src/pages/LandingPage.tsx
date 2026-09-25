import React from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ShieldCheck,
  Zap,
  LineChart,
  Bot,
  ArrowRight,
  CheckCircle,
  Building,
  UserCheck,
  Rocket
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
            <Bot className="w-3.5 h-3.5 text-indigo-400" />
            Powered by Google Gemini 2.5 Flash
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight">
            Eliminate Cash Flow Surprises with{' '}
            <span className="text-gradient">Predictive AI Intelligence</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed">
            CashFlowIQ empowers founders, freelancers, and growing businesses to track live ledger balances, simulate "what-if" business decisions, and receive proactive CFO-grade guidance.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/auth/register">
              <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Launch CashFlowIQ Free
              </Button>
            </Link>
            <Link to="/auth/login">
              <Button size="lg" variant="secondary">
                View Interactive Live Demo
              </Button>
            </Link>
          </div>

          {/* Social Proof Badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" /> 30/60/90-Day Predictive Horizons
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" /> "What-If" Scenario Engine
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" /> Real-time Anomaly Detection
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" /> Strict Database Isolation
            </span>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-3">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Financial Clarity Built for Uncertain Markets
          </h2>
          <p className="text-slate-400 text-sm max-w-2xl mx-auto">
            Everything you need to avoid unexpected insolvency, control fixed burn rates, and deploy capital with complete confidence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="glass-panel p-6 rounded-2xl space-y-4 hover:border-indigo-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Dynamic Running Ledger</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Track incoming revenues and outgoing expenses across multiple checking, savings, and merchant accounts with immediate balance recomputation and recurring schedule tracking.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-6 rounded-2xl space-y-4 hover:border-indigo-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <LineChart className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Predictive 90-Day Horizons</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Algorithmic modeling of future cash balances factoring in recurring contracts, seasonal trends, and daily burn velocity with clear confidence intervals.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-6 rounded-2xl space-y-4 hover:border-indigo-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">AI CFO Advisor & Audits</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Leverage Gemini 2.5 Flash to automatically audit ledger health, identify expense spikes, flag dangerous category concentrations, and chat directly with a virtual CFO.
            </p>
          </div>

          {/* Card 4 */}
          <div className="glass-panel p-6 rounded-2xl space-y-4 hover:border-indigo-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Scenario Planning ("What-If")</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Simulate hiring a senior engineer, taking on a corporate debt facility, or suffering a 20% revenue contraction before signing a contract.
            </p>
          </div>

          {/* Card 5 */}
          <div className="glass-panel p-6 rounded-2xl space-y-4 hover:border-indigo-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Burn Anomaly Alerts</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Real-time statistical anomaly detection immediately surfaces unexpected cost spikes, redundant SaaS subscriptions, and contract creep.
            </p>
          </div>

          {/* Card 6 */}
          <div className="glass-panel p-6 rounded-2xl space-y-4 hover:border-indigo-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Tailored Entity Frameworks</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Customized financial telemetry and safety thresholds configured specifically for Solo Freelancers, Small Businesses, or High-Growth Startups.
            </p>
          </div>
        </div>
      </section>

      {/* Target Audiences */}
      <section className="py-16 bg-slate-900/40 border-y border-slate-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div className="space-y-2">
              <div className="inline-flex p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
                <UserCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Freelancers & Consultants</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tame variable income cycles, estimate quarterly tax obligations, and protect your personal runway without spreadsheets.
              </p>
            </div>

            <div className="space-y-2">
              <div className="inline-flex p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
                <Building className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Small-to-Medium Businesses</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Synchronize payroll outlays, inventory purchases, and vendor terms to safeguard working capital and maintain continuous liquidity.
              </p>
            </div>

            <div className="space-y-2">
              <div className="inline-flex p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-2">
                <Rocket className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">High-Growth Startups</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Monitor net monthly burn, calculate exact zero-cash dates, and model hiring plans prior to raising institutional capital.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto glass-panel p-10 rounded-3xl space-y-6 border border-indigo-500/30">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Take Control of Your Cash Flow Today
          </h2>
          <p className="text-slate-300 text-sm">
            Sign up in 30 seconds or test drive the live environment with pre-populated demo data.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/auth/register">
              <Button size="lg" variant="primary">
                Create Free Account
              </Button>
            </Link>
            <Link to="/auth/login">
              <Button size="lg" variant="outline">
                Sign In with Demo Account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
