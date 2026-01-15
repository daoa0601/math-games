/**
 * SettingsDrawer - Progressive Disclosure Pattern
 *
 * A slide-up drawer that hides non-essential game controls:
 * - Difficulty selector
 * - Mode toggle (Timed/Practice)
 * - New game / Random buttons
 * - Game rules
 *
 * Uses shadcn Sheet for consistent modal behavior.
 * Triggered by gear icon in game header.
 */

import { type ReactNode, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/shared/components/ui/shadcn';
import { Button } from '@/shared/components/ui/shadcn';
import './SettingsDrawer.css';

export interface SettingsDrawerProps {
  /** Whether the drawer is open (deprecated: use open) */
  isOpen?: boolean;
  /** Whether the drawer is open */
  open?: boolean;
  /** Callback when drawer should close (deprecated: use onOpenChange) */
  onClose?: () => void;
  /** Callback when drawer open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Settings content (difficulty selector, mode toggle, etc.) */
  children: ReactNode;
  /** Optional title override (defaults to "Settings") */
  title?: string;
}

/**
 * Settings drawer for game configuration.
 * Uses shadcn Sheet with bottom side for slide-up behavior.
 */
export function SettingsDrawer({
  isOpen,
  open,
  onClose,
  onOpenChange,
  children,
  title,
}: SettingsDrawerProps) {
  const { t } = useTranslation('common');

  // Support both old and new API for backward compatibility
  const isOpenState = open !== undefined ? open : isOpen;
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else if (!newOpen && onClose) {
      onClose();
    }
  }, [onOpenChange, onClose]);

  return (
    <Sheet open={isOpenState} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="settings-drawer-sheet tw:px-0">
        <SheetHeader className="tw:px-6">
          <SheetTitle>{title ?? t('settings.title', 'Settings')}</SheetTitle>
          <SheetDescription>
            {t('settings.preferences', 'Preferences')}
          </SheetDescription>
        </SheetHeader>
        <div className="tw:py-4">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Trigger button for opening the settings drawer.
 * Renders as a gear icon button.
 */
export interface SettingsDrawerTriggerProps {
  /** Callback when trigger is clicked */
  onClick: () => void;
  /** Optional aria-label override */
  ariaLabel?: string;
}

export function SettingsDrawerTrigger({
  onClick,
  ariaLabel,
}: SettingsDrawerTriggerProps) {
  const { t } = useTranslation('common');

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      aria-label={ariaLabel ?? t('settings.openSettings', 'Open settings')}
      data-testid="settings-drawer-trigger"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="miter"
        aria-hidden="true"
      >
        {/* Gear icon - minimal design matching Linear Editorial */}
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    </Button>
  );
}

/**
 * Section component for grouping related settings.
 */
export interface SettingsSectionProps {
  /** Section title */
  title: string;
  /** Section content */
  children: ReactNode;
}

export function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <div className="tw:px-6 tw:pb-4">
      <h3 className="tw:font-mono tw:text-xs tw:uppercase tw:tracking-widest tw:text-muted-foreground tw:mb-2">
        {title}
      </h3>
      <div className="tw:space-y-2">{children}</div>
    </div>
  );
}
