/**
 * SettingsDrawer - Progressive Disclosure Pattern
 *
 * A slide-up drawer that hides non-essential game controls:
 * - Difficulty selector
 * - Mode toggle (Timed/Practice)
 * - New game / Random buttons
 * - Game rules
 *
 * Uses BottomSheet internally for consistent modal behavior.
 * Triggered by gear icon in game header.
 */

import { type ReactNode, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from './BottomSheet';
import { IconButton } from './IconButton';
import './SettingsDrawer.css';

export interface SettingsDrawerProps {
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Callback when drawer should close */
  onClose: () => void;
  /** Settings content (difficulty selector, mode toggle, etc.) */
  children: ReactNode;
  /** Optional title override (defaults to "Settings") */
  title?: string;
}

/**
 * Settings drawer for game configuration.
 * Uses BottomSheet with content detent for auto-height.
 */
export function SettingsDrawer({
  isOpen,
  onClose,
  children,
  title,
}: SettingsDrawerProps) {
  const { t } = useTranslation('common');

  // Wrap close in useCallback to prevent re-renders
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title={title ?? t('settings.title', 'Settings')}
      detent="content"
      dismissible
      className="settings-drawer"
      ariaLabel={title ?? t('settings.title', 'Settings')}
    >
      <div className="settings-drawer__content">
        {children}
      </div>
    </BottomSheet>
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
    <IconButton
      onClick={onClick}
      aria-label={ariaLabel ?? t('settings.openSettings', 'Open settings')}
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
    </IconButton>
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
    <div className="settings-section">
      <h3 className="settings-section__title">{title}</h3>
      <div className="settings-section__content">{children}</div>
    </div>
  );
}
