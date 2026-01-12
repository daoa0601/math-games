import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';
import './IconButton.css';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icon content (SVG or React node) */
  children: ReactNode;
  /** Active state with accent color */
  active?: boolean;
  /** Required for accessibility */
  'aria-label': string;
}

/**
 * Unified icon button for header actions.
 * 40x40px, transparent background, 1px border, no border-radius (editorial style).
 *
 * Used by: SoundToggle, SettingsDrawerTrigger, HelpButton, LanguageSwitcher
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ children, active = false, className = '', ...props }, ref) => {
    const classes = [
      'icon-button',
      active ? 'icon-button--active' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button ref={ref} type="button" className={classes} {...props}>
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
