# Visual Refactoring Plan: Math Gymnasium

## Executive Summary

**Problem**: The current "Vietnamese Premium" dark/gold aesthetic targets a sophisticated adult audience, but the actual users are grades 1-8 (ages 6-14). The desktop layout splits game board and controls into disconnected regions.

**Solution**: Evolve the existing design system to be playful-educational while preserving the solid architecture. Unify game layouts into contained cards.

**Scope**: Visual layer only — logic, hooks, services, and data flow remain unchanged.

---

## Current State Analysis

### What's Working Well ✓
- Modular game architecture (`games/[GameName]/logic/` separation)
- Token-based CSS system (`shared/styles/tokens/`)
- shadcn/ui integration
- Per-game accent colors (`--game-magic`, `--game-race`, `--game-shape`)
- Accessibility foundations (focus trap, announcements, reduced motion)
- i18n with Vietnamese support

### What Needs Changing ✗
- Desktop layout: `grid-template-columns: 1fr 320px` creates disconnected sidebar
- Color palette: Dark navy + gold is sophisticated, not playful
- Typography: Crimson Pro serif feels adult; needs friendlier fonts
- Component separation: Info panel, game board, controls are scattered
- No light mode despite `ThemeContext` existing

---

## Refactoring Strategy

### Phase 1: Unified Game Shell (Layout Fix)
**Files affected**: 
- `shared/components/layout/GameLayout.tsx`
- `games/MagicGraph/MagicGraph.css` (and other games)
- `shared/styles/game-base.css`

**Goal**: Replace 2-column desktop grid with contained card that works everywhere.

