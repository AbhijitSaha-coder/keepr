import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  PieChart as PieIcon,
  Users,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Card } from '../components/common/Card';
import { DashboardAnalytics } from '../types';

export const AnalyticsPage: React.FC = () => {
  const { currentWorkspace } = useAuth();

  const { data: analytics, isLoading } = useQuery<DashboardAnalytics>({
    queryKey: ['analytics-dashboard', currentWorkspace?.id],
    queryFn: () => api.get<DashboardAnalytics>('/analytics/dashboard'),
    enabled: !!currentWorkspace?.id
  });

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Financial & Operational Analytics
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Real-time PostgreSQL aggregates across payments, categories, recurring run-rate, and chores.
        </p>
      </div>

      {/* Top Level Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            This Month Payments
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            ${analytics?.monthlyExpenditure?.toFixed(2) || '0.00'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {analytics?.monthlyPaymentCount || 0} transactions verified
          </div>
        </Card>

        <Card>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Calendar Year Total
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            ${analytics?.yearlyExpenditure?.toFixed(2) || '0.00'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {analytics?.yearlyPaymentCount || 0} total payments in {new Date().getFullYear()}
          </div>
        </Card>

        <Card>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Annual Subscriptions
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            ${analytics?.subscriptions?.annualCost?.toFixed(2) || '0.00'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            ${analytics?.subscriptions?.monthlyCost?.toFixed(2)}/mo recurring run-rate
          </div>
        </Card>

        <Card>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Task Completion Rate
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {analytics?.taskStats?.completionRatePercent || 0}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {analytics?.taskStats?.completed || 0} of {analytics?.taskStats?.total || 0} tasks done
          </div>
        </Card>
      </div>

      {/* Charts Row 1: Spending Trends (Area) & Category Breakdown (Pie) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Monthly Spending Trends (2 cols) */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Monthly Spending Trends (Last 6 Months)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Aggregated payment history records grouped by month
              </p>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.spendingTrends || []}>
                <defs>
                  <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Spent']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#spendingGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Right: Category Spending Pie */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-blue-600" />
              <span>Category Breakdown</span>
            </h3>
          </div>

          {(analytics?.categorySpending || []).length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              No payment categories recorded yet.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics?.categorySpending}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={3}
                  >
                    {analytics?.categorySpending.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`$${Number(val).toFixed(2)}`, 'Total']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Charts Row 2: Member Expense Distribution & Bill Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Member Expense Distribution */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <span>Household Expense Distribution</span>
            </h3>
          </div>

          {(analytics?.memberSpending || []).length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-slate-400">
              No payments logged by members yet.
            </div>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.memberSpending}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="memberName" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `$${val}`} />
                  <Tooltip
                    formatter={(val: any) => [`$${Number(val).toFixed(2)}`, 'Paid']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="total" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Bill Status Breakdown */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-600" />
              <span>Bill Status Overview</span>
            </h3>
          </div>

          <div className="space-y-4 pt-2">
            {(analytics?.billStatusOverview || []).map((b) => (
              <div key={b.status} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      b.status === 'PAID'
                        ? 'bg-emerald-500'
                        : b.status === 'OVERDUE'
                        ? 'bg-rose-500'
                        : 'bg-amber-500'
                    }`}
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {b.status}
                  </span>
                  <span className="text-xs text-slate-400">({b.count} bills)</span>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  ${b.totalAmount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
