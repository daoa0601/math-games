/**
 * useSyncState Hook
 *
 * Provides access to the current sync state from the sync manager.
 */

import { useState, useEffect } from 'react';
import { subscribeSyncState, getSyncState, type SyncState } from '@/firebase/sync';
import { isFirebaseEnabled } from '@/firebase';

/**
 * Hook to access the current sync state.
 * Returns null if Firebase is not enabled.
 */
export function useSyncState(): SyncState | null {
  const [state, setState] = useState<SyncState | null>(() => {
    if (!isFirebaseEnabled()) return null;
    return getSyncState();
  });

  useEffect(() => {
    if (!isFirebaseEnabled()) {
      return;
    }

    const unsubscribe = subscribeSyncState((newState) => {
      setState(newState);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return state;
}
