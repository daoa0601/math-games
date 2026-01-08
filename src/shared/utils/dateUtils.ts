/**
 * Date Utilities
 * Centralized date functions for streak calculation, daily challenges, etc.
 */

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Calculate days between two date strings (YYYY-MM-DD format)
 * Uses T00:00:00 suffix to avoid timezone-related off-by-one errors
 */
export function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1 + 'T00:00:00');
  const d2 = new Date(date2 + 'T00:00:00');
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if two dates are consecutive (exactly 1 day apart)
 */
export function isConsecutiveDay(date1: string, date2: string): boolean {
  return daysBetween(date1, date2) === 1;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: string, date2: string): boolean {
  return date1 === date2;
}
