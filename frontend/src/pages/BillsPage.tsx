import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Edit,
  History,
  CreditCard,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { EmptyState } from '../components/common/EmptyState';
import { Bill, BillCategory, BillRecurrence, BillStatus, PaymentRecord } from '../types';

export const BillsPage: React.FC = () => {
  const { currentWorkspace } = useAuth();
  const queryClient = useQueryClient();

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [payingBill, setPayingBill] = useState<Bill | null>(null);
  const [historyBill, setHistoryBill] = useState<Bill | null>(null);

  // Form states for Add/Edit Bill
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState<BillCategory>('OTHER');
  const [recurrence, setRecurrence] = useState<BillRecurrence>('MONTHLY');
  const [customDays, setCustomDays] = useState<number>(30);
  const [dueDate, setDueDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Payment form states
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState('CARD');
  const [payNotes, setPayNotes] = useState('');

  // Query bills
  const { data: bills = [], isLoading } = useQuery<Bill[]>({
    queryKey: ['bills', currentWorkspace?.id, categoryFilter, statusFilter, searchTerm],
    queryFn: () =>
      api.get<Bill[]>('/bills', {
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: searchTerm || undefined
      }),
    enabled: !!currentWorkspace?.id
  });

  // Query payment history for selected bill
  const { data: paymentHistory = [] } = useQuery<PaymentRecord[]>({
    queryKey: ['bill-payments', historyBill?.id],
    queryFn: () => api.get<PaymentRecord[]>('/bills/payments', { billId: historyBill?.id }),
    enabled: !!historyBill?.id
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/bills', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      setIsAddModalOpen(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/bills/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      setEditingBill(null);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/bills/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    }
  });

  const payMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.post(`/bills/${id}/pay`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-dashboard'] });
      setPayingBill(null);
    }
  });

  const resetForm = () => {
    setName('');
    setDescription('');
    setAmount(0);
    setCategory('OTHER');
    setRecurrence('MONTHLY');
    setDueDate(new Date().toISOString().split('T')[0]);
    setNotes('');
  };

  const openCreateModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const openEditModal = (b: Bill) => {
    setEditingBill(b);
    setName(b.name);
    setDescription(b.description || '');
    setAmount(b.amount);
    setCategory(b.category);
    setRecurrence(b.recurrence);
    setDueDate(b.dueDate ? b.dueDate.split('T')[0] : '');
    setNotes(b.notes || '');
  };

  const openPayModal = (b: Bill) => {
    setPayingBill(b);
    setPayAmount(b.amount);
    setPayMethod('CARD');
    setPayNotes(`Paid on ${new Date().toLocaleDateString()}`);
  };

  const handleCreateOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      description,
      amount: Number(amount),
      category,
      recurrence,
      customIntervalDays: recurrence === 'CUSTOM' ? Number(customDays) : undefined,
      dueDate: new Date(dueDate).toISOString(),
      notes
    };

    if (editingBill) {
      updateMutation.mutate({ id: editingBill.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleConfirmPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingBill) return;
    payMutation.mutate({
      id: payingBill.id,
      data: {
        amount: Number(payAmount),
        paymentMethod: payMethod,
        notes: payNotes
      }
    });
  };

  const categories: { label: string; value: BillCategory }[] = [
    { label: 'Rent', value: 'RENT' },
    { label: 'Electricity', value: 'ELECTRICITY' },
    { label: 'Water', value: 'WATER' },
    { label: 'Internet', value: 'INTERNET' },
    { label: 'Phone', value: 'PHONE' },
    { label: 'Insurance', value: 'INSURANCE' },
    { label: 'Maintenance', value: 'MAINTENANCE' },
    { label: 'Groceries', value: 'GROCERIES' },
    { label: 'Other', value: 'OTHER' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Bills & Recurring Payments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage household utilities, recurring rent, and track payment occurrences.
          </p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
          Add New Bill
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search bills by name or notes..."
              className="w-full bg-slate-50 dark:bg-slate-800 text-xs rounded-xl pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Category filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 text-xs rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 text-xs rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="OVERDUE">Overdue</option>
              <option value="PAID">Paid</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Bills Table / Grid */}
      {bills.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-7 h-7" />}
          title="No bills found"
          description="Create your first bill or adjust search filters to view your schedule."
          actionLabel="Add Bill"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bills.map((bill) => (
            <Card key={bill.id} className="flex flex-col justify-between hoverable">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                      {bill.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="slate" size="sm">{bill.category}</Badge>
                      <Badge
                        variant={
                          bill.status === 'PAID'
                            ? 'green'
                            : bill.status === 'OVERDUE'
                            ? 'red'
                            : 'amber'
                        }
                        size="sm"
                      >
                        {bill.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-slate-900 dark:text-white">
                      ${bill.amount.toFixed(2)}
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">
                      {bill.recurrence}
                    </span>
                  </div>
                </div>

                {bill.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                    {bill.description}
                  </p>
                )}

                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Due: {new Date(bill.dueDate).toLocaleDateString()}</span>
                  </div>
                  {bill.notes && (
                    <div className="text-[11px] text-slate-400 italic">
                      Note: {bill.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setHistoryBill(bill)}
                    title="Payment history"
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
                  >
                    <History className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEditModal(bill)}
                    title="Edit bill"
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete ${bill.name}?`)) {
                        deleteMutation.mutate(bill.id);
                      }
                    }}
                    title="Delete bill"
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {bill.status !== 'PAID' && (
                  <Button variant="primary" size="sm" onClick={() => openPayModal(bill)}>
                    Record Payment
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Bill Modal */}
      <Modal
        isOpen={isAddModalOpen || !!editingBill}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingBill(null);
        }}
        title={editingBill ? 'Edit Bill' : 'Create New Bill'}
        description="Configure recurrence and category. The recurrence engine will automatically calculate next dates."
      >
        <form onSubmit={handleCreateOrUpdate} className="space-y-4">
          <Input
            label="Bill Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Apartment Rent, Internet, Electric"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Amount ($)"
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
            />
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as BillCategory)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm py-2 px-3 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Recurrence Cycle
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as BillRecurrence)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm py-2 px-3 focus:outline-none"
              >
                <option value="ONE_TIME">One-Time</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="YEARLY">Yearly</option>
                <option value="CUSTOM">Custom Interval</option>
              </select>
            </div>

            <Input
              label="First / Next Due Date"
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {recurrence === 'CUSTOM' && (
            <Input
              label="Custom Interval (Days)"
              type="number"
              value={customDays}
              onChange={(e) => setCustomDays(parseInt(e.target.value, 10))}
              placeholder="e.g. 45"
            />
          )}

          <Input
            label="Description (Optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Account number or details"
          />

          <Input
            label="Payment Instructions / Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Pay via portal before the 5th"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingBill(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingBill ? 'Save Changes' : 'Create Bill'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={!!payingBill}
        onClose={() => setPayingBill(null)}
        title={`Record Payment for ${payingBill?.name || ''}`}
        description="Creates an immutable payment record with actor and timestamp."
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
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm py-2 px-3 focus:outline-none"
            >
              <option value="CARD">Credit / Debit Card</option>
              <option value="BANK_TRANSFER">Bank / ACH Transfer</option>
              <option value="CASH">Cash</option>
              <option value="OTHER">Other (Venmo, Zelle, PayPal)</option>
            </select>
          </div>

          <Input
            label="Notes / Confirmation Code"
            value={payNotes}
            onChange={(e) => setPayNotes(e.target.value)}
            placeholder="Transaction # or check ID"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setPayingBill(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={payMutation.isPending}>
              Confirm Payment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Payment History Modal */}
      <Modal
        isOpen={!!historyBill}
        onClose={() => setHistoryBill(null)}
        title={`Payment History: ${historyBill?.name || ''}`}
        description="Historical payment records logged by household members."
      >
        <div className="space-y-3">
          {paymentHistory.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No payment records found for this bill.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {paymentHistory.map((pmt) => (
                <div key={pmt.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      ${pmt.amount.toFixed(2)} via {pmt.paymentMethod}
                    </div>
                    <div className="text-slate-400 text-[10px]">
                      Paid by {pmt.actor?.firstName || 'Member'} on {new Date(pmt.paidAt).toLocaleString()}
                    </div>
                    {pmt.notes && <div className="text-slate-500 text-[11px] mt-0.5">{pmt.notes}</div>}
                  </div>
                  <Badge variant="green" size="sm">CONFIRMED</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
