import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  RefreshCw,
  Plus,
  Search,
  ExternalLink,
  PauseCircle,
  PlayCircle,
  XCircle,
  Edit,
  Trash2,
  DollarSign,
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { EmptyState } from '../components/common/EmptyState';
import { SubscriptionItem, SubscriptionCycle, SubscriptionStatus } from '../types';

export const SubscriptionsPage: React.FC = () => {
  const { currentWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SubscriptionItem | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [cycle, setCycle] = useState<SubscriptionCycle>('MONTHLY');
  const [nextRenewal, setNextRenewal] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Entertainment');
  const [cancellationUrl, setCancellationUrl] = useState('');
  const [notes, setNotes] = useState('');

  // Queries
  const { data: subscriptions = [] } = useQuery<SubscriptionItem[]>({
    queryKey: ['subscriptions', currentWorkspace?.id, statusFilter, searchTerm],
    queryFn: () =>
      api.get<SubscriptionItem[]>('/subscriptions', {
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: searchTerm || undefined
      }),
    enabled: !!currentWorkspace?.id
  });

  const { data: summary } = useQuery<{
    monthlyExpenditure: number;
    annualExpenditure: number;
    activeCount: number;
    pausedCount: number;
    categoryBreakdown: { category: string; monthlyExpenditure: number; count: number }[];
  }>({
    queryKey: ['subscriptions-summary', currentWorkspace?.id],
    queryFn: () => api.get('/subscriptions/summary'),
    enabled: !!currentWorkspace?.id
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/subscriptions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions-summary'] });
      setIsAddModalOpen(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/subscriptions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions-summary'] });
      setEditingSub(null);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/subscriptions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions-summary'] });
    }
  });

  const resetForm = () => {
    setName('');
    setProvider('');
    setAmount(0);
    setCycle('MONTHLY');
    setNextRenewal(new Date().toISOString().split('T')[0]);
    setCategory('Entertainment');
    setCancellationUrl('');
    setNotes('');
  };

  const openEditModal = (sub: SubscriptionItem) => {
    setEditingSub(sub);
    setName(sub.name);
    setProvider(sub.provider);
    setAmount(sub.amount);
    setCycle(sub.billingCycle);
    setNextRenewal(sub.nextRenewalDate ? sub.nextRenewalDate.split('T')[0] : '');
    setCategory(sub.category);
    setCancellationUrl(sub.cancellationUrl || '');
    setNotes(sub.notes || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      provider,
      amount: Number(amount),
      billingCycle: cycle,
      nextRenewalDate: new Date(nextRenewal).toISOString(),
      category,
      cancellationUrl: cancellationUrl || undefined,
      notes
    };

    if (editingSub) {
      updateMutation.mutate({ id: editingSub.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleStatusChange = (sub: SubscriptionItem, newStatus: SubscriptionStatus) => {
    updateMutation.mutate({ id: sub.id, data: { status: newStatus } });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Subscription Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track streaming services, cloud storage, software licenses, and projected renewals.
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
        >
          Add Subscription
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Monthly Run-Rate
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            ${summary?.monthlyExpenditure?.toFixed(2) || '0.00'}
            <span className="text-xs font-normal text-slate-400">/mo</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Calculated across {summary?.activeCount || 0} active subscriptions
          </div>
        </Card>

        <Card>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Annual Projected Run-Rate
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            ${summary?.annualExpenditure?.toFixed(2) || '0.00'}
            <span className="text-xs font-normal text-slate-400">/yr</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Total projected yearly commitment</div>
        </Card>

        <Card>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Status Breakdown
          </div>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="green" size="md">{summary?.activeCount || 0} Active</Badge>
            <Badge variant="amber" size="md">{summary?.pausedCount || 0} Paused</Badge>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or provider..."
              className="w-full bg-slate-50 dark:bg-slate-800 text-xs rounded-xl pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 text-xs rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Subscriptions Grid */}
      {subscriptions.length === 0 ? (
        <EmptyState
          icon={<RefreshCw className="w-7 h-7" />}
          title="No subscriptions found"
          description="Track recurring subscriptions to manage monthly expenses and avoid surprise renewals."
          actionLabel="Add Subscription"
          onAction={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subscriptions.map((sub) => (
            <Card key={sub.id} className="flex flex-col justify-between hoverable">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                      {sub.name}
                    </h3>
                    <div className="text-xs text-slate-400 font-medium">{sub.provider}</div>
                  </div>
                  <Badge
                    variant={
                      sub.status === 'ACTIVE'
                        ? 'green'
                        : sub.status === 'PAUSED'
                        ? 'amber'
                        : 'slate'
                    }
                    size="sm"
                  >
                    {sub.status}
                  </Badge>
                </div>

                <div className="flex items-baseline gap-1 my-3">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    ${sub.amount.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold uppercase">
                    / {sub.billingCycle.toLowerCase()}
                  </span>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Next renewal: {new Date(sub.nextRenewalDate).toLocaleDateString()}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Category: <span className="font-medium text-slate-600 dark:text-slate-300">{sub.category}</span>
                  </div>
                  {sub.notes && <div className="text-[11px] text-slate-400 italic mt-1">{sub.notes}</div>}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {sub.cancellationUrl && (
                    <a
                      href={sub.cancellationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Manage / Cancel"
                      className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}

                  {sub.status === 'ACTIVE' ? (
                    <button
                      onClick={() => handleStatusChange(sub, 'PAUSED')}
                      title="Pause subscription"
                      className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg"
                    >
                      <PauseCircle className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange(sub, 'ACTIVE')}
                      title="Resume subscription"
                      className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg"
                    >
                      <PlayCircle className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => openEditModal(sub)}
                    title="Edit subscription"
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Delete subscription "${sub.name}"?`)) {
                        deleteMutation.mutate(sub.id);
                      }
                    }}
                    title="Delete subscription"
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <Badge variant="slate" size="sm">{sub.billingCycle}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isAddModalOpen || !!editingSub}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingSub(null);
        }}
        title={editingSub ? 'Edit Subscription' : 'Add Subscription'}
        description="Configure provider details, recurring renewal cycle, and cancellation links."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Subscription Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Netflix, Spotify, iCloud"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Provider"
              required
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder="Apple, Google, Netflix"
            />
            <Input
              label="Amount ($)"
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Billing Cycle
              </label>
              <select
                value={cycle}
                onChange={(e) => setCycle(e.target.value as SubscriptionCycle)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm py-2 px-3 focus:outline-none"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="ANNUAL">Annual</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="WEEKLY">Weekly</option>
              </select>
            </div>

            <Input
              label="Next Renewal Date"
              type="date"
              required
              value={nextRenewal}
              onChange={(e) => setNextRenewal(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Streaming, Cloud, Utilities"
            />
            <Input
              label="Cancellation URL (Optional)"
              type="url"
              value={cancellationUrl}
              onChange={(e) => setCancellationUrl(e.target.value)}
              placeholder="https://provider.com/cancel"
            />
          </div>

          <Input
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Card used, family plan members, etc."
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingSub(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingSub ? 'Save Changes' : 'Add Subscription'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