```
BEFORE (Desktop):
┌─────────────────────┬──────────────────┐
│                     │  Timer           │
│    Game Board       │  Progress        │
│                     │  Target          │
│                     │  Actions         │
└─────────────────────┴──────────────────┘

AFTER (All viewports):
┌────────────────────────────────────┐
│  ┌──────────────────────────────┐  │
│  │ Progress │ Timer │ Target    │  │  ← GameHeader
│  ├──────────────────────────────┤  │
│  │                              │  │
│  │        Game Board            │  │  ← GameBoard slot
│  │                              │  │
│  ├──────────────────────────────┤  │
│  │      Controls / Input        │  │  ← GameControls slot
│  ├──────────────────────────────┤  │
│  │   Hint │ Reset │ Next        │  │  ← GameFooter
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

### Phase 2: Playful Color System
**Files affected**:
- `shared/styles/tokens/palette.css`
- `index.css` (theme definitions)

**Goal**: Warm, friendly palette that appeals to kids without being childish.

### Phase 3: Typography Update
**Files affected**:
- `shared/styles/tokens/type.css`
- Font imports

**Goal**: Vietnamese-optimized fonts that feel friendly.

### Phase 4: Light/Dark Mode Implementation
**Files affected**:
- `shared/contexts/ThemeContext.tsx` (already exists)
- Token files

**Goal**: Functional light mode as the default for young learners.

---

## Detailed Implementation

### Phase 1: New Component Structure

#### 1.1 Create `GameShell.tsx`

```tsx
// shared/components/layout/GameShell.tsx
import { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

interface GameShellProps {
  children: ReactNode;
  gameId: 'magic-graph' | 'sequence-race' | 'shape-architect';
  className?: string;
}

export function GameShell({ children, gameId, className }: GameShellProps) {
  return (
    <div 
      data-game={gameId}
      className={cn(
        // Contained card - same on all viewports
        "w-full max-w-[460px] mx-auto",
        "bg-card rounded-2xl",
        "border border-border",
        "shadow-sm",
        "overflow-hidden",
        className
      )}
    >
      {children}
    </div>
  );
}
```

#### 1.2 Create `GameHeader.tsx`

```tsx
// shared/components/layout/GameHeader.tsx
interface GameHeaderProps {
  progress: { label: string; current: number; total: number };
  timer: { value: number; mode: 'up' | 'down' | 'practice' };
  target?: { label: string; value: number | string };
}

export function GameHeader({ progress, timer, target }: GameHeaderProps) {
  return (
    <div className="game-header-strip">
      <div className="game-header-strip__progress">
        <span className="game-header-strip__label">{progress.label}</span>
        <span className="game-header-strip__value">
          {progress.current}/{progress.total}
        </span>
      </div>
      
      <div className="game-header-strip__timer">
        <Timer value={timer.value} mode={timer.mode} />
      </div>
      
      {target && (
        <div className="game-header-strip__target">
          <span className="game-header-strip__label">{target.label}</span>
          <span className="game-header-strip__value game-header-strip__value--accent">
            {target.value}
          </span>
        </div>
      )}
    </div>
  );
}
```

#### 1.3 Create `GameFooter.tsx`

```tsx
// shared/components/layout/GameFooter.tsx
interface GameFooterProps {
  onHint?: () => void;
  onReset?: () => void;
  onNext?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  canProceed?: boolean;
  hintsRemaining?: number;
}

export function GameFooter({ 
  onHint, onReset, onNext, onUndo, onRedo,
  canUndo, canRedo, canProceed, hintsRemaining 
}: GameFooterProps) {
  const { t } = useTranslation('common');
  
  return (
    <div className="game-footer">
      <div className="game-footer__secondary">
        {onUndo && (
          <button 
            className="game-footer__btn game-footer__btn--icon" 
            onClick={onUndo}
            disabled={!canUndo}
            aria-label={t('buttons.undo')}
          >
            ↩️
          </button>
        )}
        {onRedo && (
          <button 
            className="game-footer__btn game-footer__btn--icon" 
            onClick={onRedo}
            disabled={!canRedo}
            aria-label={t('buttons.redo')}
          >
            ↪️
          </button>
        )}
        {onHint && (
          <button className="game-footer__btn" onClick={onHint}>
            💡 {t('buttons.hint')}
            {hintsRemaining !== undefined && (
              <span className="game-footer__badge">{hintsRemaining}</span>
            )}
          </button>
        )}
        {onReset && (
          <button className="game-footer__btn" onClick={onReset}>
            🔄 {t('buttons.reset')}
          </button>
        )}
      </div>
      
      {onNext && (
        <button 
          className="game-footer__btn game-footer__btn--primary" 
          onClick={onNext}
          disabled={!canProceed}
        >
          {t('buttons.nextPuzzle')} →
        </button>
      )}
    </div>
  );
}
```

#### 1.4 Update MagicGraphGame.tsx

```tsx
// BEFORE: Complex nested layout with desktop sidebar
<GameLayout title={t('title')} headerRight={...} gameId="magic-graph">
  <div className="mg-layout">
    <div className="mg-main">
      {/* game board */}
    </div>
    <div className="mg-sidebar">
      {/* timer, info, controls scattered here */}
    </div>
  </div>
</GameLayout>

// AFTER: Unified shell with slots
<GameLayout title={t('title')} headerRight={...} gameId="magic-graph">
  <GameShell gameId="magic-graph">
    <GameHeader
      progress={{ label: puzzle.name, current: currentLevel, total: totalLevels }}
      timer={{ value: elapsedTime, mode: practiceMode ? 'practice' : 'up' }}
      target={{ label: t('target'), value: puzzle.targetSum }}
    />
    
    <div className="game-board-area">
      <PuzzleBoard ... />
    </div>
    
    <div className="game-controls-area">
      <NumberInventory ... />
    </div>
    
    <GameFooter
      onUndo={nodeValuesHistory.undo}
      onRedo={nodeValuesHistory.redo}
      canUndo={nodeValuesHistory.canUndo}
      canRedo={nodeValuesHistory.canRedo}
      onReset={resetPuzzle}
      onNext={nextPuzzle}
      canProceed={showWin}
    />
  </GameShell>
</GameLayout>
```

---

### Phase 2: Playful Color Palette

#### 2.1 Update `palette.css`

```css
/* shared/styles/tokens/palette.css */

:root {
  /* === SHARED NEUTRALS === */
  --neutral-50: #fafaf9;
  --neutral-100: #f5f5f4;
  --neutral-200: #e7e5e4;
  --neutral-300: #d6d3d1;
  --neutral-400: #a8a29e;
  --neutral-500: #78716c;
  --neutral-600: #57534e;
  --neutral-700: #44403c;
  --neutral-800: #292524;
  --neutral-900: #1c1917;

  /* === SEMANTIC COLORS === */
  --success: #22c55e;
  --success-light: #bbf7d0;
  --error: #ef4444;
  --error-light: #fecaca;
  --warning: #f59e0b;
  --warning-light: #fef3c7;

  /* === PER-GAME PRIMARIES === */
  /* MagicGraph: Teal - calm, focused, mathematical */
  --game-magic: #14b8a6;
  --game-magic-light: #5eead4;
  --game-magic-dark: #0f766e;
  --game-magic-bg: #f0fdfa;
  --game-magic-bg-dark: #042f2e;

  /* SequenceRace: Violet - playful, competitive */
  --game-race: #8b5cf6;
  --game-race-light: #c4b5fd;
  --game-race-dark: #6d28d9;
  --game-race-bg: #f5f3ff;
  --game-race-bg-dark: #1e1b4b;

  /* ShapeArchitect: Orange - creative, building */
  --game-shape: #f97316;
  --game-shape-light: #fdba74;
  --game-shape-dark: #c2410c;
  --game-shape-bg: #fff7ed;
  --game-shape-bg-dark: #431407;
}

/* === LIGHT MODE (DEFAULT) === */
:root, [data-theme="light"] {
  --bg: var(--neutral-50);
  --bg-card: white;
  --bg-inset: var(--neutral-100);
  --surface: white;
  --border: var(--neutral-200);
  --text: var(--neutral-900);
  --text-secondary: var(--neutral-700);
  --muted: var(--neutral-500);
  
  /* Per-game tinted backgrounds */
  --game-bg-tint: var(--game-magic-bg);
}

/* === DARK MODE === */
[data-theme="dark"] {
  --bg: var(--neutral-900);
  --bg-card: var(--neutral-800);
  --bg-inset: var(--neutral-700);
  --surface: var(--neutral-800);
  --border: var(--neutral-700);
  --text: var(--neutral-50);
  --text-secondary: var(--neutral-300);
  --muted: var(--neutral-400);
  
  --game-bg-tint: var(--game-magic-bg-dark);
}

/* === GAME-SPECIFIC THEMING === */
[data-game="magic-graph"] {
  --accent: var(--game-magic);
  --accent-light: var(--game-magic-light);
  --game-bg-tint: var(--game-magic-bg);
}
[data-theme="dark"][data-game="magic-graph"],
[data-theme="dark"] [data-game="magic-graph"] {
  --game-bg-tint: var(--game-magic-bg-dark);
}

[data-game="sequence-race"] {
  --accent: var(--game-race);
  --accent-light: var(--game-race-light);
  --game-bg-tint: var(--game-race-bg);
}
[data-theme="dark"][data-game="sequence-race"],
[data-theme="dark"] [data-game="sequence-race"] {
  --game-bg-tint: var(--game-race-bg-dark);
}

[data-game="shape-architect"] {
  --accent: var(--game-shape);
  --accent-light: var(--game-shape-light);
  --game-bg-tint: var(--game-shape-bg);
}
[data-theme="dark"][data-game="shape-architect"],
[data-theme="dark"] [data-game="shape-architect"] {
  --game-bg-tint: var(--game-shape-bg-dark);
}
```

---

### Phase 3: Typography Update

#### 3.1 Install Vietnamese-friendly fonts

```bash
npm install @fontsource-variable/nunito @fontsource/be-vietnam-pro @fontsource/jetbrains-mono
```

#### 3.2 Update `type.css`

```css
/* shared/styles/tokens/type.css */

@import '@fontsource-variable/nunito';
@import '@fontsource/be-vietnam-pro/400.css';
@import '@fontsource/be-vietnam-pro/500.css';
@import '@fontsource/be-vietnam-pro/600.css';
@import '@fontsource/jetbrains-mono/400.css';
@import '@fontsource/jetbrains-mono/600.css';

:root {
  /* Font families */
  --font-display: 'Nunito Variable', system-ui, sans-serif;
  --font-body: 'Be Vietnam Pro', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Backward compatibility */
  --font-sans: var(--font-body);
  
  /* Scale */
  --text-xs: 0.75rem;     /* 12px */
  --text-sm: 0.875rem;    /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg: 1.25rem;     /* 20px */
  --text-xl: 1.5rem;      /* 24px */
  --text-2xl: 2rem;       /* 32px */
  --text-3xl: 2.5rem;     /* 40px */
  
  /* Line heights - generous for Vietnamese diacritics */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}

body {
  font-family: var(--font-body);
  line-height: var(--leading-relaxed);
}

h1, h2, h3, h4, h5, h6,
.font-display {
  font-family: var(--font-display);
  line-height: var(--leading-normal);
}

code, pre, kbd,
.font-mono {
  font-family: var(--font-mono);
}
```

---

### Phase 4: New Game Shell CSS

#### 4.1 Create `game-shell.css`

```css
/* shared/styles/game-shell.css */

/* === GAME SHELL CONTAINER === */
.game-shell {
  width: 100%;
  max-width: 460px;
  margin: 0 auto;
  background: var(--bg-card);
  border-radius: 1rem;
  border: 1px solid var(--border);
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* === HEADER STRIP === */
.game-header-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: var(--game-bg-tint);
  border-bottom: 1px solid var(--border);
  gap: 1rem;
}

.game-header-strip__progress,
.game-header-strip__target {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.game-header-strip__label {
  font-size: var(--text-xs);
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.game-header-strip__value {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--text);
}

.game-header-strip__value--accent {
  color: var(--accent);
}

.game-header-strip__timer {
  font-family: var(--font-mono);
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}

/* === BOARD AREA === */
.game-board-area {
  padding: 1.5rem;
  min-height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* === CONTROLS AREA === */
.game-controls-area {
  padding: 1rem;
  background: var(--bg-inset);
  border-top: 1px solid var(--border);
}

.game-controls-label {
  font-size: var(--text-xs);
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: center;
  margin-bottom: 0.75rem;
}

/* === FOOTER === */
.game-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-top: 1px solid var(--border);
  gap: 0.75rem;
}

.game-footer__secondary {
  display: flex;
  gap: 0.5rem;
}

.game-footer__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 2.75rem;
  padding: 0 1rem;
  border-radius: 0.75rem;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all 100ms ease;
  
  /* Default: ghost style */
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-secondary);
}

