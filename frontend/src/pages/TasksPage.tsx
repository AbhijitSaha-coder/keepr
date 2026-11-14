import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckSquare,
  Plus,
  Search,
  LayoutList,
  Kanban,
  Clock,
  MessageSquare,
  Trash2,
  Edit,
  CheckCircle2,
  User,
  Send
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { EmptyState } from '../components/common/EmptyState';
import { TaskItem, TaskPriority, TaskStatus, WorkspaceMember } from '../types';

export const TasksPage: React.FC = () => {
  const { currentWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [selectedTaskForComments, setSelectedTaskForComments] = useState<TaskItem | null>(null);
  const [newComment, setNewComment] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [deadline, setDeadline] = useState('');
  const [assignedMemberId, setAssignedMemberId] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceInterval, setRecurrenceInterval] = useState('WEEKLY');

  // Queries
  const { data: tasks = [], isLoading } = useQuery<TaskItem[]>({
    queryKey: ['tasks', currentWorkspace?.id, priorityFilter, statusFilter, searchTerm],
    queryFn: () =>
      api.get<TaskItem[]>('/tasks', {
        priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: searchTerm || undefined
      }),
    enabled: !!currentWorkspace?.id
  });

  const { data: members = [] } = useQuery<WorkspaceMember[]>({
    queryKey: ['workspace-members', currentWorkspace?.id],
    queryFn: () => api.get<WorkspaceMember[]>(`/workspaces/${currentWorkspace?.id}/members`),
    enabled: !!currentWorkspace?.id
  });

  // Query selected task details (including comments)
  const { data: taskDetails } = useQuery<TaskItem>({
    queryKey: ['task-details', selectedTaskForComments?.id],
    queryFn: () => api.get<TaskItem>(`/tasks/${selectedTaskForComments?.id}`),
    enabled: !!selectedTaskForComments?.id
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/tasks', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsAddModalOpen(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/tasks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setEditingTask(null);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const commentMutation = useMutation({
    mutationFn: ({ taskId, content }: { taskId: string; content: string }) =>
      api.post(`/tasks/${taskId}/comments`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-details', selectedTaskForComments?.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setNewComment('');
    }
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('MEDIUM');
    setStatus('TODO');
    setDeadline('');
    setAssignedMemberId('');
    setIsRecurring(false);
    setRecurrenceInterval('WEEKLY');
  };

  const openEditModal = (t: TaskItem) => {
    setEditingTask(t);
    setTitle(t.title);
    setDescription(t.description || '');
    setPriority(t.priority);
    setStatus(t.status);
    setDeadline(t.deadline ? t.deadline.split('T')[0] : '');
    setAssignedMemberId(t.assignedMemberId || '');
    setIsRecurring(t.isRecurring);
    setRecurrenceInterval(t.recurrenceInterval || 'WEEKLY');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title,
      description: description || undefined,
      priority,
      status,
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
      assignedMemberId: assignedMemberId || undefined,
      isRecurring,
      recurrenceInterval: isRecurring ? recurrenceInterval : undefined
    };

    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForComments || !newComment.trim()) return;
    commentMutation.mutate({
      taskId: selectedTaskForComments.id,
      content: newComment.trim()
    });
  };

  const kanbanColumns: { status: TaskStatus; title: string }[] = [
    { status: 'TODO', title: 'To Do' },
    { status: 'IN_PROGRESS', title: 'In Progress' },
    { status: 'COMPLETED', title: 'Completed' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Household Tasks & Chores
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Assign duties, track maintenance chores, and collaborate across your household.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutList className="w-4 h-4" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Kanban className="w-4 h-4" />
              <span>Board</span>
            </button>
          </div>

          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
          >
            New Task
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tasks by title..."
              className="w-full bg-slate-50 dark:bg-slate-800 text-xs rounded-xl pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 text-xs rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Content based on view mode */}
      {tasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="w-7 h-7" />}
          title="No tasks scheduled"
          description="Create shared chores, repair duties, and maintenance checklists."
          actionLabel="New Task"
          onAction={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
        />
      ) : viewMode === 'kanban' ? (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {kanbanColumns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.status);
            return (
              <div key={col.status} className="bg-slate-100/70 dark:bg-slate-900/40 rounded-2xl p-4 flex flex-col">
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      {col.title}
                    </span>
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-bold flex items-center justify-center text-slate-600 dark:text-slate-400">
                      {colTasks.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colTasks.map((task) => (
                    <Card key={task.id} className="p-4 hoverable cursor-pointer" onClick={() => setSelectedTaskForComments(task)}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                          {task.title}
                        </h4>
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

                      {task.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1.5">
                          {task.assignedMember ? (
                            <span className="font-medium text-slate-600 dark:text-slate-300">
                              @{task.assignedMember.firstName}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          {task.deadline && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(task.deadline).toLocaleDateString()}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-slate-400">
                            <MessageSquare className="w-3 h-3" />
                            {task._count?.comments || 0}
                          </span>
                        </div>
                      </div>

                      {/* Quick Status Shift */}
                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(task)}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete task "${task.title}"?`)) {
                                deleteMutation.mutate(task.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {task.status !== 'COMPLETED' ? (
                          <button
                            onClick={() => updateMutation.mutate({ id: task.id, data: { status: 'COMPLETED' } })}
                            className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-500 flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Done
                          </button>
                        ) : (
                          <button
                            onClick={() => updateMutation.mutate({ id: task.id, data: { status: 'TODO' } })}
                            className="text-[11px] font-semibold text-slate-500 hover:text-slate-700"
                          >
                            Reopen
                          </button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <button
                  onClick={() =>
                    updateMutation.mutate({
                      id: task.id,
                      data: { status: task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED' }
                    })
                  }
                  className="mt-0.5"
                >
                  <CheckCircle2
                    className={`w-5 h-5 ${
                      task.status === 'COMPLETED'
                        ? 'text-emerald-600 fill-emerald-100 dark:fill-emerald-950'
                        : 'text-slate-300 dark:text-slate-700 hover:text-slate-400'
                    }`}
                  />
                </button>
                <div>
                  <h4
                    className={`text-sm font-bold ${
                      task.status === 'COMPLETED'
                        ? 'line-through text-slate-400'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {task.title}
                  </h4>
                  {task.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{task.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-400">
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
                    {task.assignedMember && <span>Assigned to: {task.assignedMember.firstName}</span>}
                    {task.deadline && <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <Button variant="ghost" size="sm" onClick={() => setSelectedTaskForComments(task)}>
                  <MessageSquare className="w-3.5 h-3.5 mr-1" />
                  <span>Comments ({task._count?.comments || 0})</span>
                </Button>
                <button onClick={() => openEditModal(task)} className="p-1.5 text-slate-400 hover:text-slate-600">
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${task.title}"?`)) deleteMutation.mutate(task.id);
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Task Modal */}
      <Modal
        isOpen={isAddModalOpen || !!editingTask}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTask(null);
        }}
        title={editingTask ? 'Edit Task' : 'New Household Task'}
        description="Assign responsibilities and set priorities across household members."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Task Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Clean air filters, buy salt for softener"
          />

          <Input
            label="Description (Optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Specific instructions or tool requirements"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm py-2 px-3 focus:outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Assignee
              </label>
              <select
                value={assignedMemberId}
                onChange={(e) => setAssignedMemberId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm py-2 px-3 focus:outline-none"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user.firstName} {m.user.lastName} ({m.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Deadline (Optional)"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm py-2 px-3 focus:outline-none"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isRecurringCheck"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="isRecurringCheck" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
              Recurring Chore (e.g. Weekly trash, Monthly filters)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingTask(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingTask ? 'Save Changes' : 'Create Task'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Task Comments & Details Drawer Modal */}
      <Modal
        isOpen={!!selectedTaskForComments}
        onClose={() => setSelectedTaskForComments(null)}
        title={taskDetails?.title || 'Task Details'}
        description={`Status: ${taskDetails?.status || ''} • Priority: ${taskDetails?.priority || ''}`}
      >
        <div className="space-y-4">
          {taskDetails?.description && (
            <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
              {taskDetails.description}
            </p>
          )}

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Discussion & Comments
            </h4>

            <div className="space-y-2.5 max-h-60 overflow-y-auto mb-4">
              {(taskDetails?.comments || []).length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No comments yet. Post the first update!</p>
              ) : (
                taskDetails?.comments?.map((c) => (
                  <div key={c.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {c.author.firstName} {c.author.lastName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300">{c.content}</div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handlePostComment} className="flex gap-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="text-xs py-1.5"
              />
              <Button type="submit" variant="primary" size="sm" loading={commentMutation.isPending}>
                <Send className="w-3.5 h-3.5" />
              </Button>
            </form>
          </div>
        </div>
      </Modal>
    </div>
  );
};
