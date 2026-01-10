/**
 * Auth Modal
 *
 * Modal for signing in or linking accounts.
 * Supports Google Sign-In and Email/Password.
 */

import { useState, useCallback, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui';
import './AuthModal.css';

export type AuthMode = 'signin' | 'signup' | 'link';

interface AuthModalProps {
  isOpen: boolean;
  mode: AuthMode;
  onClose: () => void;
  onGoogleSignIn: () => Promise<boolean>;
  onEmailSignIn?: (email: string, password: string) => Promise<boolean>;
  onEmailSignUp?: (email: string, password: string) => Promise<boolean>;
  isLoading?: boolean;
  error?: string | null;
  /** Whether Firebase is available. If false, shows a warning message. */
  isFirebaseAvailable?: boolean;
}

export function AuthModal({
  isOpen,
  mode,
  onClose,
  onGoogleSignIn,
  onEmailSignIn,
  onEmailSignUp,
  isLoading = false,
  error,
  isFirebaseAvailable = true,
}: AuthModalProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isEmailMode, setIsEmailMode] = useState(false);
  const [isSignUp, setIsSignUp] = useState(mode === 'signup');

  const handleGoogleClick = useCallback(async () => {
    const success = await onGoogleSignIn();
    if (success) {
      onClose();
    }
  }, [onGoogleSignIn, onClose]);

  const handleEmailSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    const handler = isSignUp ? onEmailSignUp : onEmailSignIn;
    if (!handler) return;

    const success = await handler(email, password);
    if (success) {
      onClose();
      setEmail('');
      setPassword('');
    }
  }, [email, password, isSignUp, onEmailSignIn, onEmailSignUp, onClose]);

  const toggleSignUp = useCallback(() => {
    setIsSignUp(s => !s);
  }, []);

  if (!isOpen) return null;

  const title = mode === 'link'
    ? t('auth.linkAccount', 'Link Your Account')
    : isSignUp
      ? t('auth.signUp', 'Create Account')
      : t('auth.signIn', 'Sign In');

  const subtitle = mode === 'link'
    ? t('auth.linkSubtitle', 'Save your progress across devices')
    : isSignUp
      ? t('auth.signUpSubtitle', 'Create an account to sync your progress')
      : t('auth.signInSubtitle', 'Sign in to access your saved progress');

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="auth-modal__close" onClick={onClose} aria-label={t('common.close', 'Close')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2 className="auth-modal__title">{title}</h2>
        <p className="auth-modal__subtitle">{subtitle}</p>

        {error && (
          <div className="auth-modal__error" role="alert">
            {error}
          </div>
        )}

        {!isFirebaseAvailable && (
          <div className="auth-modal__warning" role="status">
            {t('auth.firebaseUnavailable', 'Sign-in is temporarily unavailable. You can continue as a guest and your progress will be saved locally.')}
          </div>
        )}

        {!isEmailMode ? (
          <div className="auth-modal__buttons">
            <Button
              onClick={handleGoogleClick}
              disabled={isLoading || !isFirebaseAvailable}
              className="auth-modal__google-btn"
            >
              <svg className="auth-modal__google-icon" viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t('auth.continueWithGoogle', 'Continue with Google')}
            </Button>

            {(onEmailSignIn || onEmailSignUp) && (
              <>
                <div className="auth-modal__divider">
                  <span>{t('auth.or', 'or')}</span>
                </div>

                <Button
                  variant="secondary"
                  onClick={() => setIsEmailMode(true)}
                  disabled={isLoading || !isFirebaseAvailable}
                >
                  {t('auth.useEmail', 'Use Email')}
                </Button>
              </>
            )}
          </div>
        ) : (
          <form className="auth-modal__form" onSubmit={handleEmailSubmit}>
            <div className="auth-modal__field">
              <label htmlFor="auth-email">{t('auth.email', 'Email')}</label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                disabled={isLoading}
              />
            </div>

            <div className="auth-modal__field">
              <label htmlFor="auth-password">{t('auth.password', 'Password')}</label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="********"
                required
                minLength={6}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                disabled={isLoading}
              />
            </div>

            <Button type="submit" disabled={isLoading || !email || !password}>
              {isLoading
                ? t('common.loading', 'Loading...')
                : isSignUp
                  ? t('auth.createAccount', 'Create Account')
                  : t('auth.signInButton', 'Sign In')}
            </Button>

            <div className="auth-modal__toggle">
              <button type="button" onClick={toggleSignUp} disabled={isLoading}>
                {isSignUp
                  ? t('auth.haveAccount', 'Already have an account? Sign in')
                  : t('auth.needAccount', 'Need an account? Sign up')}
              </button>
            </div>

            <button
              type="button"
              className="auth-modal__back"
              onClick={() => setIsEmailMode(false)}
              disabled={isLoading}
            >
              {t('auth.backToOptions', 'Back to sign-in options')}
            </button>
          </form>
        )}

        {mode !== 'link' && (
          <p className="auth-modal__guest">
            <button type="button" onClick={onClose}>
              {t('auth.continueAsGuest', 'Continue as guest')}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
