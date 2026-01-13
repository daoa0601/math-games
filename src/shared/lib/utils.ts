import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names using clsx and merges Tailwind classes intelligently.
 * Used by shadcn/ui components to handle conditional and merged classes.
 *
 * @example
 * cn('tw:px-4 tw:py-2', isActive && 'tw:bg-primary', className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
