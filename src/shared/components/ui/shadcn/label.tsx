/**
 * Label - Vietnamese Premium Editorial Style
 *
 * Uppercase, monospace label with muted color.
 */

'use client';

import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@/shared/lib/utils';

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    data-slot="label"
    className={cn(
      // Base styles
      'tw:flex tw:items-center tw:gap-2',
      'tw:font-[var(--font-mono)] tw:text-xs tw:font-medium',
      'tw:uppercase tw:tracking-widest',
      'tw:text-[var(--text-muted)]',
      'tw:select-none',
      // Disabled state (when used with peer/group)
      'tw:peer-disabled:cursor-not-allowed tw:peer-disabled:opacity-50',
      'tw:group-data-[disabled=true]:pointer-events-none tw:group-data-[disabled=true]:opacity-50',
      className
    )}
    {...props}
  />
));

Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
