import { prisma } from './db';
import {
  WorkspaceType,
  MemberRole,
  BillCategory,
  BillRecurrence,
  BillStatus,
  SubscriptionStatus,
  SubscriptionCycle,
  InventoryCategory,
  TaskPriority,
  TaskStatus,
  NotificationType
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import { addDays, subMonths, addMonths } from 'date-fns';
import { logger } from '../utils/logger';

export async function checkAndAutoSeed(): Promise<void> {
  try {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return;
    }

    logger.info('🌱 Empty database detected on startup. Seeding demo account and household data...');

    const passwordHash = await bcrypt.hash('Password123!', 10);

    // 1. Create Users
    const alex = await prisma.user.create({
      data: {
        email: 'demo@keepr.app',
        passwordHash,
        firstName: 'Alex',
        lastName: 'Rivera',
        emailVerified: true
      }
    });

    const sarah = await prisma.user.create({
      data: {
        email: 'sarah@keepr.app',
        passwordHash,
        firstName: 'Sarah',
        lastName: 'Rivera',
        emailVerified: true
      }
    });

    const marcus = await prisma.user.create({
      data: {
        email: 'marcus@keepr.app',
        passwordHash,
        firstName: 'Marcus',
        lastName: 'Rivera',
        emailVerified: true
      }
    });

    // 2. Notification Preferences
    for (const u of [alex, sarah, marcus]) {
      await prisma.notificationPreference.create({
        data: {
          userId: u.id,
          emailEnabled: true,
          inAppEnabled: true,
          billDueDays: 3,
          subscriptionRenewalDays: 3,
          warrantyExpiringDays: 14
        }
      });
    }

    // 3. Workspaces
    const household = await prisma.workspace.create({
      data: {
        name: 'Rivera Household',
        slug: 'rivera-household',
        type: WorkspaceType.HOUSEHOLD,
        currency: 'USD',
        ownerId: alex.id
      }
    });

    const personalAlex = await prisma.workspace.create({
      data: {
        name: "Alex's Personal Space",
        slug: 'alex-personal',
        type: WorkspaceType.PERSONAL,
        currency: 'USD',
        ownerId: alex.id
      }
    });

    // Memberships
    await prisma.workspaceMember.createMany({
      data: [
        { workspaceId: household.id, userId: alex.id, role: MemberRole.OWNER },
        { workspaceId: household.id, userId: sarah.id, role: MemberRole.ADMIN },
        { workspaceId: household.id, userId: marcus.id, role: MemberRole.MEMBER },
        { workspaceId: personalAlex.id, userId: alex.id, role: MemberRole.OWNER }
      ]
    });

    // 4. Bills
    const now = new Date();
    const nextRentDate = addDays(now, 5);
    const nextPowerDate = addDays(now, 12);
    const nextInternetDate = addDays(now, 18);
    const overdueWaterDate = addDays(now, -4);

    const rentBill = await prisma.bill.create({
      data: {
        workspaceId: household.id,
        name: 'Apartment Rent',
        description: 'Monthly rent for #4B Elm Street',
        amount: 2400.0,
        currency: 'USD',
        category: BillCategory.RENT,
        recurrence: BillRecurrence.MONTHLY,
        dueDate: nextRentDate,
        status: BillStatus.PENDING,
        assignedMemberId: alex.id,
        reminderDaysBefore: 5,
        notes: 'Pay via tenant portal before the 5th'
      }
    });

    const electricityBill = await prisma.bill.create({
      data: {
        workspaceId: household.id,
        name: 'City Electric Utility',
        description: 'Electricity & grid connection',
        amount: 142.5,
        currency: 'USD',
        category: BillCategory.ELECTRICITY,
        recurrence: BillRecurrence.MONTHLY,
        dueDate: nextPowerDate,
        status: BillStatus.PENDING,
        assignedMemberId: sarah.id,
        reminderDaysBefore: 3
      }
    });

    const internetBill = await prisma.bill.create({
      data: {
        workspaceId: household.id,
        name: 'Gigabit Fiber Internet',
        description: '1000 Mbps symmetrical fiber broadband',
        amount: 79.99,
        currency: 'USD',
        category: BillCategory.INTERNET,
        recurrence: BillRecurrence.MONTHLY,
        dueDate: nextInternetDate,
        status: BillStatus.PENDING,
        assignedMemberId: alex.id,
        reminderDaysBefore: 3
      }
    });

    const waterBill = await prisma.bill.create({
      data: {
        workspaceId: household.id,
        name: 'Municipal Water & Sewage',
        description: 'Bi-monthly water consumption',
        amount: 68.2,
        currency: 'USD',
        category: BillCategory.WATER,
        recurrence: BillRecurrence.MONTHLY,
        dueDate: overdueWaterDate,
        status: BillStatus.OVERDUE,
        assignedMemberId: marcus.id,
        reminderDaysBefore: 3
      }
    });

    // Bill Occurrences
    for (const bill of [rentBill, electricityBill, internetBill, waterBill]) {
      await prisma.billOccurrence.create({
        data: {
          billId: bill.id,
          workspaceId: household.id,
          occurrenceNumber: 1,
          dueDate: bill.dueDate,
          amount: bill.amount,
          status: bill.status
        }
      });
    }

    // 5. Past Payment Records
    const lastMonth = subMonths(now, 1);
    const twoMonthsAgo = subMonths(now, 2);

    await prisma.paymentRecord.createMany({
      data: [
        {
          workspaceId: household.id,
          billId: rentBill.id,
          amount: 2400.0,
          currency: 'USD',
          paidAt: lastMonth,
          paymentMethod: 'BANK_TRANSFER',
          actorId: alex.id,
          notes: 'Rent paid via ACH transfer',
          isManualRecord: true
        },
        {
          workspaceId: household.id,
          billId: electricityBill.id,
          amount: 138.2,
          currency: 'USD',
          paidAt: lastMonth,
          paymentMethod: 'CARD',
          actorId: sarah.id,
          notes: 'Electric bill auto-charged to credit card',
          isManualRecord: true
        },
        {
          workspaceId: household.id,
          billId: internetBill.id,
          amount: 79.99,
          currency: 'USD',
          paidAt: lastMonth,
          paymentMethod: 'CARD',
          actorId: alex.id,
          isManualRecord: true
        },
        {
          workspaceId: household.id,
          billId: rentBill.id,
          amount: 2400.0,
          currency: 'USD',
          paidAt: twoMonthsAgo,
          paymentMethod: 'BANK_TRANSFER',
          actorId: alex.id,
          isManualRecord: true
        },
        {
          workspaceId: household.id,
          billId: electricityBill.id,
          amount: 151.0,
          currency: 'USD',
          paidAt: twoMonthsAgo,
          paymentMethod: 'CARD',
          actorId: sarah.id,
          isManualRecord: true
        }
      ]
    });

    // 6. Subscriptions
    await prisma.subscription.createMany({
      data: [
        {
          workspaceId: household.id,
          name: 'Netflix Premium 4K',
          provider: 'Netflix',
          amount: 22.99,
          currency: 'USD',
          billingCycle: SubscriptionCycle.MONTHLY,
          nextRenewalDate: addDays(now, 8),
          category: 'Streaming & Video',
          status: SubscriptionStatus.ACTIVE,
          cancellationUrl: 'https://www.netflix.com/youraccount'
        },
        {
          workspaceId: household.id,
          name: 'Spotify Premium Family',
          provider: 'Spotify',
          amount: 19.99,
          currency: 'USD',
          billingCycle: SubscriptionCycle.MONTHLY,
          nextRenewalDate: addDays(now, 14),
          category: 'Music & Audio',
          status: SubscriptionStatus.ACTIVE,
          cancellationUrl: 'https://www.spotify.com/account/subscription'
        },
        {
          workspaceId: household.id,
          name: 'Amazon Prime Annual',
          provider: 'Amazon',
          amount: 139.0,
          currency: 'USD',
          billingCycle: SubscriptionCycle.ANNUAL,
          nextRenewalDate: addMonths(now, 7),
          category: 'Shopping & Delivery',
          status: SubscriptionStatus.ACTIVE
        },
        {
          workspaceId: household.id,
          name: 'Google One 2TB Cloud Storage',
          provider: 'Google',
          amount: 9.99,
          currency: 'USD',
          billingCycle: SubscriptionCycle.MONTHLY,
          nextRenewalDate: addDays(now, 2),
          category: 'Cloud & Tech',
          status: SubscriptionStatus.ACTIVE
        }
      ]
    });

    // 7. Inventory Items & Maintenance
    const tv = await prisma.inventoryItem.create({
      data: {
        workspaceId: household.id,
        name: 'LG 65" C3 OLED 4K Smart TV',
        description: 'Living room primary television display',
        category: InventoryCategory.ELECTRONICS,
        purchaseDate: subMonths(now, 10),
        purchasePrice: 1799.99,
        currency: 'USD',
        warrantyExpiration: addMonths(now, 14),
        serialNumber: 'LG-OLED65C3-89211029',
        location: 'Living Room',
        ownerId: alex.id,
        notes: 'Registered with LG Care with receipt in document vault'
      }
    });

    const dishwasher = await prisma.inventoryItem.create({
      data: {
        workspaceId: household.id,
        name: 'Bosch 800 Series Dishwasher',
        description: 'Built-in ultra-quiet dishwasher',
        category: InventoryCategory.APPLIANCES,
        purchaseDate: subMonths(now, 18),
        purchasePrice: 1149.0,
        currency: 'USD',
        warrantyExpiration: addDays(now, 20),
        serialNumber: 'BSH-SHP78CM5N-44910',
        location: 'Kitchen',
        ownerId: sarah.id,
        notes: 'Filter requires manual cleaning every 60 days'
      }
    });

    const car = await prisma.inventoryItem.create({
      data: {
        workspaceId: household.id,
        name: '2023 Subaru Outback Touring',
        description: 'Family primary all-wheel drive SUV',
        category: InventoryCategory.VEHICLES,
        purchaseDate: subMonths(now, 22),
        purchasePrice: 38500.0,
        currency: 'USD',
        warrantyExpiration: addMonths(now, 14),
        serialNumber: 'VIN-4S4BTANC7P339180',
        location: 'Garage',
        ownerId: alex.id
      }
    });

    // Maintenance Records
    await prisma.maintenanceRecord.createMany({
      data: [
        {
          inventoryItemId: dishwasher.id,
          workspaceId: household.id,
          title: 'Deep Descaling & Spray Arm Check',
          description: 'Run machine with citric acid descaling tablet and clean nozzle jets',
          scheduledDate: addDays(now, 6),
          cost: 15.0,
          status: 'SCHEDULED'
        },
        {
          inventoryItemId: car.id,
          workspaceId: household.id,
          title: '30,000 Mile Service & Tire Rotation',
          description: 'Oil change, cabin filter replacement, brake inspection',
          scheduledDate: addDays(now, 15),
          cost: 280.0,
          performer: 'Subaru Service Center',
          status: 'SCHEDULED'
        }
      ]
    });

    // 8. Tasks
    const task1 = await prisma.task.create({
      data: {
        workspaceId: household.id,
        title: 'Replace furnace air filter (MERV 11)',
        description: 'Check 20x25x4 filter in basement utility closet and swap if dirty',
        priority: TaskPriority.HIGH,
        status: TaskStatus.TODO,
        deadline: addDays(now, 3),
        assignedMemberId: marcus.id,
        createdById: alex.id,
        isRecurring: true,
        recurrenceInterval: 'MONTHLY'
      }
    });

    const task2 = await prisma.task.create({
      data: {
        workspaceId: household.id,
        title: 'Review and update homeowners insurance coverage',
        description: 'Compare current policy limits against recent electronics purchases',
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.IN_PROGRESS,
        deadline: addDays(now, 10),
        assignedMemberId: sarah.id,
        createdById: alex.id
      }
    });

    // Task Comments
    await prisma.taskComment.createMany({
      data: [
        {
          taskId: task1.id,
          authorId: alex.id,
          content: 'I picked up a pack of two 20x25x4 filters in the garage shelf.'
        },
        {
          taskId: task1.id,
          authorId: marcus.id,
          content: 'Got it, I will swap it out this weekend!'
        }
      ]
    });

    // 9. Notifications
    await prisma.notification.createMany({
      data: [
        {
          userId: alex.id,
          workspaceId: household.id,
          type: NotificationType.BILL_DUE,
          title: 'Upcoming Bill Due: Apartment Rent',
          message: 'Reminder: "Apartment Rent" of USD 2400.00 is due in 5 days.',
          entityType: 'BILL',
          entityId: rentBill.id
        },
        {
          userId: marcus.id,
          workspaceId: household.id,
          type: NotificationType.BILL_OVERDUE,
          title: 'Overdue Bill: Municipal Water & Sewage',
          message: 'The bill "Municipal Water & Sewage" of USD 68.20 was due 4 days ago.',
          entityType: 'BILL',
          entityId: waterBill.id
        },
        {
          userId: sarah.id,
          workspaceId: household.id,
          type: NotificationType.WARRANTY_EXPIRING,
          title: 'Warranty Expiring: Bosch 800 Series Dishwasher',
          message: 'The manufacturer warranty for Bosch 800 Series Dishwasher expires in 20 days.',
          entityType: 'INVENTORY',
          entityId: dishwasher.id
        }
      ]
    });

    // 10. Activity Logs
    await prisma.activityLog.createMany({
      data: [
        {
          workspaceId: household.id,
          actorId: alex.id,
          action: 'CREATE',
          entity: 'WORKSPACE',
          entityId: household.id,
          entityName: household.name
        },
        {
          workspaceId: household.id,
          actorId: alex.id,
          action: 'INVITE',
          entity: 'MEMBER',
          entityId: sarah.id,
          entityName: 'sarah@keepr.app'
        },
        {
          workspaceId: household.id,
          actorId: alex.id,
          action: 'CREATE',
          entity: 'BILL',
          entityId: rentBill.id,
          entityName: rentBill.name
        },
        {
          workspaceId: household.id,
          actorId: alex.id,
          action: 'PAY',
          entity: 'BILL',
          entityId: rentBill.id,
          entityName: rentBill.name,
          metadata: { amount: 2400.0 }
        }
      ]
    });

    logger.info('🎉 Initial database seed completed successfully!');
  } catch (error: any) {
    logger.error('AutoSeed execution error:', error);
  }
}
