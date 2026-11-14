import React from 'react';
import { Link } from 'react-router-dom';
import {
  Receipt,
  RefreshCw,
  FolderLock,
  Package,
  CheckSquare,
  BarChart3,
  ShieldCheck,
  Users,
  Bell,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { Button } from '../components/common/Button';

export const LandingPage: React.FC = () => {
  const features = [
    {
      icon: Receipt,
      title: 'Bills & Recurring Payments',
      desc: 'Robust recurrence engine handling month-end dates and leap years. Keep an immutable payment history with zero guesswork.'
    },
    {
      icon: RefreshCw,
      title: 'Subscription Manager',
      desc: 'Accurate monthly and annual run-rate calculations across all billing cycles. Never get surprised by auto-renewals again.'
    },
    {
      icon: FolderLock,
      title: 'Secure Document Vault',
      desc: 'Store warranties, leases, receipts, and insurance docs in private storage accessible only via short-lived signed URLs.'
    },
    {
      icon: Package,
      title: 'Household Inventory',
      desc: 'Catalog valuable appliances, electronics, and vehicles. Track serial numbers, locations, and expiring manufacturer warranties.'
    },
    {
      icon: CheckSquare,
      title: 'Tasks & Chores',
      desc: 'Shared list and Kanban board views. Assign household responsibilities, track deadlines, and schedule recurring chores.'
    },
    {
      icon: BarChart3,
      title: 'Real PostgreSQL Analytics',
      desc: 'Real aggregated spending trends, category distributions, and member shares generated directly from actual payment records.'
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* Navigation */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-extrabold shadow-sm">
              K
            </div>
            <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Keepr</span>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 lg:pt-32 lg:pb-36">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-8">
            <ShieldCheck className="w-4 h-4" /> Personal & Household Operations Platform
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.1]">
            Everything important, <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300">
              kept in one place.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Bills, subscriptions, documents, warranties, household inventory, maintenance schedules, and shared responsibilities — consolidated into one reliable platform.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto text-base px-8 py-3.5 shadow-md shadow-emerald-600/20">
                Get Started Free <ArrowRight className="w-5 h-5 ml-1" />
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-8 py-3.5">
                Explore Live Demo (demo@keepr.app)
              </Button>
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Free & Open Source Architecture</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> PostgreSQL & Redis Powered</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Private Document Vault</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/50 border-t border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Built for real life, not spreadsheets
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-500 dark:text-slate-400">
              Stop juggling disjointed apps, paper receipts, and forgotten renewal dates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{f.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
              K
            </div>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Keepr</span>
            <span className="text-xs text-slate-400">© 2026 Keepr Platform. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400">
            <Link to="/login" className="hover:text-emerald-600 transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-emerald-600 transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
