import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  CheckCircle2,
  Trash2,
  Settings,
  Mail,
  Clock,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  FolderLock,
  Package,
  CheckSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { EmptyState } from '../components/common/EmptyState';
import { NotificationItem, NotificationType } from '../types';

export const NotificationsPage: React.FC = () => {
  const { currentWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'notifications' | 'outbox'>('notifications');
  const [isPrefsModalOpen, setIsPrefsModalOpen] = useState(false);

  // Preference form states
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [billDueDays, setBillDueDays] = useState(3);
  const [subRenewalDays, setSubRenewalDays] = useState(3);
  const [warrantyDays, setWarrantyDays] = useState(14);

  // Queries
  const { data: notifData } = useQuery<{ items: NotificationItem[]; total: number; unreadCount: number }>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications')
  });

  const { data: prefs } = useQuery<any>({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const p = await api.get<any>('/notifications/preferences');
      setEmailEnabled(p.emailEnabled);
      setInAppEnabled(p.inAppEnabled);
      setBillDueDays(p.billDueDays);
      setSubRenewalDays(p.subscriptionRenewalDays);
      setWarrantyDays(p.warrantyExpiringDays);
      return p;
    }
  });

  const { data: devOutbox = [] } = useQuery<any[]>({
    queryKey: ['dev-outbox'],
    queryFn: () => api.get<any[]>('/notifications/dev-inbox'),
    enabled: activeTab === 'outbox'
  });

  // Mutations
  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.post('/notifications/mark-all-read'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const triggerRemindersMutation = useMutation({
    mutationFn: () => api.post('/notifications/trigger-reminders'),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dev-outbox'] });
      alert(`Reminder scan executed: Checked ${data.data?.checked || 0} items, enqueued ${data.data?.enqueued || 0} notifications.`);
    }
  });

  const updatePrefsMutation = useMutation({
    mutationFn: (data: any) => api.patch('/notifications/preferences', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      setIsPrefsModalOpen(false);
    }
  });

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    updatePrefsMutation.mutate({
      emailEnabled,
      inAppEnabled,
      billDueDays: Number(billDueDays),
      subscriptionRenewalDays: Number(subRenewalDays),
      warrantyExpiringDays: Number(warrantyDays)
    });
  };

  const getNotifIcon = (type: NotificationType) => {
    switch (type) {
      case 'BILL_DUE':
      case 'BILL_OVERDUE':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'SUBSCRIPTION_RENEWAL':
        return <RefreshCw className="w-4 h-4 text-purple-500" />;
      case 'WARRANTY_EXPIRING':
        return <Package className="w-4 h-4 text-blue-500" />;
      case 'DOCUMENT_EXPIRING':
        return <FolderLock className="w-4 h-4 text-rose-500" />;
      case 'TASK_DEADLINE':
        return <CheckSquare className="w-4 h-4 text-emerald-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Notifications & Alerts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Automated background reminders for upcoming bills, renewals, warranties, and deadlines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<Sparkles className="w-4 h-4 text-emerald-600" />}
            loading={triggerRemindersMutation.isPending}
            onClick={() => triggerRemindersMutation.mutate()}
          >
            Run Reminder Job
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={<Settings className="w-4 h-4" />}
            onClick={() => setIsPrefsModalOpen(true)}
          >
            Preferences
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('notifications')}
          className={`pb-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-colors ${
            activeTab === 'notifications'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          In-App Notifications ({notifData?.unreadCount || 0} unread)
        </button>

        <button
          onClick={() => setActiveTab('outbox')}
          className={`pb-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-colors ${
            activeTab === 'outbox'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Dev Email Outbox Viewer
        </button>
      </div>

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Showing {notifData?.items.length || 0} notifications
            </span>
            {notifData?.unreadCount ? (
              <button
                onClick={() => markAllReadMutation.mutate()}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Mark all as read
              </button>
            ) : null}
          </div>

          {(notifData?.items || []).length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No notifications. All caught up!
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {notifData?.items.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                    !n.read
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20'
                      : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                      {getNotifIcon(n.type)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{n.title}</span>
                        {!n.read && <Badge variant="green" size="sm">NEW</Badge>}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{n.message}</p>
                      <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!n.read && (
                      <button
                        onClick={() => markReadMutation.mutate(n.id)}
                        title="Mark as read"
                        className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteMutation.mutate(n.id)}
                      title="Delete notification"
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Dev Email Outbox Viewer Tab */}
      {activeTab === 'outbox' && (
        <div className="space-y-4">
          <Card className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-1">
              Development Email Adapter
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              When SMTP credentials are not configured, Keepr captures all outbound emails in this in-memory outbox. Verification tokens, reset links, and BullMQ reminder dispatches appear here.
            </p>
          </Card>

          <Card className="p-0 overflow-hidden">
            {devOutbox.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No emails sent in this session yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {devOutbox.map((mail, idx) => (
                  <div key={idx} className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        To: <span className="font-mono text-emerald-600 dark:text-emerald-400">{mail.to}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(mail.sentAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">
                      Subject: {mail.subject}
                    </div>
                    <div
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 font-sans"
                      dangerouslySetInnerHTML={{ __html: mail.html }}
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Preferences Modal */}
      <Modal
        isOpen={isPrefsModalOpen}
        onClose={() => setIsPrefsModalOpen(false)}
        title="Notification Preferences"
        description="Configure your personal reminder intervals and delivery channels."
      >
        <form onSubmit={handleSavePreferences} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                In-App Notification Center
              </span>
              <input
                type="checkbox"
                checked={inAppEnabled}
                onChange={(e) => setInAppEnabled(e.target.checked)}
                className="rounded text-emerald-600"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Email Notifications & Digests
              </span>
              <input
                type="checkbox"
                checked={emailEnabled}
                onChange={(e) => setEmailEnabled(e.target.checked)}
                className="rounded text-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Input
              label="Bill Due Reminder (Days Before)"
              type="number"
              min={0}
              max={30}
              value={billDueDays}
              onChange={(e) => setBillDueDays(parseInt(e.target.value, 10))}
            />
            <Input
              label="Subscription Renewal (Days Before)"
              type="number"
              min={0}
              max={30}
              value={subRenewalDays}
              onChange={(e) => setSubRenewalDays(parseInt(e.target.value, 10))}
            />
          </div>

          <Input
            label="Warranty Expiration Alert (Days Before)"
            type="number"
            min={0}
            max={60}
            value={warrantyDays}
            onChange={(e) => setWarrantyDays(parseInt(e.target.value, 10))}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsPrefsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={updatePrefsMutation.isPending}>
              Save Preferences
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
