/**
 * Sync Indicator
 *
 * Shows the current sync status (synced, syncing, offline, error).
 */

import { useTranslation } from 'react-i18next';
import './SyncIndicator.css';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

interface SyncIndicatorProps {
  status: SyncStatus;
  className?: string;
}

export function SyncIndicator({ status, className = '' }: SyncIndicatorProps) {
  const { t } = useTranslation();

  const labels: Record<SyncStatus, string> = {
    synced: t('sync.synced', 'Synced'),
    syncing: t('sync.syncing', 'Syncing...'),
    offline: t('sync.offline', 'Offline'),
    error: t('sync.error', 'Sync Error'),
  };

  return (
    <div className={`sync-indicator sync-indicator--${status} ${className}`} title={labels[status]}>
      {status === 'syncing' ? (
        <svg className="sync-indicator__icon sync-indicator__icon--spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      ) : status === 'synced' ? (
        <svg className="sync-indicator__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : status === 'offline' ? (
        <svg className="sync-indicator__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      ) : (
        <svg className="sync-indicator__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )}
      <span className="sync-indicator__label">{labels[status]}</span>
    </div>
  );
}
