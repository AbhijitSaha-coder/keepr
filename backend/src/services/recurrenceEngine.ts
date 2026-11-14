import { BillRecurrence } from '@prisma/client';
import { BadRequestError } from '../utils/errors';

export interface RecurrenceOptions {
  customIntervalDays?: number | null;
  customIntervalMonths?: number | null;
  originalDayOfMonth?: number; // Preserves anchor day, e.g. 31st
}

/**
 * Returns total days in a given UTC month (month is 0-indexed: 0 = Jan, 1 = Feb, etc.)
 */
export function getDaysInUtcMonth(year: number, monthZeroIndexed: number): number {
  return new Date(Date.UTC(year, monthZeroIndexed + 1, 0)).getUTCDate();
}

/**
 * Helper to normalize a Date into a clean noon UTC Date object
 */
export function toUtcNoon(d: Date): Date {
  const date = new Date(d);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12, 0, 0, 0));
}

/**
 * Helper to advance months while strictly preserving original target day
 * (e.g. Jan 31 -> Feb 28/29 -> Mar 31)
 */
export function advanceMonthsPreservingDay(baseDate: Date, monthsToAdd: number, targetDay?: number): Date {
  const utc = toUtcNoon(baseDate);
  const curYear = utc.getUTCFullYear();
  const curMonth = utc.getUTCMonth();
  const curDay = utc.getUTCDate();

  const curDaysInMonth = getDaysInUtcMonth(curYear, curMonth);
  const isMonthEnd = curDay === curDaysInMonth;
  const anchorDay = targetDay ?? (isMonthEnd ? 31 : curDay);

  const totalMonths = curMonth + monthsToAdd;
  const newYear = curYear + Math.floor(totalMonths / 12);
  const newMonth = ((totalMonths % 12) + 12) % 12;

  const maxDayInNewMonth = getDaysInUtcMonth(newYear, newMonth);
  const finalDay = isMonthEnd || anchorDay >= maxDayInNewMonth ? maxDayInNewMonth : Math.min(anchorDay, maxDayInNewMonth);

  return new Date(Date.UTC(newYear, newMonth, finalDay, 12, 0, 0, 0));
}

/**
 * Helper to advance years while properly handling Feb 29 leap years
 */
export function advanceYearsPreservingDay(baseDate: Date, yearsToAdd: number, targetDay?: number): Date {
  const utc = toUtcNoon(baseDate);
  const curYear = utc.getUTCFullYear();
  const curMonth = utc.getUTCMonth();
  const curDay = utc.getUTCDate();

  const newYear = curYear + yearsToAdd;
  const maxDayInTargetMonth = getDaysInUtcMonth(newYear, curMonth);
  const anchorDay = targetDay ?? curDay;
  const finalDay = Math.min(anchorDay, maxDayInTargetMonth);

  return new Date(Date.UTC(newYear, curMonth, finalDay, 12, 0, 0, 0));
}

/**
 * Calculates the next due date following proper calendar arithmetic.
 */
export function calculateNextDueDate(
  currentDueDate: Date,
  recurrence: BillRecurrence,
  options?: RecurrenceOptions
): Date {
  const date = toUtcNoon(currentDueDate);

  switch (recurrence) {
    case BillRecurrence.ONE_TIME:
      return date;

    case BillRecurrence.DAILY: {
      const next = new Date(date);
      next.setUTCDate(next.getUTCDate() + 1);
      return next;
    }

    case BillRecurrence.WEEKLY: {
      const next = new Date(date);
      next.setUTCDate(next.getUTCDate() + 7);
      return next;
    }

    case BillRecurrence.MONTHLY: {
      return advanceMonthsPreservingDay(date, 1, options?.originalDayOfMonth);
    }

    case BillRecurrence.QUARTERLY: {
      return advanceMonthsPreservingDay(date, 3, options?.originalDayOfMonth);
    }

    case BillRecurrence.YEARLY: {
      return advanceYearsPreservingDay(date, 1, options?.originalDayOfMonth);
    }

    case BillRecurrence.CUSTOM: {
      if (options?.customIntervalDays && options.customIntervalDays > 0) {
        const next = new Date(date);
        next.setUTCDate(next.getUTCDate() + options.customIntervalDays);
        return next;
      }
      if (options?.customIntervalMonths && options.customIntervalMonths > 0) {
        return advanceMonthsPreservingDay(date, options.customIntervalMonths, options?.originalDayOfMonth);
      }
      throw new BadRequestError('Custom recurrence requires a positive customIntervalDays or customIntervalMonths');
    }

    default:
      return date;
  }
}

/**
 * Generates all occurrence dates between a start date and an end date limit.
 */
export function generateOccurrencesBetween(
  startDate: Date,
  endDate: Date,
  recurrence: BillRecurrence,
  options?: RecurrenceOptions,
  maxOccurrences = 60
): Date[] {
  if (recurrence === BillRecurrence.ONE_TIME) {
    return [toUtcNoon(startDate)];
  }

  const occurrences: Date[] = [];
  let current = toUtcNoon(startDate);
  const targetEnd = toUtcNoon(endDate);
  const targetDay = current.getUTCDate();
  const optsWithTarget = { ...options, originalDayOfMonth: targetDay };

  while (current.getTime() <= targetEnd.getTime() && occurrences.length < maxOccurrences) {
    occurrences.push(new Date(current));
    const next = calculateNextDueDate(current, recurrence, optsWithTarget);
    if (next.getTime() <= current.getTime()) {
      break;
    }
    current = next;
  }

  return occurrences;
}
