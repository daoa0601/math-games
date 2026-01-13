/**
 * Button - Vietnamese Premium Editorial Style
 *
 * Flat, minimal button following the editorial design system.
 * NO gradients, NO shadows, border-radius <= 2px.
 *
 * Uses class-variance-authority for variant management.
 */

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';

/**
 * Button variants using tw: prefix for Tailwind classes.
 * Follows Vietnamese Premium editorial aesthetic:
 * - Flat colors (no gradients)
 * - No shadows
 * - Minimal border-radius (2px max)
 * - Uppercase text with letter-spacing
 * - Monospace font
 */
const buttonVariants = cva(
  // Base styles
  [
    'tw:inline-flex tw:items-center tw:justify-center tw:gap-2',
    'tw:whitespace-nowrap tw:text-sm tw:font-medium',
    'tw:uppercase tw:tracking-wider',
    'tw:font-[var(--font-mono)]',
    'tw:transition-opacity tw:outline-none',
    'tw:disabled:pointer-events-none tw:disabled:opacity-50',
    'tw:[&_svg]:pointer-events-none tw:[&_svg]:shrink-0 tw:[&_svg:not([class*="size-"])]:size-4',
    'tw:focus-visible:ring-2 tw:focus-visible:ring-[var(--accent-gold)] tw:focus-visible:ring-offset-2 tw:focus-visible:ring-offset-[var(--bg-primary)]',
    'tw:touch-action-manipulation',
  ].join(' '),
  {
    variants: {
      variant: {
        // Primary: Gold accent, dark text
        default: [
          'tw:bg-[var(--accent-gold)] tw:text-[var(--bg-primary)]',
          'tw:hover:opacity-90 tw:active:opacity-80',
        ].join(' '),
        // Secondary: Transparent with border
        secondary: [
          'tw:bg-transparent tw:text-[var(--text-muted)]',
          'tw:border tw:border-[var(--border)]',
          'tw:hover:text-[var(--text-primary)] tw:hover:border-[var(--text-primary)]',
        ].join(' '),
        // Ghost: No border
        ghost: [
          'tw:bg-transparent tw:text-[var(--text-muted)]',
          'tw:hover:text-[var(--text-primary)]',
        ].join(' '),
        // Success: Green
        success: [
          'tw:bg-[var(--success)] tw:text-[var(--bg-primary)]',
          'tw:hover:opacity-90 tw:active:opacity-80',
        ].join(' '),
        // Destructive: Red
        destructive: [
          'tw:bg-[#ef4444] tw:text-[var(--text-primary)]',
          'tw:hover:opacity-90 tw:active:opacity-80',
        ].join(' '),
        // Link style
        link: [
          'tw:bg-transparent tw:text-[var(--accent-gold)]',
          'tw:underline-offset-4 tw:hover:underline',
          'tw:normal-case tw:tracking-normal',
        ].join(' '),
      },
      size: {
        default: 'tw:h-10 tw:px-6 tw:py-2',
        sm: 'tw:h-8 tw:px-4 tw:text-xs',
        lg: 'tw:h-12 tw:px-8 tw:text-base',
        icon: 'tw:size-10',
        'icon-sm': 'tw:size-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, isLoading = false, children, disabled, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref}
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="tw:size-4 tw:animate-spin"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle
                cx="8"
                cy="8"
                r="6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="32"
                strokeDashoffset="12"
              />
            </svg>
            <span>{children}</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
