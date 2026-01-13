/**
 * Sheet component - Vietnamese Premium styled bottom/side sheet
 * Based on shadcn/ui Sheet with credit card aesthetic
 *
 * Features:
 * - Gold accent border on top (signature Vietnamese Premium element)
 * - Credit card gradient background and shadow
 * - Smooth slide animations
 * - Mobile swipe-to-dismiss support (to be added in wrapper)
 */

import * as React from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';

import { cn } from '@/shared/lib/utils';

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        // Base overlay styles
        'tw:fixed tw:inset-0 tw:z-50 tw:bg-black/60',
        // Animation
        'tw:data-[state=open]:animate-in tw:data-[state=closed]:animate-out',
        'tw:data-[state=closed]:fade-out-0 tw:data-[state=open]:fade-in-0',
        className
      )}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side = 'bottom',
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: 'top' | 'right' | 'bottom' | 'left';
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          // Base styles - Vietnamese Premium credit card aesthetic
          'tw:fixed tw:z-50 tw:flex tw:flex-col',
          'tw:transition tw:ease-in-out',
          'tw:data-[state=closed]:duration-300 tw:data-[state=open]:duration-500',
          // Credit card surface styling
          'premium-modal',
          // Animation based on side
          side === 'right' && [
            'tw:inset-y-0 tw:right-0 tw:h-full tw:w-3/4 sm:tw:max-w-sm',
            'tw:data-[state=closed]:slide-out-to-right tw:data-[state=open]:slide-in-from-right',
            'tw:border-l tw:border-[var(--border)]',
          ],
          side === 'left' && [
            'tw:inset-y-0 tw:left-0 tw:h-full tw:w-3/4 sm:tw:max-w-sm',
            'tw:data-[state=closed]:slide-out-to-left tw:data-[state=open]:slide-in-from-left',
            'tw:border-r tw:border-[var(--border)]',
          ],
          side === 'top' && [
            'tw:inset-x-0 tw:top-0 tw:h-auto',
            'tw:data-[state=closed]:slide-out-to-top tw:data-[state=open]:slide-in-from-top',
            'tw:border-b tw:border-[var(--border)]',
          ],
          side === 'bottom' && [
            'tw:inset-x-0 tw:bottom-0 tw:h-auto tw:max-h-[85vh]',
            'tw:data-[state=closed]:slide-out-to-bottom tw:data-[state=open]:slide-in-from-bottom',
            // Gold accent bar on top (Vietnamese Premium signature)
            'tw:border-t-2 tw:border-t-[var(--accent-gold)]',
          ],
          className
        )}
        {...props}
      >
        {/* Drag handle for bottom sheet */}
        {side === 'bottom' && (
          <div className="tw:flex tw:justify-center tw:py-2">
            <div className="tw:h-1 tw:w-12 tw:rounded-full tw:bg-[var(--border)]" />
          </div>
        )}
        {children}
        <SheetPrimitive.Close
          className={cn(
            'tw:absolute tw:top-4 tw:right-4',
            'tw:rounded-sm tw:opacity-70',
            'tw:transition-opacity hover:tw:opacity-100',
            'focus:tw:outline-none focus:tw:ring-2 focus:tw:ring-[var(--accent-gold)] focus:tw:ring-offset-2 focus:tw:ring-offset-[var(--bg-primary)]',
            'disabled:tw:pointer-events-none',
            'tw:text-[var(--text-muted)]'
          )}
        >
          <XIcon className="tw:size-5" />
          <span className="tw:sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-header"
      className={cn('tw:flex tw:flex-col tw:gap-1.5 tw:px-4 tw:pt-2', className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        'tw:mt-auto tw:flex tw:flex-col tw:gap-2 tw:p-4',
        // Safe area padding for mobile
        'tw:pb-[max(1rem,env(safe-area-inset-bottom))]',
        className
      )}
      {...props}
    />
  );
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        // Vietnamese Premium typography
        'tw:font-[var(--font-display)] tw:text-lg tw:font-semibold',
        'tw:text-[var(--text-primary)]',
        className
      )}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn(
        'tw:text-sm tw:text-[var(--text-muted)]',
        className
      )}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
