/**
 * Input - Vietnamese Premium Editorial Style
 *
 * Flat, minimal input following the editorial design system.
 * NO gradients, NO shadows, NO border-radius.
 */

import * as React from 'react';
import { cn } from '@/shared/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        data-slot="input"
        className={cn(
          // Base styles
          'tw:flex tw:h-10 tw:w-full tw:min-w-0',
          'tw:bg-[var(--bg-primary)] tw:text-[var(--text-primary)]',
          'tw:border tw:border-[var(--border)]',
          'tw:px-3 tw:py-2',
          'tw:font-[var(--font-mono)] tw:text-sm',
          // Placeholder
          'tw:placeholder:text-[var(--text-muted)] tw:placeholder:opacity-60',
          // Focus state
          'tw:outline-none tw:transition-colors',
          'tw:focus-visible:border-[var(--accent-gold)]',
          // Disabled state
          'tw:disabled:cursor-not-allowed tw:disabled:opacity-50',
          // File input
          'tw:file:border-0 tw:file:bg-transparent',
          'tw:file:font-[var(--font-mono)] tw:file:text-sm tw:file:font-medium',
          'tw:file:text-[var(--text-primary)]',
          // Invalid state
          'tw:aria-invalid:border-[#ef4444]',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };
