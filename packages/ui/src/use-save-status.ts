import { useCallback, useEffect, useState } from "react";

const AUTO_DISMISS_MS = 5000;

interface UseSaveStatusReturn {
  /** Current status message, or null. */
  saveStatus: string | null;
  /** Set a new status message (auto-dismisses after 5s). */
  setSaveStatus: (message: string | null) => void;
  /** Clear the status immediately. */
  clearSaveStatus: () => void;
}

/**
 * Manages a save-status message that auto-dismisses after 5 seconds.
 * Replaces the repeated useState + useEffect pattern in every game route.
 */
export function useSaveStatus(): UseSaveStatusReturn {
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!saveStatus) return;
    const timer = setTimeout(() => setSaveStatus(null), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [saveStatus]);

  const clearSaveStatus = useCallback(() => setSaveStatus(null), []);

  return { saveStatus, setSaveStatus, clearSaveStatus };
}
