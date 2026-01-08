/**
 * Login Page
 * Simple player ID-based login/registration
 */

import { useState, type FormEvent } from 'react';
import { useAuth } from '@/shared/contexts';
import { useTranslation } from 'react-i18next';
import './Login.css';

export function Login() {
  const { t } = useTranslation();
  const { login, loginAsGuest, isLoading, error, clearError } = useAuth();
  const [playerId, setPlayerId] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (playerId.trim()) {
      await login(playerId.trim());
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="login-title">{t('login.title', 'Math Games')}</h1>
        <p className="login-subtitle">
          {t('login.subtitle', 'Enter your player ID to continue')}
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="playerId" className="login-label">
              {t('login.playerIdLabel', 'Player ID')}
            </label>
            <input
              id="playerId"
              type="text"
              value={playerId}
              onChange={(e) => {
                setPlayerId(e.target.value);
                if (error) clearError();
              }}
              placeholder={t('login.playerIdPlaceholder', 'e.g., player123')}
              className="login-input"
              autoFocus
              disabled={isLoading}
              autoComplete="username"
            />
            <p className="login-hint">
              {t('login.hint', 'New ID? An account will be created automatically.')}
            </p>
          </div>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={!playerId.trim() || isLoading}
          >
            {isLoading
              ? t('login.loading', 'Loading...')
              : t('login.submit', 'Continue')}
          </button>

          <div className="login-divider">
            <span>{t('login.or', 'or')}</span>
          </div>

          <button
            type="button"
            className="login-button login-button--guest"
            onClick={loginAsGuest}
            disabled={isLoading}
          >
            {t('login.guest', 'Play as Guest')}
          </button>
        </form>

        <div className="login-info">
          <h2>{t('login.whatIsThis', 'What is a Player ID?')}</h2>
          <p>
            {t(
              'login.explanation',
              'Your Player ID is a unique identifier that tracks your progress. Use the same ID on any device to sync your stats and achievements.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
