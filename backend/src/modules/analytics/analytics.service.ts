import { prisma } from '../../config/db';
import { BillStatus, SubscriptionStatus, TaskStatus } from '@prisma/client';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, format } from 'date-fns';

export class AnalyticsService {
  async getDashboardAnalytics(workspaceId: string) {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);

    // 1. Current Monthly Expenditure from Payment Records
    const monthlyPayments = await prisma.paymentRecord.aggregate({
      where: {
        workspaceId,
        paidAt: { gte: monthStart, lte: monthEnd }
      },
      _sum: { amount: true },
      _count: true
    });

    // 2. Yearly Expenditure from Payment Records
    const yearlyPayments = await prisma.paymentRecord.aggregate({
      where: {
        workspaceId,
        paidAt: { gte: yearStart, lte: yearEnd }
      },
      _sum: { amount: true },
      _count: true
    });

    // 3. Upcoming Bills (pending, due in next 30 days)
    const upcomingBills = await prisma.bill.aggregate({
      where: {
        workspaceId,
        status: { in: [BillStatus.PENDING] },
        dueDate: { gte: now }
      },
      _sum: { amount: true },
      _count: true
    });

    // 4. Overdue Bills (pending or overdue with dueDate < now)
    const overdueBills = await prisma.bill.aggregate({
      where: {
        workspaceId,
        status: { in: [BillStatus.PENDING, BillStatus.OVERDUE] },
        dueDate: { lt: now }
      },
      _sum: { amount: true },
      _count: true
    });

    // 5. Active Subscriptions Cost Run-rate
    const activeSubs = await prisma.subscription.findMany({
      where: { workspaceId, status: SubscriptionStatus.ACTIVE }
    });

    let monthlySubCost = 0;
    let annualSubCost = 0;
    for (const sub of activeSubs) {
      if (sub.billingCycle === 'MONTHLY') {
        monthlySubCost += sub.amount;
        annualSubCost += sub.amount * 12;
      } else if (sub.billingCycle === 'ANNUAL') {
        monthlySubCost += sub.amount / 12;
        annualSubCost += sub.amount;
      } else if (sub.billingCycle === 'QUARTERLY') {
        monthlySubCost += sub.amount / 3;
        annualSubCost += sub.amount * 4;
      } else if (sub.billingCycle === 'WEEKLY') {
        monthlySubCost += (sub.amount * 52) / 12;
        annualSubCost += sub.amount * 52;
      }
    }

    // 6. Category-wise Spending from real payments (with bill joined)
    const paymentsWithCategory = await prisma.paymentRecord.findMany({
      where: { workspaceId },
      include: {
        bill: { select: { category: true } }
      }
    });

    const categoryMap: Record<string, number> = {};
    for (const p of paymentsWithCategory) {
      const cat = p.bill?.category || 'OTHER';
      categoryMap[cat] = (categoryMap[cat] || 0) + p.amount;
    }

    const categorySpending = Object.entries(categoryMap).map(([category, total]) => ({
      category,
      total: Math.round(total * 100) / 100
    }));

    // 7. Household Expense Distribution by Actor/Member
    const memberPayments = await prisma.paymentRecord.groupBy({
      by: ['actorId'],
      where: { workspaceId },
      _sum: { amount: true },
      _count: true
    });

    const actorIds = memberPayments.map((m) => m.actorId);
    const users = await prisma.user.findMany({
      where: { id: { in: actorIds } },
      select: { id: true, firstName: true, lastName: true }
    });
    const userMap = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`]));

    const memberSpending = memberPayments.map((m) => ({
      memberId: m.actorId,
      memberName: userMap.get(m.actorId) || 'Unknown',
      total: Math.round((m._sum.amount || 0) * 100) / 100,
      paymentCount: m._count
    }));

    // 8. Paid vs Unpaid Bills
    const billStatusCounts = await prisma.bill.groupBy({
      by: ['status'],
      where: { workspaceId },
      _sum: { amount: true },
      _count: true
    });

    const billStatusOverview = billStatusCounts.map((b) => ({
      status: b.status,
      count: b._count,
      totalAmount: Math.round((b._sum.amount || 0) * 100) / 100
    }));

    // 9. Task Completion Rate
    const [totalTasks, completedTasks] = await Promise.all([
      prisma.task.count({ where: { workspaceId } }),
      prisma.task.count({ where: { workspaceId, status: TaskStatus.COMPLETED } })
    ]);

    const taskStats = {
      total: totalTasks,
      completed: completedTasks,
      pending: totalTasks - completedTasks,
      completionRatePercent: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };

    // 10. Spending Trends (Last 6 Months Real Payment Totals)
    const trends: { month: string; amount: number; paymentCount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const targetDate = subMonths(now, i);
      const mStart = startOfMonth(targetDate);
      const mEnd = endOfMonth(targetDate);
      const label = format(targetDate, 'MMM yyyy');

      const agg = await prisma.paymentRecord.aggregate({
        where: {
          workspaceId,
          paidAt: { gte: mStart, lte: mEnd }
        },
        _sum: { amount: true },
        _count: true
      });

      trends.push({
        month: label,
        amount: Math.round((agg._sum.amount || 0) * 100) / 100,
        paymentCount: agg._count
      });
    }

    return {
      monthlyExpenditure: Math.round((monthlyPayments._sum.amount || 0) * 100) / 100,
      monthlyPaymentCount: monthlyPayments._count,
      yearlyExpenditure: Math.round((yearlyPayments._sum.amount || 0) * 100) / 100,
      yearlyPaymentCount: yearlyPayments._count,
      upcomingPayments: {
        totalAmount: Math.round((upcomingBills._sum.amount || 0) * 100) / 100,
        count: upcomingBills._count
      },
      overduePayments: {
        totalAmount: Math.round((overdueBills._sum.amount || 0) * 100) / 100,
        count: overdueBills._count
      },
      subscriptions: {
        monthlyCost: Math.round(monthlySubCost * 100) / 100,
        annualCost: Math.round(annualSubCost * 100) / 100,
        activeCount: activeSubs.length
      },
      categorySpending,
      memberSpending,
      billStatusOverview,
      taskStats,
      spendingTrends: trends
    };
  }
}

export const analyticsService = new AnalyticsService();
