import * as React from "react";

import { cn } from "./cn";
import { GameChrome } from "./game-chrome";
import type { GameGlyphId } from "./game-glyph";

interface GameDesktopShellProps {
  game: GameGlyphId;
  levelTitle: string;
  meta?: React.ReactNode;
  maxWidth?: "3xl" | "5xl";
  children: React.ReactNode;
}

/**
 * Desktop half of the dual game-route layout: the themed `<main>` wrapper
 * (hidden below md) plus the shared GameChrome header. The playfield, level
 * grid, and confetti are passed as children because their placement differs
 * per game. Mirrored by GameMobileShell; both render simultaneously and CSS
 * breakpoints toggle visibility. The `md:flex` class is load-bearing for the
 * desktopLayout() E2E locator — keep it.
 */
export function GameDesktopShell({
  game,
  levelTitle,
  meta,
  maxWidth = "3xl",
  children,
}: GameDesktopShellProps) {
  return (
    <main
      className={cn(
        "mx-auto hidden min-h-screen flex-col gap-6 px-4 py-6 md:flex md:gap-10 md:px-6 md:py-10",
        `theme-${game}`,
        maxWidth === "5xl" ? "max-w-5xl" : "max-w-3xl",
      )}
    >
      <GameChrome game={game} levelTitle={levelTitle} meta={meta} />
      {children}
    </main>
  );
}
