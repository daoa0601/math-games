import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * Custom twMerge configured for Tailwind v4's tw: prefix.
 * This ensures tailwind-merge recognizes and properly merges our prefixed classes.
 */
const twMerge = extendTailwindMerge({
  prefix: 'tw:',
});

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
