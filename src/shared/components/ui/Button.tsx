import type { ButtonHTMLAttributes } from 'react';
import { forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPattern?: boolean;
}

/**
 * Button component using Linear Editorial design system.
 * Uses .action classes for flat, minimal styling.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'medium',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      className = '',
      disabled,
      style,
      showPattern = false,
      ...props
    },
    ref
  ) => {
    const variantMap: Record<ButtonVariant, string> = {
      primary: 'action--primary',
      secondary: 'action--secondary',
      ghost: 'action--secondary',
      success: 'action--success',
      danger: 'action--danger',
    };

    const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
      small: { fontSize: 'var(--text-xs)', padding: 'var(--space-xs) var(--space-sm)' },
      medium: {},
      large: { fontSize: 'var(--text-base)', padding: 'var(--space-md) var(--space-xl)' },
    };

    const classes = [
      'action',
      variantMap[variant],
      variant === 'primary' ? 'glow-emerald' : '',
      variant === 'primary' ? 'border-gold-accent' : '',
      showPattern ? 'pattern-lacquer' : '',
      className
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || isLoading}
        style={{ ...sizeStyles[size], ...style }}
        {...props}
      >
        {isLoading ? (
          <span className="action__spinner" aria-hidden="true">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ animation: 'spin 1s linear infinite' }}
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
          </span>
        ) : (
          leftIcon && <span className="action__icon">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && (
          <span className="action__icon">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Add minimal styles for spinner and icons
if (typeof document !== 'undefined') {
  const styleId = 'button-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .action__spinner,
      .action__icon {
        display: inline-flex;
        align-items: center;
        margin-right: var(--space-xs);
      }
      .action--success {
        background: var(--success);
        color: var(--bg);
      }
      .action--danger {
        background: #ef4444;
        color: var(--text);
      }
    `;
    document.head.appendChild(style);
  }
}
