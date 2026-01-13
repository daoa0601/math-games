/**
 * Dialog component - Vietnamese Premium styled modal dialog
 * Based on shadcn/ui Dialog with credit card aesthetic
 *
 * Features:
 * - Credit card gradient background and shadow
 * - Gold accent ring on focus
 * - Smooth zoom animations
 * - Accessible with Radix primitives
 */

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';

import { cn } from '@/shared/lib/utils';

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        // Base overlay
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

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          // Positioning
          'tw:fixed tw:top-[50%] tw:left-[50%] tw:z-50',
          'tw:w-full tw:max-w-[calc(100%-2rem)] sm:tw:max-w-lg',
          'tw:translate-x-[-50%] tw:translate-y-[-50%]',
          // Credit card aesthetic
          'premium-modal',
          'tw:p-6',
          // Animation
          'tw:duration-200 tw:outline-none',
          'tw:data-[state=open]:animate-in tw:data-[state=closed]:animate-out',
          'tw:data-[state=closed]:fade-out-0 tw:data-[state=open]:fade-in-0',
          'tw:data-[state=closed]:zoom-out-95 tw:data-[state=open]:zoom-in-95',
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
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
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        'tw:flex tw:flex-col tw:gap-2 tw:text-center sm:tw:text-left',
        className
      )}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'tw:flex tw:flex-col-reverse tw:gap-2 sm:tw:flex-row sm:tw:justify-end',
        // Safe area padding for mobile
        'tw:pb-[max(0rem,env(safe-area-inset-bottom))]',
        className
      )}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        // Vietnamese Premium typography
        'tw:font-[var(--font-display)] tw:text-lg tw:font-semibold tw:leading-none',
        'tw:text-[var(--text-primary)]',
        className
      )}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        'tw:text-sm tw:text-[var(--text-muted)]',
        className
      )}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
