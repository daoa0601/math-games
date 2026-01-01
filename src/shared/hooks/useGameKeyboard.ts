import { useEffect, useCallback } from 'react';

/**
 * Configuration for game keyboard shortcuts
 */
export interface GameKeyboardShortcuts {
  /** Undo action (Ctrl/Cmd + Z) */
  onUndo?: () => void;
  /** Redo action (Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z) */
  onRedo?: () => void;
  /** Reset game (Ctrl/Cmd + R) - prevented from refreshing */
  onReset?: () => void;
  /** Pause/Resume toggle (Space) */
  onPause?: () => void;
  /** Escape key action (e.g., deselect, close modal) */
  onEscape?: () => void;
  /** Rotate action for shape games (R key) */
  onRotate?: () => void;
  /** Enable/disable keyboard shortcuts */
  enabled?: boolean;
}

/**
 * Shared hook for game keyboard shortcuts
 *
 * Provides consistent keyboard handling across all games:
 * - Undo: Ctrl/Cmd + Z
 * - Redo: Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z
 * - Reset: Ctrl/Cmd + R (prevents page refresh)
 * - Pause: Space
 * - Escape: Escape key
 * - Rotate: R key
 *
 * @example
 * ```tsx
 * function MyGame() {
 *   const { undo, redo } = useHistory();
 *
 *   useGameKeyboard({
 *     onUndo: undo,
 *     onRedo: redo,
 *     onEscape: () => setSelectedPiece(null),
 *     enabled: !isPaused && !showWin,
 *   });
 * }
 * ```
 */
export function useGameKeyboard(shortcuts: GameKeyboardShortcuts): void {
  const {
    onUndo,
    onRedo,
    onReset,
    onPause,
    onEscape,
    onRotate,
    enabled = true,
  } = shortcuts;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable
      ) {
        return;
      }

      const isMod = event.ctrlKey || event.metaKey;

      // Undo: Ctrl/Cmd + Z (without Shift)
      if (isMod && event.key === 'z' && !event.shiftKey) {
        if (onUndo) {
          event.preventDefault();
          onUndo();
        }
        return;
      }

      // Redo: Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z
      if (isMod && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
        if (onRedo) {
          event.preventDefault();
          onRedo();
        }
        return;
      }

      // Reset: Ctrl/Cmd + R (prevent page refresh)
      if (isMod && event.key === 'r') {
        if (onReset) {
          event.preventDefault();
          onReset();
        }
        return;
      }

      // Pause: Space key
      if (event.key === ' ' || event.code === 'Space') {
        if (onPause) {
          event.preventDefault();
          onPause();
        }
        return;
      }

      // Escape key
      if (event.key === 'Escape') {
        if (onEscape) {
          onEscape();
        }
        return;
      }

      // Rotate: R key (lowercase, no modifiers)
      if (event.key === 'r' && !isMod && !event.shiftKey && !event.altKey) {
        if (onRotate) {
          event.preventDefault();
          onRotate();
        }
        return;
      }
    },
    [enabled, onUndo, onRedo, onReset, onPause, onEscape, onRotate]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);
}
