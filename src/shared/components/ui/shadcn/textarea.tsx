/**
 * Textarea - Vietnamese Premium Editorial Style
 *
 * Flat, minimal textarea following the editorial design system.
 * NO gradients, NO shadows, NO border-radius.
 */

import * as React from 'react';
import { cn } from '@/shared/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        data-slot="textarea"
        className={cn(
          // Base styles
          'tw:flex tw:min-h-[120px] tw:w-full',
          'tw:bg-[var(--bg-primary)] tw:text-[var(--text-primary)]',
          'tw:border tw:border-[var(--border)]',
          'tw:px-3 tw:py-2',
          'tw:font-[var(--font-mono)] tw:text-sm',
          'tw:resize-y',
          // Placeholder
          'tw:placeholder:text-[var(--text-muted)] tw:placeholder:opacity-60',
          // Focus state
          'tw:outline-none tw:transition-colors',
          'tw:focus-visible:border-[var(--accent-gold)]',
          // Disabled state
          'tw:disabled:cursor-not-allowed tw:disabled:opacity-50',
          // Invalid state
          'tw:aria-invalid:border-[#ef4444]',
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
