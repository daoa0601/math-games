/**
 * Sonner Toast - Vietnamese Premium styled notifications
 *
 * Based on shadcn/ui Sonner integration with credit card aesthetic.
 * Dark theme only (matches Vietnamese Premium design system).
 *
 * Usage:
 * 1. Add <Toaster /> to your app root (e.g., App.tsx)
 * 2. Import { toast } from 'sonner' and call toast('Message')
 *
 * @example
 * import { toast } from 'sonner';
 * toast.success('Achievement unlocked!');
 * toast.error('Game over');
 */

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: [
            // Credit card aesthetic
            'tw:group tw:toast',
            'tw:bg-[var(--card-gradient)]',
            'tw:border tw:border-[var(--border)]',
            'tw:rounded-[var(--card-radius)]',
            'tw:shadow-[var(--card-shadow)]',
            'tw:text-[var(--text-primary)]',
          ].join(' '),
          title: 'tw:font-[var(--font-display)] tw:font-semibold',
          description: 'tw:text-[var(--text-muted)] tw:text-sm',
          actionButton: [
            'tw:bg-[var(--accent-gold)] tw:text-[var(--bg-primary)]',
            'tw:font-[var(--font-mono)] tw:uppercase tw:text-xs tw:tracking-wider',
          ].join(' '),
          cancelButton: [
            'tw:bg-transparent tw:text-[var(--text-muted)]',
            'tw:border tw:border-[var(--border)]',
          ].join(' '),
          success: 'tw:border-l-2 tw:border-l-[var(--success)]',
          error: 'tw:border-l-2 tw:border-l-[#ef4444]',
          warning: 'tw:border-l-2 tw:border-l-[var(--accent-coral)]',
          info: 'tw:border-l-2 tw:border-l-[var(--accent-gold)]',
        },
      }}
      icons={{
        success: <CircleCheckIcon className="tw:size-4 tw:text-[var(--success)]" />,
        info: <InfoIcon className="tw:size-4 tw:text-[var(--accent-gold)]" />,
        warning: <TriangleAlertIcon className="tw:size-4 tw:text-[var(--accent-coral)]" />,
        error: <OctagonXIcon className="tw:size-4 tw:text-[#ef4444]" />,
        loading: <Loader2Icon className="tw:size-4 tw:animate-spin tw:text-[var(--text-muted)]" />,
      }}
      style={
        {
          '--normal-bg': 'var(--surface)',
          '--normal-text': 'var(--text-primary)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--card-radius)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export { Toaster };

// Re-export toast function for convenience
export { toast } from 'sonner';
