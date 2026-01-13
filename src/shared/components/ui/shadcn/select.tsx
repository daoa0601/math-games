/**
 * Select - Vietnamese Premium Editorial Style
 *
 * Accessible select component using Radix UI primitives.
 * Flat, minimal styling with NO gradients, NO shadows.
 */

'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    size?: 'sm' | 'default';
  }
>(({ className, size = 'default', children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    data-slot="select-trigger"
    data-size={size}
    className={cn(
      // Base styles
      'tw:flex tw:w-full tw:items-center tw:justify-between tw:gap-2',
      'tw:bg-[var(--bg-primary)] tw:text-[var(--text-primary)]',
      'tw:border tw:border-[var(--border)]',
      'tw:px-3',
      'tw:font-[var(--font-mono)] tw:text-sm',
      'tw:whitespace-nowrap',
      // Size variants
      size === 'default' ? 'tw:h-10' : 'tw:h-8 tw:text-xs',
      // Placeholder
      'data-[placeholder]:tw:text-[var(--text-muted)]',
      // Focus state
      'tw:outline-none tw:transition-colors',
      'tw:focus-visible:border-[var(--accent-gold)]',
      // Disabled state
      'tw:disabled:cursor-not-allowed tw:disabled:opacity-50',
      // Icon styling
      '[&_svg]:tw:pointer-events-none [&_svg]:tw:shrink-0 [&_svg]:tw:size-4',
      '[&_svg:not([class*="text-"])]:tw:text-[var(--text-muted)]',
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDownIcon className="tw:size-4 tw:opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    data-slot="select-scroll-up-button"
    className={cn(
      'tw:flex tw:cursor-default tw:items-center tw:justify-center tw:py-1',
      className
    )}
    {...props}
  >
    <ChevronUpIcon className="tw:size-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    data-slot="select-scroll-down-button"
    className={cn(
      'tw:flex tw:cursor-default tw:items-center tw:justify-center tw:py-1',
      className
    )}
    {...props}
  >
    <ChevronDownIcon className="tw:size-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      data-slot="select-content"
      className={cn(
        // Base styles - Editorial flat look
        'tw:relative tw:z-50',
        'tw:max-h-96 tw:min-w-[8rem] tw:overflow-hidden',
        'tw:bg-[var(--surface)] tw:text-[var(--text-primary)]',
        'tw:border tw:border-[var(--border)]',
        // Animations
        'data-[state=open]:tw:animate-in data-[state=closed]:tw:animate-out',
        'data-[state=closed]:tw:fade-out-0 data-[state=open]:tw:fade-in-0',
        'data-[state=closed]:tw:zoom-out-95 data-[state=open]:tw:zoom-in-95',
        'data-[side=bottom]:tw:slide-in-from-top-2',
        'data-[side=left]:tw:slide-in-from-right-2',
        'data-[side=right]:tw:slide-in-from-left-2',
        'data-[side=top]:tw:slide-in-from-bottom-2',
        // Position adjustments
        position === 'popper' && [
          'data-[side=bottom]:tw:translate-y-1',
          'data-[side=left]:tw:-translate-x-1',
          'data-[side=right]:tw:translate-x-1',
          'data-[side=top]:tw:-translate-y-1',
        ],
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          'tw:p-1',
          position === 'popper' &&
            'tw:h-[var(--radix-select-trigger-height)] tw:w-full tw:min-w-[var(--radix-select-trigger-width)]'
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    data-slot="select-label"
    className={cn(
      'tw:px-2 tw:py-1.5',
      'tw:font-[var(--font-mono)] tw:text-xs',
      'tw:uppercase tw:tracking-widest',
      'tw:text-[var(--text-muted)]',
      className
    )}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    data-slot="select-item"
    className={cn(
      // Base styles
      'tw:relative tw:flex tw:w-full tw:cursor-default tw:select-none',
      'tw:items-center tw:gap-2',
      'tw:py-1.5 tw:pl-2 tw:pr-8',
      'tw:font-[var(--font-mono)] tw:text-sm',
      'tw:outline-none',
      // Focus/highlight state
      'focus:tw:bg-[var(--bg-tertiary)] focus:tw:text-[var(--text-primary)]',
      // Disabled state
      'data-[disabled]:tw:pointer-events-none data-[disabled]:tw:opacity-50',
      // Icon styling
      '[&_svg]:tw:pointer-events-none [&_svg]:tw:shrink-0 [&_svg]:tw:size-4',
      className
    )}
    {...props}
  >
    <span
      data-slot="select-item-indicator"
      className="tw:absolute tw:right-2 tw:flex tw:size-3.5 tw:items-center tw:justify-center"
    >
      <SelectPrimitive.ItemIndicator>
        <CheckIcon className="tw:size-4 tw:text-[var(--accent-gold)]" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    data-slot="select-separator"
    className={cn(
      'tw:pointer-events-none tw:-mx-1 tw:my-1 tw:h-px tw:bg-[var(--border)]',
      className
    )}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
