/**
 * Sonner Toast - Educational notification toasts
 *
 * Based on shadcn/ui Sonner integration with clean, flat styling.
 * Follows system theme (light-first for educational context).
 *
 * Usage:
 * 1. Add <Toaster /> to your app root (e.g., App.tsx)
 * 2. Import { toast } from 'sonner' and call toast('Message')
 *
 * @example
 * import { toast } from 'sonner';
 * toast.success('Correct answer!');
 * toast.error('Try again');
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
      theme="system"
      position="top-center"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: [
            // Clean educational surface
            'tw:group tw:toast',
            'tw:bg-background',
            'tw:border tw:border-border',
            'tw:rounded-lg',
            'tw:shadow-md',
            'tw:text-foreground',
          ].join(' '),
          title: 'tw:font-semibold',
          description: 'tw:text-muted-foreground tw:text-sm',
          actionButton: [
            'tw:bg-primary tw:text-primary-foreground',
            'tw:text-xs tw:font-medium',
          ].join(' '),
          cancelButton: [
            'tw:bg-transparent tw:text-muted-foreground',
            'tw:border tw:border-border',
          ].join(' '),
          // Functional color indicators (left border)
          success: 'tw:border-l-4 tw:border-l-[var(--success)]',
          error: 'tw:border-l-4 tw:border-l-[var(--error)]',
          warning: 'tw:border-l-4 tw:border-l-[var(--warning)]',
          info: 'tw:border-l-4 tw:border-l-primary',
        },
      }}
      icons={{
        success: <CircleCheckIcon className="tw:size-4 tw:text-[var(--success)]" />,
        info: <InfoIcon className="tw:size-4 tw:text-primary" />,
        warning: <TriangleAlertIcon className="tw:size-4 tw:text-[var(--warning)]" />,
        error: <OctagonXIcon className="tw:size-4 tw:text-[var(--error)]" />,
        loading: <Loader2Icon className="tw:size-4 tw:animate-spin tw:text-muted-foreground" />,
      }}
      style={
        {
          '--normal-bg': 'var(--bg)',
          '--normal-text': 'var(--text)',
          '--normal-border': 'var(--border)',
          '--border-radius': '8px',
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export { Toaster };

// Re-export toast function for convenience
export { toast } from 'sonner';
