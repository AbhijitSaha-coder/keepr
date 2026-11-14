import { BillRecurrence } from '@prisma/client';
import {
  calculateNextDueDate,
  generateOccurrencesBetween,
  advanceMonthsPreservingDay,
  advanceYearsPreservingDay
} from '../../src/services/recurrenceEngine';
import { format } from 'date-fns';

describe('Recurrence Engine Unit Tests', () => {
  describe('calculateNextDueDate', () => {
    test('DAILY recurrence adds exactly 1 day', () => {
      const start = new Date('2026-05-10T12:00:00Z');
      const next = calculateNextDueDate(start, BillRecurrence.DAILY);
      expect(format(next, 'yyyy-MM-dd')).toBe('2026-05-11');
    });

    test('WEEKLY recurrence adds exactly 7 days', () => {
      const start = new Date('2026-05-10T12:00:00Z');
      const next = calculateNextDueDate(start, BillRecurrence.WEEKLY);
      expect(format(next, 'yyyy-MM-dd')).toBe('2026-05-17');
    });

    test('MONTHLY standard day preservation', () => {
      const start = new Date('2026-03-15T12:00:00Z');
      const next = calculateNextDueDate(start, BillRecurrence.MONTHLY);
      expect(format(next, 'yyyy-MM-dd')).toBe('2026-04-15');
    });

    test('MONTHLY month-end preservation from Jan 31 to Feb (non-leap year)', () => {
      // 2026 is non-leap year (Feb has 28 days)
      const jan31 = new Date('2026-01-31T12:00:00Z');
      const feb = calculateNextDueDate(jan31, BillRecurrence.MONTHLY);
      expect(format(feb, 'yyyy-MM-dd')).toBe('2026-02-28');

      // Subsequent advance from Feb 28 preserving 31st target
      const mar = advanceMonthsPreservingDay(feb, 1, 31);
      expect(format(mar, 'yyyy-MM-dd')).toBe('2026-03-31');
    });

    test('MONTHLY leap year handling: Jan 31 to Feb in leap year 2028', () => {
      // 2028 is a leap year (Feb has 29 days)
      const jan31 = new Date('2028-01-31T12:00:00Z');
      const feb = calculateNextDueDate(jan31, BillRecurrence.MONTHLY);
      expect(format(feb, 'yyyy-MM-dd')).toBe('2028-02-29');
    });

    test('YEARLY recurrence leap day Feb 29 to next year Feb 28', () => {
      // Feb 29, 2028 (leap year) to 2029 (non-leap)
      const leapDay = new Date('2028-02-29T12:00:00Z');
      const nextYear = advanceYearsPreservingDay(leapDay, 1);
      expect(format(nextYear, 'yyyy-MM-dd')).toBe('2029-02-28');
    });

    test('CUSTOM interval days', () => {
      const start = new Date('2026-06-01T12:00:00Z');
      const next = calculateNextDueDate(start, BillRecurrence.CUSTOM, { customIntervalDays: 45 });
      expect(format(next, 'yyyy-MM-dd')).toBe('2026-07-16');
    });

    test('CUSTOM interval months', () => {
      const start = new Date('2026-01-10T12:00:00Z');
      const next = calculateNextDueDate(start, BillRecurrence.CUSTOM, { customIntervalMonths: 6 });
      expect(format(next, 'yyyy-MM-dd')).toBe('2026-07-10');
    });
  });

  describe('generateOccurrencesBetween', () => {
    test('generates expected count of occurrences within date window', () => {
      const start = new Date('2026-01-01T12:00:00Z');
      const end = new Date('2026-06-01T12:00:00Z');
      const occurrences = generateOccurrencesBetween(start, end, BillRecurrence.MONTHLY);
      expect(occurrences.length).toBe(6); // Jan, Feb, Mar, Apr, May, Jun
    });

    test('ONE_TIME returns single occurrence', () => {
      const start = new Date('2026-01-15T12:00:00Z');
      const end = new Date('2026-12-31T12:00:00Z');
      const occurrences = generateOccurrencesBetween(start, end, BillRecurrence.ONE_TIME);
      expect(occurrences.length).toBe(1);
    });
  });
});
