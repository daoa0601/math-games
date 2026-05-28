import type { ReactNode } from "react";

import { cn } from "./cn";
import { GameGlyph } from "./game-glyph";
import type { GameGlyphId } from "./game-glyph";

interface MobileGameHeaderProps {
  game: GameGlyphId;
  levelTitle: ReactNode;
  meta?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  className?: string;
}

export function MobileGameHeader({
  game,
  levelTitle,
  meta,
  onBack,
  backLabel = "Back",
  className,
}: MobileGameHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between border-b border-border bg-background px-4 pb-2.5 pt-3",
        className,
      )}
    >
      <button
        type="button"
        aria-label={backLabel}
        onClick={onBack}
        className="inline-flex size-9 items-center justify-center rounded-[0.625rem] border-none bg-secondary text-foreground"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>
      <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
        <GameGlyph
          game={game}
          className="size-[18px] shrink-0 text-primary/85"
        />
        <span className="font-display truncate text-sm font-medium tracking-tight">
          {levelTitle}
        </span>
      </div>
      <div className="flex min-w-9 justify-end">{meta}</div>
    </header>
  );
}