.game-footer__btn:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}

.game-footer__btn:active:not(:disabled) {
  transform: scale(0.97);
}

.game-footer__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.game-footer__btn--icon {
  width: 2.75rem;
  padding: 0;
}

.game-footer__btn--primary {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
  font-weight: 600;
}

.game-footer__btn--primary:hover:not(:disabled) {
  filter: brightness(1.1);
  border-color: var(--accent);
  color: white;
}

.game-footer__badge {
  font-size: var(--text-xs);
  background: var(--accent);
  color: white;
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
}

/* === TOUCH TARGETS === */
@media (pointer: coarse) {
  .game-footer__btn {
    height: 3rem;
    min-width: 3rem;
  }
}

/* === RESPONSIVE === */
@media (max-width: 480px) {
  .game-shell {
    border-radius: 0;
    border-left: none;
    border-right: none;
    max-width: 100%;
  }
  
  .game-header-strip {
    padding: 0.5rem 0.75rem;
  }
  
  .game-board-area {
    padding: 1rem;
    min-height: 240px;
  }
  
  .game-footer {
    flex-wrap: wrap;
  }
  
  .game-footer__secondary {
    width: 100%;
    justify-content: center;
    margin-bottom: 0.5rem;
  }
  
  .game-footer__btn--primary {
    flex: 1;
  }
}
```

---

## Migration Checklist

### Preparation
- [ ] Create feature branch: `refactor/playful-unified-layout`
- [ ] Install fonts: `npm install @fontsource-variable/nunito @fontsource/be-vietnam-pro @fontsource/jetbrains-mono`
- [ ] Backup current `palette.css` and `type.css`

### Phase 1: Layout Components
- [ ] Create `GameShell.tsx`
- [ ] Create `GameHeader.tsx` (rename from info panel pattern)
- [ ] Create `GameFooter.tsx`
- [ ] Create `game-shell.css`
- [ ] Update `shared/components/layout/index.ts` exports

### Phase 2: Colors
- [ ] Update `palette.css` with new token structure
- [ ] Test light/dark toggle via existing `ThemeContext`
- [ ] Verify per-game theming with `data-game` attribute

### Phase 3: Typography
- [ ] Add font imports to `type.css`
- [ ] Update `--font-display` and `--font-body` variables
- [ ] Test Vietnamese rendering in both modes

### Phase 4: Migrate MagicGraph
- [ ] Refactor `MagicGraphGame.tsx` to use new shell
- [ ] Remove `.mg-layout`, `.mg-sidebar` desktop grid CSS
- [ ] Keep `.mg-board`, `.mg-node`, `.mg-inventory` game-specific CSS
- [ ] Test on mobile, tablet, desktop
- [ ] Test with Vietnamese locale

### Phase 5: Migrate SequenceRace
- [ ] Same pattern as MagicGraph
- [ ] Preserve race track and step cards components

### Phase 6: Migrate ShapeArchitect
- [ ] Same pattern, but preserve 3D canvas sizing
- [ ] May need slightly larger max-width (500px) for 3D view

### Phase 7: Cleanup
- [ ] Remove unused CSS from `game-base.css`
- [ ] Remove `.game-layout-desktop` grid utilities
- [ ] Update Storybook stories
- [ ] Run E2E tests

---

## Files Changed Summary

| File | Change Type | Notes |
|------|-------------|-------|
| `shared/components/layout/GameShell.tsx` | New | Unified container |
| `shared/components/layout/GameHeader.tsx` | New | Compact info strip |
| `shared/components/layout/GameFooter.tsx` | New | Action bar |
| `shared/styles/game-shell.css` | New | Shell styling |
| `shared/styles/tokens/palette.css` | Modified | New color system |
| `shared/styles/tokens/type.css` | Modified | New fonts |
| `games/MagicGraph/MagicGraphGame.tsx` | Modified | Use new shell |
| `games/MagicGraph/MagicGraph.css` | Modified | Remove desktop grid |
| `games/SequenceRace/SequenceRaceGame.tsx` | Modified | Use new shell |
| `games/SequenceRace/SequenceRace.css` | Modified | Remove desktop grid |
| `games/ShapeArchitect/ShapeArchitectGame.tsx` | Modified | Use new shell |
| `games/ShapeArchitect/ShapeArchitect.css` | Modified | Remove desktop grid |
| `shared/styles/game-base.css` | Modified | Remove deprecated utilities |

---

## Visual Before/After

### MagicGraph - Before (Desktop)
```
┌─────────────────────────────────────────────────────────┐
│ [Header Bar]                                            │
├──────────────────────────────┬──────────────────────────┤
│                              │  ○ TÍNH GIỜ  ● LUYỆN TẬP │
│                              │                          │
│      [Graph Puzzle]          │       🧘 0:06 ⏸          │
│       (centered)             │                          │
│                              │  TỔNG MỤC TIÊU  CÂU ĐỐ   │
│                              │     15      Letter L 2/5 │
│                              │                          │
├──────────────────────────────┤   💡 CẦN TRỢ GIÚP?       │
│ CÁC SỐ CÓ SẴN:               │                          │
│ [3] [4] [5] [6] [7]          │   🔄 ĐẶT LẠI             │
│                              │   CÂU ĐỐ TIẾP →          │
└──────────────────────────────┴──────────────────────────┘
```

### MagicGraph - After (All Viewports)
```
┌────────────────────────────────────────┐
│  ┌──────────────────────────────────┐  │
│  │ Letter L    0:06    Mục tiêu: 15 │  │
│  │   2/5                            │  │
│  ├──────────────────────────────────┤  │
│  │                                  │  │
│  │         [Graph Puzzle]           │  │
│  │                                  │  │
│  ├──────────────────────────────────┤  │
│  │      CÁC SỐ CÓ SẴN               │  │
│  │  [3] [4] [5] [6̲] [7̲]             │  │
│  ├──────────────────────────────────┤  │
│  │ ↩️ ↪️  💡 Gợi ý  │  Tiếp tục →   │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

---

## Open Questions for You

1. **Default theme**: Light mode for young users? Or follow system preference?
2. **Game card max-width**: 460px feels right for MagicGraph — is ShapeArchitect's 3D canvas okay at this size?
3. **Hints drawer**: Keep as `SettingsDrawer` or integrate into shell?
4. **Sound toggle**: Keep in header or move to settings?
5. **Daily challenge banner**: Inside shell or above it?
