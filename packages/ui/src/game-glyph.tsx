import { cn } from "./cn";

export type GameGlyphId =
  | "magic-graph"
  | "sequence-race"
  | "shape-architect"
  | "pattern-detective";

interface GameGlyphProps {
  game: GameGlyphId;
  className?: string;
  title?: string;
}

function MagicGraphGlyph() {
  return (
    <>
      <line
        x1="18"
        y1="20"
        x2="46"
        y2="20"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.55"
      />
      <line
        x1="18"
        y1="20"
        x2="32"
        y2="48"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="46"
        y1="20"
        x2="32"
        y2="48"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="18" cy="20" r="5.5" fill="currentColor" />
      <circle cx="46" cy="20" r="5.5" fill="currentColor" />
      <circle cx="32" cy="48" r="5.5" fill="currentColor" />
    </>
  );
}

function SequenceRaceGlyph() {
  return (
    <>
      <rect
        x="8"
        y="36"
        width="13"
        height="20"
        rx="2"
        fill="currentColor"
        opacity="0.45"
      />
      <rect
        x="25.5"
        y="24"
        width="13"
        height="32"
        rx="2"
        fill="currentColor"
        opacity="0.75"
      />
      <rect x="43" y="12" width="13" height="44" rx="2" fill="currentColor" />
    </>
  );
}

function ShapeArchitectGlyph() {
  return (
    <>
      <path d="M32 8 L8 52 L32 52 Z" fill="currentColor" opacity="0.55" />
      <path d="M32 8 L32 52 L56 52 Z" fill="currentColor" />
      <path
        d="M32 8 L32 52"
        stroke="var(--background)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
    </>
  );
}

function PatternDetectiveGlyph() {
  return (
    <>
      <circle cx="11" cy="32" r="5" fill="currentColor" />
      <circle cx="25" cy="32" r="5" fill="currentColor" />
      <circle
        cx="39"
        cy="32"
        r="5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="3 2.2"
      />
      <circle cx="53" cy="32" r="5" fill="currentColor" />
    </>
  );
}

const glyphs: Record<GameGlyphId, () => React.JSX.Element> = {
  "magic-graph": MagicGraphGlyph,
  "sequence-race": SequenceRaceGlyph,
  "shape-architect": ShapeArchitectGlyph,
  "pattern-detective": PatternDetectiveGlyph,
};

export function GameGlyph({ game, className, title }: GameGlyphProps) {
  const Glyph = glyphs[game];

  return (
    <svg
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      viewBox="0 0 64 64"
      className={cn("text-primary", className)}
    >
      {title ? <title>{title}</title> : null}
      <Glyph />
    </svg>
  );
}
