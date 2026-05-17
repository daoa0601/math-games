import * as React from "react";

import { cn } from "./cn";
import { GameGlyph } from "./game-glyph";
import type { GameGlyphId } from "./game-glyph";
import { GamePattern } from "./game-pattern";
import type { PatternType } from "./game-pattern";

const GAME_PATTERN: Record<GameGlyphId, PatternType> = {
  "magic-graph": "constellation",
  "sequence-race": "arrows",
  "shape-architect": "blueprint",
  "pattern-detective": "magnifier",
};

interface MechanicCardProps extends React.ComponentProps<"div"> {
  game: GameGlyphId;
  tone?: "default" | "hero";
  showGlyph?: boolean;
  showPattern?: boolean;
}

export function MechanicCard({
  game,
  tone = "default",
  showGlyph = true,
  showPattern = true,
  className,
  children,
  ...props
}: MechanicCardProps) {
  return (
    <div
      data-slot="mechanic-card"
      className={cn(
        `theme-${game}`,
        "group/mechanic relative isolate flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card text-card-foreground shadow-(--card-shadow-long)",
        "transition-[transform,box-shadow] duration-200 ease-out",
        "before:absolute before:inset-0 before:-z-10 before:bg-(image:--game-gradient) before:opacity-60 dark:before:opacity-70",
        tone === "hero" ? "p-7 md:p-9" : "p-6",
        className,
      )}
      {...props}
    >
      {showPattern ? (
        <GamePattern
          pattern={GAME_PATTERN[game]}
          className="text-primary/[0.025] dark:text-primary/[0.035]"
        />
      ) : null}
      {showGlyph ? (
        <GameGlyph
          game={game}
          className={cn(
            "pointer-events-none absolute text-primary/85",
            tone === "hero"
              ? "top-6 right-6 size-16 md:size-20"
              : "top-5 right-5 size-12",
          )}
        />
      ) : null}
      <div
        className={cn(
          "relative flex flex-1 flex-col",
          showGlyph && tone === "hero" && "pr-16 md:pr-24",
          showGlyph && tone === "default" && "pr-12",
        )}
      >
        {children}
      </div>
    </div>
  );
}
