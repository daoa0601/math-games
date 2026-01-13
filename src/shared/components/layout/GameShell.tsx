import { type ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import '@/shared/styles/game-shell.css';

export type GameId = 'magic-graph' | 'sequence-race' | 'shape-architect';

export interface GameShellProps {
  /** Unique game identifier for per-game theming */
  gameId: GameId;
  /** Child components (GameHeader, board, controls, GameFooter) */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for E2E testing */
  'data-testid'?: string;
}

/**
 * GameShell - Unified container for all game content.
 *
 * Provides a responsive, card-based layout that:
 * - Contains game header, board, controls, and footer in one unit
 * - Adapts between 460px (mobile) and 520px (tablet+) max-width
 * - Applies per-game accent colors via data-game attribute
 * - Works identically across all viewport sizes
 *
 * @example
 * <GameShell gameId="magic-graph">
 *   <GameHeader ... />
 *   <div className="game-board-area">...</div>
 *   <div className="game-controls-area">...</div>
 *   <GameFooter ... />
 * </GameShell>
 */
export function GameShell({
  gameId,
  children,
  className,
  'data-testid': testId,
}: GameShellProps) {
  return (
    <div
      data-game={gameId}
      data-testid={testId ?? `game-shell-${gameId}`}
      className={cn('game-shell', className)}
    >
      {children}
    </div>
  );
}
