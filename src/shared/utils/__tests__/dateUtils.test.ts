import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  getTodayDate,
  daysBetween,
  isConsecutiveDay,
  isSameDay,
} from '../dateUtils';

describe('dateUtils', () => {
  describe('getTodayDate', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns date in YYYY-MM-DD format', () => {
      vi.setSystemTime(new Date('2024-06-15T10:30:00Z'));
      expect(getTodayDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('returns correct date', () => {
      vi.setSystemTime(new Date('2024-12-25T23:59:59Z'));
      expect(getTodayDate()).toBe('2024-12-25');
    });
  });

  describe('daysBetween', () => {
    it('returns 0 for same day', () => {
      expect(daysBetween('2024-06-15', '2024-06-15')).toBe(0);
    });

    it('returns 1 for consecutive days', () => {
      expect(daysBetween('2024-06-15', '2024-06-16')).toBe(1);
    });

    it('returns correct value for multiple days apart', () => {
      expect(daysBetween('2024-06-01', '2024-06-10')).toBe(9);
    });

    it('handles order-independent calculation', () => {
      expect(daysBetween('2024-06-10', '2024-06-01')).toBe(9);
    });

    it('handles month boundaries', () => {
      expect(daysBetween('2024-01-31', '2024-02-01')).toBe(1);
    });

    it('handles year boundaries', () => {
      expect(daysBetween('2023-12-31', '2024-01-01')).toBe(1);
    });

    it('handles leap year', () => {
      expect(daysBetween('2024-02-28', '2024-03-01')).toBe(2); // 2024 is leap year
      expect(daysBetween('2023-02-28', '2023-03-01')).toBe(1); // 2023 is not
    });
  });

  describe('isConsecutiveDay', () => {
    it('returns true for consecutive days', () => {
      expect(isConsecutiveDay('2024-06-15', '2024-06-16')).toBe(true);
    });

    it('returns true regardless of order', () => {
      expect(isConsecutiveDay('2024-06-16', '2024-06-15')).toBe(true);
    });

    it('returns false for same day', () => {
      expect(isConsecutiveDay('2024-06-15', '2024-06-15')).toBe(false);
    });

    it('returns false for non-consecutive days', () => {
      expect(isConsecutiveDay('2024-06-15', '2024-06-17')).toBe(false);
    });
  });

  describe('isSameDay', () => {
    it('returns true for same date strings', () => {
      expect(isSameDay('2024-06-15', '2024-06-15')).toBe(true);
    });

    it('returns false for different dates', () => {
      expect(isSameDay('2024-06-15', '2024-06-16')).toBe(false);
    });
  });
});
