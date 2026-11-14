import { prisma } from '../../config/db';
import { SubscriptionStatus, SubscriptionCycle } from '@prisma/client';
import { NotFoundError } from '../../utils/errors';
import { logActivity } from '../../services/activityLogger';

export interface SubscriptionFilters {
  status?: SubscriptionStatus;
  category?: string;
  search?: string;
}

export class SubscriptionService {
  async getSubscriptions(workspaceId: string, filters: SubscriptionFilters) {
    const where: any = { workspaceId };
    if (filters.status) where.status = filters.status;
    if (filters.category) where.category = filters.category;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { provider: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    return prisma.subscription.findMany({
      where,
      include: {
        events: { orderBy: { eventDate: 'desc' }, take: 5 }
      },
      orderBy: { nextRenewalDate: 'asc' }
    });
  }

  async getSubscriptionById(workspaceId: string, id: string) {
    const sub = await prisma.subscription.findFirst({
      where: { id, workspaceId },
      include: {
        events: { orderBy: { eventDate: 'desc' } },
        documents: true
      }
    });

    if (!sub) {
      throw new NotFoundError('Subscription not found in this workspace');
    }

    return sub;
  }

  async createSubscription(workspaceId: string, actorId: string, data: any) {
    const sub = await prisma.$transaction(async (tx) => {
      const created = await tx.subscription.create({
        data: {
          workspaceId,
          name: data.name,
          provider: data.provider,
          amount: data.amount,
          currency: data.currency || 'USD',
          billingCycle: data.billingCycle || SubscriptionCycle.MONTHLY,
          nextRenewalDate: data.nextRenewalDate,
          category: data.category || 'General',
          status: data.status || SubscriptionStatus.ACTIVE,
          notes: data.notes,
          cancellationUrl: data.cancellationUrl || null,
          cancellationInstructions: data.cancellationInstructions || null,
          reminderDaysBefore: data.reminderDaysBefore ?? 3
        }
      });

      await tx.subscriptionEvent.create({
        data: {
          subscriptionId: created.id,
          eventType: 'CREATED',
          notes: `Subscription created with initial amount of ${created.currency} ${created.amount}`
        }
      });

      return created;
    });

    await logActivity({
      workspaceId,
      actorId,
      action: 'CREATE',
      entity: 'SUBSCRIPTION',
      entityId: sub.id,
      entityName: sub.name,
      metadata: { amount: sub.amount, cycle: sub.billingCycle }
    });

    return sub;
  }

  async updateSubscription(workspaceId: string, id: string, actorId: string, data: any) {
    const existing = await prisma.subscription.findFirst({
      where: { id, workspaceId }
    });

    if (!existing) {
      throw new NotFoundError('Subscription not found in this workspace');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.subscription.update({
        where: { id },
        data
      });

      // Record price change event
      if (data.amount !== undefined && data.amount !== existing.amount) {
        await tx.subscriptionEvent.create({
          data: {
            subscriptionId: id,
            eventType: 'PRICE_CHANGED',
            previousAmount: existing.amount,
            newAmount: data.amount,
            notes: `Price updated from ${existing.amount} to ${data.amount}`
          }
        });
      }

      // Record status change event
      if (data.status !== undefined && data.status !== existing.status) {
        await tx.subscriptionEvent.create({
          data: {
            subscriptionId: id,
            eventType: `STATUS_${data.status}`,
            notes: `Status changed from ${existing.status} to ${data.status}`
          }
        });
      }

      return res;
    });

    await logActivity({
      workspaceId,
      actorId,
      action: 'UPDATE',
      entity: 'SUBSCRIPTION',
      entityId: id,
      entityName: updated.name,
      metadata: data
    });

    return updated;
  }

  async deleteSubscription(workspaceId: string, id: string, actorId: string) {
    const existing = await prisma.subscription.findFirst({
      where: { id, workspaceId }
    });

    if (!existing) {
      throw new NotFoundError('Subscription not found in this workspace');
    }

    await prisma.subscription.delete({
      where: { id }
    });

    await logActivity({
      workspaceId,
      actorId,
      action: 'DELETE',
      entity: 'SUBSCRIPTION',
      entityId: id,
      entityName: existing.name
    });

    return true;
  }

  async getExpenditureSummary(workspaceId: string) {
    const subscriptions = await prisma.subscription.findMany({
      where: { workspaceId }
    });

    let monthlyExpenditure = 0;
    let annualExpenditure = 0;
    const categoryTotals: Record<string, { monthly: number; count: number }> = {};
    let activeCount = 0;
    let pausedCount = 0;
    let cancelledCount = 0;

    for (const sub of subscriptions) {
      if (sub.status === SubscriptionStatus.CANCELLED) {
        cancelledCount++;
        continue;
      }
      if (sub.status === SubscriptionStatus.PAUSED) {
        pausedCount++;
        continue;
      }

      activeCount++;

      // Normalized calculations
      let monthlyCost = 0;
      let annualCost = 0;

      switch (sub.billingCycle) {
        case SubscriptionCycle.MONTHLY:
          monthlyCost = sub.amount;
          annualCost = sub.amount * 12;
          break;
        case SubscriptionCycle.ANNUAL:
          monthlyCost = sub.amount / 12;
          annualCost = sub.amount;
          break;
        case SubscriptionCycle.QUARTERLY:
          monthlyCost = sub.amount / 3;
          annualCost = sub.amount * 4;
          break;
        case SubscriptionCycle.WEEKLY:
          monthlyCost = (sub.amount * 52) / 12;
          annualCost = sub.amount * 52;
          break;
      }

      monthlyExpenditure += monthlyCost;
      annualExpenditure += annualCost;

      const cat = sub.category || 'Other';
      if (!categoryTotals[cat]) {
        categoryTotals[cat] = { monthly: 0, count: 0 };
      }
      categoryTotals[cat].monthly += monthlyCost;
      categoryTotals[cat].count += 1;
    }

    const categoryBreakdown = Object.entries(categoryTotals).map(([category, stats]) => ({
      category,
      monthlyExpenditure: Math.round(stats.monthly * 100) / 100,
      count: stats.count
    }));

    return {
      monthlyExpenditure: Math.round(monthlyExpenditure * 100) / 100,
      annualExpenditure: Math.round(annualExpenditure * 100) / 100,
      activeCount,
      pausedCount,
      cancelledCount,
      categoryBreakdown
    };
  }
}

export const subscriptionService = new SubscriptionService();
