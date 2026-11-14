import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User,
  Lock,
  Smartphone,
  Download,
  Trash2,
  ShieldAlert,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';

export const AccountSettingsPage: React.FC = () => {
  const { user, updateCurrentUser, logout } = useAuth();
  const queryClient = useQueryClient();

  // Profile Form state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordErr, setPasswordErr] = useState<string | null>(null);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

  // Queries
  const { data: sessions = [] } = useQuery<any[]>({
    queryKey: ['user-sessions'],
    queryFn: () => api.get<any[]>('/users/sessions')
  });

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => api.patch('/users/profile', data),
    onSuccess: (data: any) => {
      updateCurrentUser(data);
      setProfileMsg('Profile successfully updated!');
      setTimeout(() => setProfileMsg(null), 3000);
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: any) => api.post('/users/change-password', data),
    onSuccess: () => {
      setPasswordMsg('Password changed successfully!');
      setPasswordErr(null);
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setPasswordMsg(null), 3000);
    },
    onError: (err: any) => {
      setPasswordErr(err.message || 'Failed to change password');
    }
  });

  const revokeSessionMutation = useMutation({
    mutationFn: (sessionId: string) => api.delete(`/users/sessions/${sessionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
    }
  });

  const revokeAllOtherSessionsMutation = useMutation({
    mutationFn: () => api.delete('/users/sessions'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
    }
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (password: string) => api.delete('/users/account', { password } as any),
    onSuccess: () => {
      logout();
    },
    onError: (err: any) => {
      setDeleteErr(err.message || 'Failed to delete account');
    }
  });

  const handleExportData = async () => {
    try {
      const token = api.getAccessToken();
      const res = await fetch('/api/users/export-data', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `keepr-data-export-${user?.id}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download data export');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Account & Security Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal identity, password, active sessions, and data exports.
        </p>
      </div>

      {/* 1. Profile Information */}
      <Card>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-emerald-600" />
          <span>Profile Information</span>
        </h3>

        {profileMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{profileMsg}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateProfileMutation.mutate({ firstName, lastName });
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First name"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <Input
              label="Last name"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <Input
            label="Email Address (Verified)"
            type="email"
            disabled
            value={user?.email || ''}
            helperText="To change your primary email, contact workspace support."
          />

          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="sm" loading={updateProfileMutation.isPending}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* 2. Change Password */}
      <Card>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-blue-600" />
          <span>Change Password</span>
        </h3>

        {passwordMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{passwordMsg}</span>
          </div>
        )}

        {passwordErr && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{passwordErr}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            changePasswordMutation.mutate({ currentPassword, newPassword });
          }}
          className="space-y-4"
        >
          <Input
            label="Current Password"
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
          />

          <Input
            label="New Password"
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min 8 characters, letters & numbers"
            helperText="Must be at least 8 characters with at least 1 uppercase and 1 number"
          />

          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="sm" loading={changePasswordMutation.isPending}>
              Update Password
            </Button>
          </div>
        </form>
      </Card>

      {/* 3. Active Sessions */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-purple-600" />
              <span>Active Sessions ({sessions.length})</span>
            </h3>
            <p className="text-xs text-slate-500">Devices currently authenticated to your account.</p>
          </div>

          {sessions.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              loading={revokeAllOtherSessionsMutation.isPending}
              onClick={() => revokeAllOtherSessionsMutation.mutate()}
            >
              Revoke All Others
            </Button>
          )}
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {sessions.map((s) => (
            <div key={s.id} className="p-4 flex items-center justify-between text-xs">
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {s.userAgent || 'Web Browser (Keepr Client)'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  IP: {s.ipAddress || '127.0.0.1'} • Created: {new Date(s.createdAt).toLocaleString()}
                </div>
              </div>

              <button
                onClick={() => revokeSessionMutation.mutate(s.id)}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* 4. Data Export & Account Deletion */}
      <Card>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
          <Download className="w-4 h-4 text-emerald-600" />
          <span>Export Personal Data</span>
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Download a full JSON archive of all your personal workspaces, bills, documents metadata, inventory, and tasks.
        </p>
        <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />} onClick={handleExportData}>
          Download JSON Export
        </Button>
      </Card>

      {/* 5. Danger Zone */}
      <Card className="border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10">
        <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2 mb-1">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <span>Danger Zone</span>
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
          Permanently delete your user account and all personal workspace records. This action cannot be reversed.
        </p>
        <Button variant="danger" size="sm" onClick={() => setIsDeleteModalOpen(true)}>
          Delete Account
        </Button>
      </Card>

      {/* Delete Account Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Permanent Account Deletion"
        description="To proceed, please enter your password to confirm."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            deleteAccountMutation.mutate(deleteConfirmPassword);
          }}
          className="space-y-4"
        >
          {deleteErr && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
              {deleteErr}
            </div>
          )}

          <Input
            label="Password Confirmation"
            type="password"
            required
            value={deleteConfirmPassword}
            onChange={(e) => setDeleteConfirmPassword(e.target.value)}
            placeholder="••••••••"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" loading={deleteAccountMutation.isPending}>
              Permanently Delete
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
