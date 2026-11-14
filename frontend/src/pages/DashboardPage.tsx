import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DollarSign,
  Calendar,
  AlertTriangle,
  RefreshCw,
  CheckSquare,
  ShieldAlert,
  FileText,
  Package,
  Activity,
  Plus,
  ArrowUpRight,
  CreditCard,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Link } from 'react-router-dom';
import { DashboardAnalytics, Bill, TaskItem, ActivityLog } from '../types';

export const DashboardPage: React.FC = () => {
  const { user, currentWorkspace } = useAuth();
  const queryClient = useQueryClient();

  // Pay modal state
  const [selectedBillForPay, setSelectedBillForPay] = useState<Bill | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState('CARD');
  const [payNotes, setPayNotes] = useState('');

  // 1. Fetch real analytics metrics
  const { data: analytics, isLoading: loadingAnalytics } = useQuery<DashboardAnalytics>({
    queryKey: ['analytics-dashboard', currentWorkspace?.id],
    queryFn: () => api.get<DashboardAnalytics>('/analytics/dashboard'),
    enabled: !!currentWorkspace?.id
  });

  // 2. Fetch upcoming & overdue bills
  const { data: bills, isLoading: loadingBills } = useQuery<Bill[]>({
    queryKey: ['dashboard-bills', currentWorkspace?.id],
    queryFn: () => api.get<Bill[]>('/bills'),
    enabled: !!currentWorkspace?.id
  });

  // 3. Fetch pending tasks
  const { data: tasks, isLoading: loadingTasks } = useQuery<TaskItem[]>({
    queryKey: ['dashboard-tasks', currentWorkspace?.id],
    queryFn: () => api.get<TaskItem[]>('/tasks', { status: 'TODO' }),
    enabled: !!currentWorkspace?.id
  });

  // 4. Fetch recent activity
  const { data: activityData } = useQuery<{ items: ActivityLog[] }>({
    queryKey: ['dashboard-activity', currentWorkspace?.id],
    queryFn: () => api.get<{ items: ActivityLog[] }>('/activity', { limit: 6 }),
    enabled: !!currentWorkspace?.id
  });

  // Pay mutation
  const payMutation = useMutation({
    mutationFn: (variables: { billId: string; data: any }) =>
      api.post(`/bills/${variables.billId}/pay`, variables.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-bills'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-activity'] });
      setSelectedBillForPay(null);
    }
  });

  const handleOpenPay = (bill: Bill) => {
    setSelectedBillForPay(bill);
    setPayAmount(bill.amount);
    setPayMethod('CARD');
    setPayNotes(`Paid on ${new Date().toLocaleDateString()}`);
  };

  const handleConfirmPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBillForPay) return;
    payMutation.mutate({
      billId: selectedBillForPay.id,
      data: {
        amount: Number(payAmount),
        paymentMethod: payMethod,
        notes: payNotes
      }
    });
  };

  const upcomingOrOverdueBills = (bills || []).filter(
    (b) => b.status === 'PENDING' || b.status === 'OVERDUE'
  ).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md">
        <div>
          <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">
            Household Operations
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Welcome back, {user?.firstName}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
            Here is your financial and operational status for {currentWorkspace?.name || 'your household'}.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link to="/bills">
            <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
              Add Bill
            </Button>
          </Link>
          <Link to="/tasks">
            <Button variant="secondary" size="sm" icon={<Plus className="w-4 h-4" />}>
              New Task
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Expenditure */}
        <Card>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Monthly Spending</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            ${analytics?.monthlyExpenditure?.toFixed(2) || '0.00'}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span>{analytics?.monthlyPaymentCount || 0} payments recorded this month</span>
          </div>
        </Card>

        {/* Upcoming Bills */}
        <Card>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Upcoming Bills</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            ${analytics?.upcomingPayments?.totalAmount?.toFixed(2) || '0.00'}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            <span>{analytics?.upcomingPayments?.count || 0} bills pending due</span>
          </div>
        </Card>

        {/* Overdue Bills */}
        <Card>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Overdue Bills</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            ${analytics?.overduePayments?.totalAmount?.toFixed(2) || '0.00'}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            <span>{analytics?.overduePayments?.count || 0} require immediate attention</span>
          </div>
        </Card>

        {/* Active Subscriptions Run-rate */}
        <Card>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Subscriptions Run-rate</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            ${analytics?.subscriptions?.monthlyCost?.toFixed(2) || '0.00'}
            <span className="text-xs font-normal text-slate-400">/mo</span>
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            <span>{analytics?.subscriptions?.activeCount || 0} active recurring services</span>
          </div>
        </Card>
      </div>

      {/* Main Grid: Bills vs Tasks & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Upcoming & Overdue Bills (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Bills & Scheduled Payments
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Upcoming obligations with quick payment logging
                </p>
              </div>
              <Link to="/bills" className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 flex items-center gap-1">
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {upcomingOrOverdueBills.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No pending bills. You are completely caught up!
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {upcomingOrOverdueBills.map((bill) => (
                  <div key={bill.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {bill.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <span>{bill.category}</span>
                          <span>•</span>
                          <span>Due {new Date(bill.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          ${bill.amount.toFixed(2)}
                        </div>
                        <Badge variant={bill.status === 'OVERDUE' ? 'red' : 'amber'} size="sm">
                          {bill.status}
                        </Badge>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenPay(bill)}
                      >
                        Pay
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Pending Tasks */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Pending Household Tasks
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {tasks?.length || 0} chores and assignments awaiting action
                </p>
              </div>
              <Link to="/tasks" className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 flex items-center gap-1">
                Open Board <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {(tasks || []).length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No pending tasks.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {(tasks || []).slice(0, 4).map((task) => (
                  <div key={task.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <CheckSquare className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {task.title}
                        </div>
                        {task.deadline && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>Due {new Date(task.deadline).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={
                        task.priority === 'URGENT' || task.priority === 'HIGH'
                          ? 'red'
                          : task.priority === 'MEDIUM'
                          ? 'amber'
                          : 'slate'
                      }
                      size="sm"
                    >
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Activity Feed & Quick Links */}
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Recent Activity</span>
              </h3>
            </div>

            <div className="space-y-4">
              {(activityData?.items || []).length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No recent activity logged.</p>
              ) : (
                (activityData?.items || []).map((act) => (
                  <div key={act.id} className="text-xs border-l-2 border-emerald-500 pl-3 py-0.5">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {act.actor?.firstName || 'System'} {act.action.toLowerCase()}d {act.entity.toLowerCase()}
                      {act.entityName ? ` "${act.entityName}"` : ''}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(act.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Quick Operations Shortcuts */}
          <Card>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Quick Operations
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs font-medium">
              <Link
                to="/documents"
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex flex-col items-center justify-center text-center gap-1.5 transition-colors"
              >
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Upload Document</span>
              </Link>
              <Link
                to="/inventory"
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex flex-col items-center justify-center text-center gap-1.5 transition-colors"
              >
                <Package className="w-4 h-4 text-purple-600" />
                <span>Add Inventory</span>
              </Link>
              <Link
                to="/subscriptions"
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex flex-col items-center justify-center text-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-blue-600" />
                <span>Track Subscription</span>
              </Link>
              <Link
                to="/analytics"
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex flex-col items-center justify-center text-center gap-1.5 transition-colors"
              >
                <DollarSign className="w-4 h-4 text-amber-600" />
                <span>View Analytics</span>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Pay Modal */}
      <Modal
        isOpen={!!selectedBillForPay}
        onClose={() => setSelectedBillForPay(null)}
        title={`Record Payment for ${selectedBillForPay?.name || ''}`}
        description="This logs an immutable manual payment record and automatically advances recurring occurrences."
      >
        <form onSubmit={handleConfirmPay} className="space-y-4">
          <Input
            label="Payment Amount ($)"
            type="number"
            step="0.01"
            required
            value={payAmount}
            onChange={(e) => setPayAmount(parseFloat(e.target.value))}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Payment Method
            </label>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="CARD">Credit / Debit Card</option>
              <option value="BANK_TRANSFER">Bank / ACH Transfer</option>
              <option value="CASH">Cash</option>
              <option value="OTHER">Other Provider (Venmo, PayPal, Zelle)</option>
            </select>
          </div>

          <Input
            label="Notes"
            value={payNotes}
            onChange={(e) => setPayNotes(e.target.value)}
            placeholder="Confirmation code or check #"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSelectedBillForPay(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={payMutation.isPending}
            >
              Confirm & Save Payment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
