import { prisma } from '../../config/db';
import { BillStatus, BillRecurrence, BillCategory } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { calculateNextDueDate } from '../../services/recurrenceEngine';
import { logActivity } from '../../services/activityLogger';

export interface BillFilterOptions {
  category?: BillCategory;
  status?: BillStatus;
  assignedMemberId?: string;
  search?: string;
  from?: Date;
  to?: Date;
}

export class BillService {
  async getBills(workspaceId: string, filters: BillFilterOptions) {
    const where: any = { workspaceId };

    if (filters.category) {
      where.category = filters.category;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.assignedMemberId) {
      where.assignedMemberId = filters.assignedMemberId;
    }
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } }
      ];
    }
    if (filters.from || filters.to) {
      where.dueDate = {};
      if (filters.from) where.dueDate.gte = filters.from;
      if (filters.to) where.dueDate.lte = filters.to;
    }

    return prisma.bill.findMany({
      where,
      include: {
        assignedMember: {
          select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true }
        },
        _count: {
          select: { payments: true, occurrences: true, documents: true }
        }
      },
      orderBy: { dueDate: 'asc' }
    });
  }

  async getBillById(workspaceId: string, billId: string) {
    const bill = await prisma.bill.findFirst({
      where: { id: billId, workspaceId },
      include: {
        assignedMember: {
          select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true }
        },
        occurrences: {
          orderBy: { dueDate: 'asc' }
        },
        payments: {
          include: {
            actor: {
              select: { id: true, firstName: true, lastName: true }
            }
          },
          orderBy: { paidAt: 'desc' }
        },
        documents: true
      }
    });

    if (!bill) {
      throw new NotFoundError('Bill not found in this workspace');
    }

    return bill;
  }

  async createBill(workspaceId: string, actorId: string, data: any) {
    const bill = await prisma.$transaction(async (tx) => {
      const created = await tx.bill.create({
        data: {
          workspaceId,
          name: data.name,
          description: data.description,
          amount: data.amount,
          currency: data.currency || 'USD',
          category: data.category || BillCategory.OTHER,
          recurrence: data.recurrence || BillRecurrence.ONE_TIME,
          customIntervalDays: data.customIntervalDays,
          customIntervalMonths: data.customIntervalMonths,
          dueDate: data.dueDate,
          assignedMemberId: data.assignedMemberId || null,
          reminderDaysBefore: data.reminderDaysBefore ?? 3,
          notes: data.notes
        }
      });

      // Create initial BillOccurrence
      await tx.billOccurrence.create({
        data: {
          billId: created.id,
          workspaceId,
          occurrenceNumber: 1,
          dueDate: data.dueDate,
          amount: data.amount,
          status: BillStatus.PENDING
        }
      });

      return created;
    });

    await logActivity({
      workspaceId,
      actorId,
      action: 'CREATE',
      entity: 'BILL',
      entityId: bill.id,
      entityName: bill.name,
      metadata: { amount: bill.amount, recurrence: bill.recurrence }
    });

    return bill;
  }

  async updateBill(workspaceId: string, billId: string, actorId: string, data: any) {
    const existing = await prisma.bill.findFirst({
      where: { id: billId, workspaceId }
    });

    if (!existing) {
      throw new NotFoundError('Bill not found in this workspace');
    }

    const updated = await prisma.bill.update({
      where: { id: billId },
      data
    });

    await logActivity({
      workspaceId,
      actorId,
      action: 'UPDATE',
      entity: 'BILL',
      entityId: billId,
      entityName: updated.name,
      metadata: data
    });

    return updated;
  }

  async deleteBill(workspaceId: string, billId: string, actorId: string) {
    const existing = await prisma.bill.findFirst({
      where: { id: billId, workspaceId }
    });

    if (!existing) {
      throw new NotFoundError('Bill not found in this workspace');
    }

    await prisma.bill.delete({
      where: { id: billId }
    });

    await logActivity({
      workspaceId,
      actorId,
      action: 'DELETE',
      entity: 'BILL',
      entityId: billId,
      entityName: existing.name
    });

    return true;
  }

  async markPaid(
    workspaceId: string,
    billId: string,
    actorId: string,
    data: { amount?: number; paymentMethod?: string; paidAt?: Date; notes?: string; receiptUrl?: string | null }
  ) {
    const bill = await prisma.bill.findFirst({
      where: { id: billId, workspaceId },
      include: {
        occurrences: {
          where: { status: { in: [BillStatus.PENDING, BillStatus.OVERDUE] } },
          orderBy: { dueDate: 'asc' },
          take: 1
        }
      }
    });

    if (!bill) {
      throw new NotFoundError('Bill not found in this workspace');
    }

    const currentOccurrence = bill.occurrences[0];
    const paymentAmount = data.amount ?? (currentOccurrence ? currentOccurrence.amount : bill.amount);
    const paymentDate = data.paidAt ?? new Date();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Record immutable payment
      const payment = await tx.paymentRecord.create({
        data: {
          workspaceId,
          billId: bill.id,
          billOccurrenceId: currentOccurrence ? currentOccurrence.id : null,
          amount: paymentAmount,
          currency: bill.currency,
          paidAt: paymentDate,
          paymentMethod: data.paymentMethod || 'CARD',
          actorId,
          receiptUrl: data.receiptUrl || null,
          notes: data.notes || null,
          isManualRecord: true
        }
      });

      // 2. Mark current occurrence as PAID if exists
      if (currentOccurrence) {
        await tx.billOccurrence.update({
          where: { id: currentOccurrence.id },
          data: {
            status: BillStatus.PAID,
            paidAt: paymentDate
          }
        });
      }

      // 3. If recurring, compute next due date and advance bill / create next occurrence
      if (bill.recurrence !== BillRecurrence.ONE_TIME && bill.autoGenerateNext) {
        const nextDueDate = calculateNextDueDate(bill.dueDate, bill.recurrence, {
          customIntervalDays: bill.customIntervalDays,
          customIntervalMonths: bill.customIntervalMonths
        });

        // Advance bill's next due date and reset status to PENDING
        await tx.bill.update({
          where: { id: bill.id },
          data: {
            dueDate: nextDueDate,
            status: BillStatus.PENDING
          }
        });

        // Count existing occurrences to set occurrenceNumber
        const count = await tx.billOccurrence.count({ where: { billId: bill.id } });

        // Upsert next occurrence to guarantee no duplicates
        await tx.billOccurrence.upsert({
          where: {
            billId_dueDate: {
              billId: bill.id,
              dueDate: nextDueDate
            }
          },
          create: {
            billId: bill.id,
            workspaceId,
            occurrenceNumber: count + 1,
            dueDate: nextDueDate,
            amount: bill.amount,
            status: BillStatus.PENDING
          },
          update: {}
        });
      } else {
        // One-time bill marked as paid
        await tx.bill.update({
          where: { id: bill.id },
          data: { status: BillStatus.PAID }
        });
      }

      return payment;
    });

    await logActivity({
      workspaceId,
      actorId,
      action: 'PAY',
      entity: 'BILL',
      entityId: bill.id,
      entityName: bill.name,
      metadata: {
        paymentId: result.id,
        amount: paymentAmount,
        currency: bill.currency,
        isRecurring: bill.recurrence !== BillRecurrence.ONE_TIME
      }
    });

    return result;
  }

  async getPayments(workspaceId: string, billId?: string) {
    const where: any = { workspaceId };
    if (billId) {
      where.billId = billId;
    }

    return prisma.paymentRecord.findMany({
      where,
      include: {
        bill: {
          select: { id: true, name: true, category: true }
        },
        actor: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      },
      orderBy: { paidAt: 'desc' }
    });
  }
}

export const billService = new BillService();
