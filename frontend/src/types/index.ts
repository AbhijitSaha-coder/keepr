export type WorkspaceType = 'PERSONAL' | 'HOUSEHOLD';
export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export type BillCategory =
  | 'RENT'
  | 'ELECTRICITY'
  | 'WATER'
  | 'INTERNET'
  | 'PHONE'
  | 'INSURANCE'
  | 'MAINTENANCE'
  | 'GROCERIES'
  | 'OTHER';

export type BillRecurrence =
  | 'ONE_TIME'
  | 'DAILY'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'YEARLY'
  | 'CUSTOM';

export type BillStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export type SubscriptionCycle = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'WEEKLY';
export type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

export type DocumentCategory =
  | 'BILL'
  | 'RECEIPT'
  | 'RENTAL_AGREEMENT'
  | 'WARRANTY'
  | 'INSURANCE'
  | 'HOUSEHOLD_RECORD'
  | 'OTHER';

export type InventoryCategory =
  | 'ELECTRONICS'
  | 'APPLIANCES'
  | 'FURNITURE'
  | 'VEHICLES'
  | 'EQUIPMENT'
  | 'OTHER';

export type MaintenanceStatus = 'SCHEDULED' | 'COMPLETED' | 'SKIPPED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';

export type NotificationType =
  | 'BILL_DUE'
  | 'BILL_OVERDUE'
  | 'SUBSCRIPTION_RENEWAL'
  | 'DOCUMENT_EXPIRING'
  | 'WARRANTY_EXPIRING'
  | 'MAINTENANCE_DUE'
  | 'TASK_DEADLINE'
  | 'WORKSPACE_INVITATION'
  | 'GENERAL';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  emailVerified: boolean;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  type: WorkspaceType;
  currency: string;
  ownerId: string;
  role: MemberRole;
  joinedAt?: string;
  counts?: {
    members: number;
    bills: number;
    documents: number;
    inventoryItems: number;
    tasks: number;
  };
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: MemberRole;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  };
}

export interface Bill {
  id: string;
  workspaceId: string;
  name: string;
  description?: string | null;
  amount: number;
  currency: string;
  category: BillCategory;
  recurrence: BillRecurrence;
  customIntervalDays?: number | null;
  customIntervalMonths?: number | null;
  dueDate: string;
  status: BillStatus;
  assignedMemberId?: string | null;
  assignedMember?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
  } | null;
  reminderDaysBefore: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  occurrences?: any[];
  payments?: PaymentRecord[];
  documents?: DocumentItem[];
  _count?: { payments: number; occurrences: number; documents: number };
}

export interface PaymentRecord {
  id: string;
  workspaceId: string;
  billId?: string | null;
  amount: number;
  currency: string;
  paidAt: string;
  paymentMethod: string;
  actorId: string;
  actor?: { id: string; firstName: string; lastName: string; email?: string };
  bill?: { id: string; name: string; category: BillCategory };
  receiptUrl?: string | null;
  notes?: string | null;
  isManualRecord: boolean;
  createdAt: string;
}

export interface SubscriptionItem {
  id: string;
  workspaceId: string;
  name: string;
  provider: string;
  amount: number;
  currency: string;
  billingCycle: SubscriptionCycle;
  nextRenewalDate: string;
  category: string;
  status: SubscriptionStatus;
  notes?: string | null;
  cancellationUrl?: string | null;
  cancellationInstructions?: string | null;
  reminderDaysBefore: number;
  createdAt: string;
  updatedAt: string;
  events?: { id: string; eventType: string; eventDate: string; notes?: string }[];
}

export interface DocumentItem {
  id: string;
  workspaceId: string;
  title: string;
  description?: string | null;
  category: DocumentCategory;
  fileName: string;
  fileOriginalName: string;
  mimeType: string;
  fileSize: number;
  expirationDate?: string | null;
  linkedBillId?: string | null;
  linkedInventoryId?: string | null;
  linkedSubscriptionId?: string | null;
  uploadedById: string;
  uploadedBy?: { id: string; firstName: string; lastName: string };
  notes?: string | null;
  signedDownloadUrl?: string;
  tags?: { id: string; name: string }[];
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  workspaceId: string;
  name: string;
  description?: string | null;
  category: InventoryCategory;
  purchaseDate?: string | null;
  purchasePrice?: number | null;
  currency: string;
  warrantyExpiration?: string | null;
  serialNumber?: string | null;
  location?: string | null;
  ownerId?: string | null;
  owner?: { id: string; firstName: string; lastName: string } | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  maintenanceRecords?: MaintenanceRecord[];
  _count?: { documents: number; maintenanceRecords: number };
}

export interface MaintenanceRecord {
  id: string;
  inventoryItemId: string;
  inventoryItem?: { id: string; name: string };
  title: string;
  description?: string | null;
  scheduledDate: string;
  completedDate?: string | null;
  cost?: number | null;
  status: MaintenanceStatus;
  performer?: string | null;
  createdAt: string;
}

export interface TaskItem {
  id: string;
  workspaceId: string;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  deadline?: string | null;
  assignedMemberId?: string | null;
  assignedMember?: { id: string; firstName: string; lastName: string; avatarUrl?: string | null } | null;
  createdById: string;
  createdBy?: { id: string; firstName: string; lastName: string };
  isRecurring: boolean;
  recurrenceInterval?: string | null;
  completedAt?: string | null;
  createdAt: string;
  comments?: TaskComment[];
  _count?: { comments: number };
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  author: { id: string; firstName: string; lastName: string; avatarUrl?: string | null };
  content: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  workspaceId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
  read: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface DashboardAnalytics {
  monthlyExpenditure: number;
  monthlyPaymentCount: number;
  yearlyExpenditure: number;
  yearlyPaymentCount: number;
  upcomingPayments: { totalAmount: number; count: number };
  overduePayments: { totalAmount: number; count: number };
  subscriptions: { monthlyCost: number; annualCost: number; activeCount: number };
  categorySpending: { category: string; total: number }[];
  memberSpending: { memberId: string; memberName: string; total: number; paymentCount: number }[];
  billStatusOverview: { status: BillStatus; count: number; totalAmount: number }[];
  taskStats: { total: number; completed: number; pending: number; completionRatePercent: number };
  spendingTrends: { month: string; amount: number; paymentCount: number }[];
}

export interface ActivityLog {
  id: string;
  workspaceId: string;
  actorId?: string | null;
  actor?: { id: string; firstName: string; lastName: string; avatarUrl?: string | null } | null;
  action: string;
  entity: string;
  entityId: string;
  entityName?: string | null;
  metadata?: any;
  createdAt: string;
}
