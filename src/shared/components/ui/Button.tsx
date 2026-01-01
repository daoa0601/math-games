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
}

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
      ...props
    },
    ref
  ) => {
    const baseClass = 'btn';
    const variantClass = `btn--${variant}`;
    const sizeClass = size !== 'medium' ? `btn--${size}` : '';

    const classes = [baseClass, variantClass, sizeClass, className]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="btn__spinner" aria-hidden="true">
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
          leftIcon && <span className="btn__icon btn__icon--left">{leftIcon}</span>
        )}
        <span className="btn__text">{children}</span>
        {!isLoading && rightIcon && (
          <span className="btn__icon btn__icon--right">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Add the spin animation to the document if not already present
if (typeof document !== 'undefined') {
  const styleId = 'button-animations';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .btn__spinner {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .btn__icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .btn__icon--left {
        margin-right: 0.25rem;
      }
      .btn__icon--right {
        margin-left: 0.25rem;
      }
      .btn--danger {
        background: linear-gradient(180deg, hsl(0, 70%, 62%), hsl(0, 70%, 52%));
        color: white;
        box-shadow: 0 4px 0 0 hsl(0, 70%, 40%), 0 6px 12px -2px hsla(0, 70%, 40%, 0.35);
      }
      .btn--danger:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 0 0 hsl(0, 70%, 40%), 0 10px 20px -2px hsla(0, 70%, 40%, 0.4);
      }
      .btn--danger:active {
        transform: translateY(2px);
        box-shadow: 0 2px 0 0 hsl(0, 70%, 40%), 0 4px 8px -2px hsla(0, 70%, 40%, 0.3);
      }
    `;
    document.head.appendChild(style);
  }
}
