import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Crown,
  Trash2,
  Edit,
  Mail,
  Home,
  ArrowRightLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { WorkspaceMember, MemberRole } from '../types';

export const WorkspaceSettingsPage: React.FC = () => {
  const { currentWorkspace, user, refreshWorkspaces } = useAuth();
  const queryClient = useQueryClient();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isNewWorkspaceModalOpen, setIsNewWorkspaceModalOpen] = useState(false);

  // Invite states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<MemberRole>('MEMBER');

  // New workspace states
  const [newWsName, setNewWsName] = useState('');
  const [newWsType, setNewWsType] = useState('HOUSEHOLD');

  // Transfer state
  const [selectedNewOwnerId, setSelectedNewOwnerId] = useState('');

  // Queries
  const { data: members = [] } = useQuery<WorkspaceMember[]>({
    queryKey: ['workspace-members', currentWorkspace?.id],
    queryFn: () => api.get<WorkspaceMember[]>(`/workspaces/${currentWorkspace?.id}/members`),
    enabled: !!currentWorkspace?.id
  });

  const { data: invitations = [] } = useQuery<any[]>({
    queryKey: ['workspace-invitations', currentWorkspace?.id],
    queryFn: () => api.get<any[]>(`/workspaces/${currentWorkspace?.id}/invitations`),
    enabled: !!currentWorkspace?.id
  });

  // Mutations
  const inviteMutation = useMutation({
    mutationFn: (data: any) =>
      api.post(`/workspaces/${currentWorkspace?.id}/members/invite`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-invitations'] });
      setIsInviteModalOpen(false);
      setInviteEmail('');
    }
  });

  const createWorkspaceMutation = useMutation({
    mutationFn: (data: any) => api.post('/workspaces', data),
    onSuccess: async () => {
      await refreshWorkspaces();
      setIsNewWorkspaceModalOpen(false);
      setNewWsName('');
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: MemberRole }) =>
      api.patch(`/workspaces/${currentWorkspace?.id}/members/${userId}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members'] });
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) =>
      api.delete(`/workspaces/${currentWorkspace?.id}/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members'] });
    }
  });

  const transferOwnershipMutation = useMutation({
    mutationFn: (newOwnerId: string) =>
      api.post(`/workspaces/${currentWorkspace?.id}/transfer-ownership`, { newOwnerId }),
    onSuccess: async () => {
      await refreshWorkspaces();
      queryClient.invalidateQueries({ queryKey: ['workspace-members'] });
      setIsTransferModalOpen(false);
    }
  });

  const isOwner = currentWorkspace?.role === 'OWNER';
  const isAdmin = currentWorkspace?.role === 'ADMIN' || isOwner;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Workspace & Household Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage members, roles, household invitations, and create additional workspaces.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsNewWorkspaceModalOpen(true)}
          >
            + Create Workspace
          </Button>

          {isAdmin && (
            <Button
              variant="primary"
              size="sm"
              icon={<UserPlus className="w-4 h-4" />}
              onClick={() => setIsInviteModalOpen(true)}
            >
              Invite Member
            </Button>
          )}
        </div>
      </div>

      {/* Current Workspace Info */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Home className="w-4 h-4 text-emerald-600" />
              <span>{currentWorkspace?.name}</span>
            </h3>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <span>Slug: <span className="font-mono text-slate-600 dark:text-slate-300">{currentWorkspace?.slug}</span></span>
              <span>•</span>
              <span>Currency: {currentWorkspace?.currency}</span>
              <span>•</span>
              <span>Your Role: <strong>{currentWorkspace?.role}</strong></span>
            </div>
          </div>

          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowRightLeft className="w-4 h-4" />}
              onClick={() => setIsTransferModalOpen(true)}
            >
              Transfer Ownership
            </Button>
          )}
        </div>
      </Card>

      {/* Members List */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Household Members ({members.length})</span>
          </h3>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {members.map((m) => (
            <div key={m.id} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                  {m.user.firstName?.[0] || 'M'}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{m.user.firstName} {m.user.lastName}</span>
                    {m.userId === user?.id && <span className="text-[10px] text-emerald-600 font-normal">(You)</span>}
                  </div>
                  <div className="text-xs text-slate-500">{m.user.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge
                  variant={m.role === 'OWNER' ? 'green' : m.role === 'ADMIN' ? 'purple' : 'slate'}
                  size="sm"
                >
                  {m.role === 'OWNER' && <Crown className="w-3 h-3 mr-1 inline" />}
                  {m.role}
                </Badge>

                {/* Role dropdown for Owner */}
                {isOwner && m.role !== 'OWNER' && (
                  <select
                    value={m.role}
                    onChange={(e) =>
                      updateRoleMutation.mutate({ userId: m.userId, role: e.target.value as MemberRole })
                    }
                    className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                )}

                {/* Remove member button */}
                {m.role !== 'OWNER' && (isAdmin || m.userId === user?.id) && (
                  <button
                    onClick={() => {
                      const msg =
                        m.userId === user?.id
                          ? 'Leave this household workspace?'
                          : `Remove ${m.user.firstName} from workspace?`;
                      if (confirm(msg)) removeMemberMutation.mutate(m.userId);
                    }}
                    title={m.userId === user?.id ? 'Leave workspace' : 'Remove member'}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Pending Invitations */}
      {isAdmin && (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              <span>Pending Invitations ({invitations.length})</span>
            </h3>
          </div>

          {invitations.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No pending invitations.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {invitations.map((inv) => (
                <div key={inv.id} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {inv.email}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Role: {inv.role} • Invited {new Date(inv.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-[10px] text-emerald-600 font-mono mt-1">
                      Token: {inv.token}
                    </div>
                  </div>
                  <Badge variant="amber" size="sm">{inv.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Invite Member Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Household Member"
        description="Invited members will receive an email and token to join this workspace."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            inviteMutation.mutate({ email: inviteEmail, role: inviteRole });
          }}
          className="space-y-4"
        >
          <Input
            label="Member Email"
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="roommate@example.com"
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Assigned Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as MemberRole)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm py-2 px-3 focus:outline-none"
            >
              <option value="MEMBER">Member (Can view, create bills, log payments, complete tasks)</option>
              <option value="ADMIN">Admin (Can also invite and remove members)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={inviteMutation.isPending}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create New Workspace Modal */}
      <Modal
        isOpen={isNewWorkspaceModalOpen}
        onClose={() => setIsNewWorkspaceModalOpen(false)}
        title="Create New Workspace"
        description="Create an additional household or separate personal workspace."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createWorkspaceMutation.mutate({ name: newWsName, type: newWsType });
          }}
          className="space-y-4"
        >
          <Input
            label="Workspace Name"
            required
            value={newWsName}
            onChange={(e) => setNewWsName(e.target.value)}
            placeholder="Cabin House, Second Apartment"
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Workspace Type
            </label>
            <select
              value={newWsType}
              onChange={(e) => setNewWsType(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm py-2 px-3 focus:outline-none"
            >
              <option value="HOUSEHOLD">Household (Supports multi-member sharing & chores)</option>
              <option value="PERSONAL">Personal Space</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsNewWorkspaceModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={createWorkspaceMutation.isPending}>
              Create Workspace
            </Button>
          </div>
        </form>
      </Modal>

      {/* Transfer Ownership Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Transfer Workspace Ownership"
        description="Select an existing household member to become the new Owner. Your role will change to Admin."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!selectedNewOwnerId) return;
            transferOwnershipMutation.mutate(selectedNewOwnerId);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Select New Owner
            </label>
            <select
              value={selectedNewOwnerId}
              onChange={(e) => setSelectedNewOwnerId(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm py-2 px-3 focus:outline-none"
            >
              <option value="">Choose a member...</option>
              {members
                .filter((m) => m.userId !== user?.id)
                .map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user.firstName} {m.user.lastName} ({m.user.email})
                  </option>
                ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" loading={transferOwnershipMutation.isPending}>
              Confirm Transfer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
