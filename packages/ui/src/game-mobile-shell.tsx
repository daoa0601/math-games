import type { ReactNode } from "react";

import { cn } from "./cn";
import type { GameGlyphId } from "./game-glyph";
import { MobileGameHeader } from "./mobile-game-header";

interface GameMobileShellProps {
  game: GameGlyphId;
  levelTitle: ReactNode;
  meta?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  children: ReactNode;
}

/**
 * Mobile half of the dual game-route layout: the themed `body-noise` wrapper
 * (hidden at md and up) plus the shared MobileGameHeader. The playfield,
 * confetti, and bottom action bar are passed as children because their
 * placement differs per game. Mirrored by GameDesktopShell. The `md:hidden`
 * class is load-bearing for the mobileLayout() E2E locator — keep it.
 */
export function GameMobileShell({
  game,
  levelTitle,
  meta,
  onBack,
  backLabel,
  children,
}: GameMobileShellProps) {
  return (
    <div
      className={cn(
        "body-noise flex min-h-screen flex-col md:hidden",
        `theme-${game}`,
      )}
    >
      <MobileGameHeader
        game={game}
        levelTitle={levelTitle}
        meta={meta}
        onBack={onBack}
        backLabel={backLabel}
      />
      {children}
    </div>
  );
}
