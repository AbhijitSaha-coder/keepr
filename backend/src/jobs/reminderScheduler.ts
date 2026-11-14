import { prisma } from '../config/db';
import { logger } from '../utils/logger';
import { notificationQueue } from './notificationQueue';
import { NotificationType, BillStatus, SubscriptionStatus, TaskStatus, MaintenanceStatus } from '@prisma/client';
import { format, addDays, isBefore, startOfDay, endOfDay } from 'date-fns';

export async function runReminderCheck(): Promise<{ checked: number; enqueued: number }> {
  const today = new Date();
  const dateStr = format(today, 'yyyy-MM-dd');
  let enqueued = 0;
  let checked = 0;

  try {
    // 1. BILL REMINDERS (Upcoming & Overdue)
    const activeBills = await prisma.bill.findMany({
      where: {
        status: { in: [BillStatus.PENDING, BillStatus.OVERDUE] }
      },
      include: {
        workspace: {
          include: {
            members: { include: { user: { include: { notificationPreference: true } } } }
          }
        }
      }
    });

    checked += activeBills.length;

    for (const bill of activeBills) {
      const isOverdue = isBefore(bill.dueDate, startOfDay(today)) && bill.status !== BillStatus.PAID;

      // Update overdue status if needed
      if (isOverdue && bill.status === BillStatus.PENDING) {
        await prisma.bill.update({
          where: { id: bill.id },
          data: { status: BillStatus.OVERDUE }
        });
      }

      for (const member of bill.workspace.members) {
        const prefDays = member.user.notificationPreference?.billDueDays ?? bill.reminderDaysBefore ?? 3;
        const reminderThreshold = addDays(today, prefDays);

        if (isOverdue) {
          const deduplicationKey = `bill-overdue:${bill.id}:${member.userId}:${dateStr}`;
          await notificationQueue.add(
            `bill-overdue-${bill.id}`,
            {
              userId: member.userId,
              workspaceId: bill.workspaceId,
              type: NotificationType.BILL_OVERDUE,
              title: `Overdue Bill: ${bill.name}`,
              message: `The bill "${bill.name}" of ${bill.currency} ${bill.amount.toFixed(2)} was due on ${format(bill.dueDate, 'MMM dd, yyyy')}.`,
              entityType: 'BILL',
              entityId: bill.id,
              deduplicationKey
            },
            { jobId: deduplicationKey }
          );
          enqueued++;
        } else if (isBefore(bill.dueDate, reminderThreshold) && !isBefore(bill.dueDate, today)) {
          const deduplicationKey = `bill-due:${bill.id}:${member.userId}:${format(bill.dueDate, 'yyyy-MM-dd')}`;
          await notificationQueue.add(
            `bill-due-${bill.id}`,
            {
              userId: member.userId,
              workspaceId: bill.workspaceId,
              type: NotificationType.BILL_DUE,
              title: `Upcoming Bill Due: ${bill.name}`,
              message: `Reminder: "${bill.name}" of ${bill.currency} ${bill.amount.toFixed(2)} is due on ${format(bill.dueDate, 'MMM dd, yyyy')}.`,
              entityType: 'BILL',
              entityId: bill.id,
              deduplicationKey
            },
            { jobId: deduplicationKey }
          );
          enqueued++;
        }
      }
    }

    // 2. SUBSCRIPTION RENEWALS
    const activeSubs = await prisma.subscription.findMany({
      where: { status: SubscriptionStatus.ACTIVE },
      include: {
        workspace: {
          include: {
            members: { include: { user: { include: { notificationPreference: true } } } }
          }
        }
      }
    });

    checked += activeSubs.length;

    for (const sub of activeSubs) {
      for (const member of sub.workspace.members) {
        const prefDays = member.user.notificationPreference?.subscriptionRenewalDays ?? sub.reminderDaysBefore ?? 3;
        const reminderThreshold = addDays(today, prefDays);

        if (isBefore(sub.nextRenewalDate, reminderThreshold) && !isBefore(sub.nextRenewalDate, today)) {
          const deduplicationKey = `sub-renewal:${sub.id}:${member.userId}:${format(sub.nextRenewalDate, 'yyyy-MM-dd')}`;
          await notificationQueue.add(
            `sub-renewal-${sub.id}`,
            {
              userId: member.userId,
              workspaceId: sub.workspaceId,
              type: NotificationType.SUBSCRIPTION_RENEWAL,
              title: `Subscription Renewal: ${sub.name}`,
              message: `Your subscription to ${sub.provider || sub.name} (${sub.currency} ${sub.amount.toFixed(2)}) renews on ${format(sub.nextRenewalDate, 'MMM dd, yyyy')}.`,
              entityType: 'SUBSCRIPTION',
              entityId: sub.id,
              deduplicationKey
            },
            { jobId: deduplicationKey }
          );
          enqueued++;
        }
      }
    }

    // 3. EXPIRING DOCUMENTS
    const expiringDocs = await prisma.document.findMany({
      where: {
        expirationDate: {
          gte: today,
          lte: addDays(today, 30)
        }
      },
      include: {
        workspace: {
          include: {
            members: { include: { user: { include: { notificationPreference: true } } } }
          }
        }
      }
    });

    checked += expiringDocs.length;

    for (const doc of expiringDocs) {
      if (!doc.expirationDate) continue;
      for (const member of doc.workspace.members) {
        const prefDays = member.user.notificationPreference?.documentExpiringDays ?? 14;
        if (isBefore(doc.expirationDate, addDays(today, prefDays))) {
          const deduplicationKey = `doc-exp:${doc.id}:${member.userId}:${format(doc.expirationDate, 'yyyy-MM-dd')}`;
          await notificationQueue.add(
            `doc-exp-${doc.id}`,
            {
              userId: member.userId,
              workspaceId: doc.workspaceId,
              type: NotificationType.DOCUMENT_EXPIRING,
              title: `Document Expiring Soon: ${doc.title}`,
              message: `Your document "${doc.title}" expires on ${format(doc.expirationDate, 'MMM dd, yyyy')}.`,
              entityType: 'DOCUMENT',
              entityId: doc.id,
              deduplicationKey
            },
            { jobId: deduplicationKey }
          );
          enqueued++;
        }
      }
    }

    // 4. EXPIRING WARRANTIES
    const expiringWarranties = await prisma.inventoryItem.findMany({
      where: {
        warrantyExpiration: {
          gte: today,
          lte: addDays(today, 30)
        }
      },
      include: {
        workspace: {
          include: {
            members: { include: { user: { include: { notificationPreference: true } } } }
          }
        }
      }
    });

    checked += expiringWarranties.length;

    for (const item of expiringWarranties) {
      if (!item.warrantyExpiration) continue;
      for (const member of item.workspace.members) {
        const prefDays = member.user.notificationPreference?.warrantyExpiringDays ?? 14;
        if (isBefore(item.warrantyExpiration, addDays(today, prefDays))) {
          const deduplicationKey = `warranty-exp:${item.id}:${member.userId}:${format(item.warrantyExpiration, 'yyyy-MM-dd')}`;
          await notificationQueue.add(
            `warranty-exp-${item.id}`,
            {
              userId: member.userId,
              workspaceId: item.workspaceId,
              type: NotificationType.WARRANTY_EXPIRING,
              title: `Warranty Expiring: ${item.name}`,
              message: `The warranty for ${item.name} expires on ${format(item.warrantyExpiration, 'MMM dd, yyyy')}.`,
              entityType: 'INVENTORY',
              entityId: item.id,
              deduplicationKey
            },
            { jobId: deduplicationKey }
          );
          enqueued++;
        }
      }
    }

    // 5. MAINTENANCE RECORDS DUE
    const dueMaintenance = await prisma.maintenanceRecord.findMany({
      where: {
        status: MaintenanceStatus.SCHEDULED,
        scheduledDate: {
          gte: today,
          lte: addDays(today, 7)
        }
      },
      include: {
        inventoryItem: true,
        workspace: {
          include: {
            members: { include: { user: { include: { notificationPreference: true } } } }
          }
        }
      }
    });

    checked += dueMaintenance.length;

    for (const maint of dueMaintenance) {
      for (const member of maint.workspace.members) {
        const prefDays = member.user.notificationPreference?.maintenanceDueDays ?? 3;
        if (isBefore(maint.scheduledDate, addDays(today, prefDays))) {
          const deduplicationKey = `maint-due:${maint.id}:${member.userId}:${format(maint.scheduledDate, 'yyyy-MM-dd')}`;
          await notificationQueue.add(
            `maint-due-${maint.id}`,
            {
              userId: member.userId,
              workspaceId: maint.workspaceId,
              type: NotificationType.MAINTENANCE_DUE,
              title: `Scheduled Maintenance: ${maint.title}`,
              message: `Maintenance for ${maint.inventoryItem.name} ("${maint.title}") is scheduled for ${format(maint.scheduledDate, 'MMM dd, yyyy')}.`,
              entityType: 'INVENTORY',
              entityId: maint.inventoryItemId,
              deduplicationKey
            },
            { jobId: deduplicationKey }
          );
          enqueued++;
        }
      }
    }

    // 6. TASK DEADLINES
    const upcomingTasks = await prisma.task.findMany({
      where: {
        status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
        deadline: {
          gte: today,
          lte: addDays(today, 2)
        }
      },
      include: {
        workspace: {
          include: {
            members: { include: { user: { include: { notificationPreference: true } } } }
          }
        }
      }
    });

    checked += upcomingTasks.length;

    for (const task of upcomingTasks) {
      if (!task.deadline) continue;
      // If task is assigned to a specific member, notify that member; otherwise notify all workspace members
      const targetMembers = task.assignedMemberId
        ? task.workspace.members.filter(m => m.userId === task.assignedMemberId)
        : task.workspace.members;

      for (const member of targetMembers) {
        const deduplicationKey = `task-deadline:${task.id}:${member.userId}:${format(task.deadline, 'yyyy-MM-dd')}`;
        await notificationQueue.add(
          `task-deadline-${task.id}`,
          {
            userId: member.userId,
            workspaceId: task.workspaceId,
            type: NotificationType.TASK_DEADLINE,
            title: `Task Deadline: ${task.title}`,
            message: `Task "${task.title}" is due on ${format(task.deadline, 'MMM dd, yyyy')}.`,
            entityType: 'TASK',
            entityId: task.id,
            deduplicationKey
          },
          { jobId: deduplicationKey }
        );
        enqueued++;
      }
    }

    logger.info(`Reminder check completed: checked ${checked} items, enqueued ${enqueued} notification jobs`);
    return { checked, enqueued };
  } catch (error) {
    logger.error('Error executing reminder check:', error);
    return { checked, enqueued };
  }
}
