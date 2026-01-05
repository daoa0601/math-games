# Game CSS Refactor: Extract & Minimize

> **FOR CLAUDE CODE**: Use `frontend-design` skill for CSS architecture patterns. Query Context7 MCP for BEM methodology, CSS extraction patterns, and component library structures.

> **Goal**: Reduce each game CSS to ~180-250 lines by extracting shared patterns. Games need distinct visual identity, so targets are realistic, not aggressive.

---

## Tools Available

| Tool/Skill | Use For |
|------------|---------|
| `frontend-design` | CSS architecture, component patterns, responsive design |
| Context7 MCP | Research BEM naming, CSS modules, shared style extraction |
| `grep` / `wc -l` | Verify extraction completeness and file sizes |
| Batch file editing | Rename classes across multiple files simultaneously |

---

## ⚠️ CRITICAL: EXTRACT, DON'T DUPLICATE

Each game currently contains its own copy of shared components. Extract these to `src/shared/styles/game-base.css` first.

---

## Step 1: Create `game-base.css`

**Path**: `src/shared/styles/game-base.css`  
**Target**: ~200 lines

### Components to Extract

```css
/* Game Info Panel - used by ALL games */
.game-info-panel { }
.game-info-panel__item { }
.game-info-panel__label { }
.game-info-panel__value { }
.game-info-panel__value--player { color: var(--success); }
.game-info-panel__value--ai { color: #ef4444; }

/* Mode Toggle - used by MagicGraph, SequenceRace */
.mode-toggle { }
.mode-toggle__btn { }
.mode-toggle__btn--active { }

/* Game Modal/Overlay - used by ALL games */
.game-modal { }
.game-modal__backdrop { }
.game-modal__header { }
.game-modal__title { }
.game-modal__title--win { color: var(--success); }
.game-modal__title--lose { color: #ef4444; }
.game-modal__content { }
.game-modal__actions { }

/* Math Insight - used by SequenceRace, ShapeArchitect */
.math-insight { }
.math-insight h4 { }
.math-insight p { }
.math-insight strong { }

/* Level Info - used by MagicGraph, ShapeArchitect */
.level-info { }
.level-info__item { }
.level-info__label { }
.level-info__value { }

/* Win/Game Over Overlay - ALL games */
.game-over-overlay { }
.game-over-overlay__title { }
.game-over-overlay__emoji { }

/* Shared Responsive */
@media (pointer: coarse) { /* touch targets */ }
@media (max-width: 600px) { /* mobile layout */ }
@media (max-width: 360px) { /* small phones */ }
@media (prefers-reduced-motion: reduce) { /* a11y */ }
```

---

## Step 2: Minimize Each Game CSS

After extraction, each game should only contain **unique** components.

### MagicGraph.css

**Current**: 358 lines → **Target**: 200 lines

| Component | Lines | Purpose |
|-----------|-------|--------|
| `.puzzle-board` | 15 | SVG container |
| `.puzzle-node` + states | 40 | Circle nodes with selection |
| `.puzzle-line` + states | 25 | Connecting lines |
| `.number-inventory` + chips | 30 | Number selection UI |
| `.number-picker` modal | 20 | Grid picker overlay |
| Topology editor | 50 | Grandmaster mode |
| Responsive | 20 | Mobile adjustments |

**Keep only**:
- `.puzzle-container`
- `.puzzle-board` (SVG container)
- `.puzzle-node`, `.puzzle-node__circle`, `.puzzle-node__text`
- `.puzzle-line`, `.puzzle-line--correct`, `.puzzle-line--overflow`
- `.number-inventory`, `.number-chip`
- `.number-picker` (modal grid)
- `.topology-editor` (grandmaster mode)

**Delete** (now in game-base.css):
- `.game-info-panel` variants → use base
- `.game-modal` variants → use base
- Responsive breakpoints → use base

---

### SequenceRace.css

**Current**: 290 lines → **Target**: 180 lines

| Component | Lines | Purpose |
|-----------|-------|--------|
| `.race-track` + markers | 30 | Track visualization |
| `.player-avatar` | 20 | Position markers |
| `.stick-figure` | 50 | CSS animated runner |
| `.step-cards` | 25 | Move selection buttons |
| `.history-log` | 15 | Move history |
| `.turn-indicator` | 10 | Whose turn display |
| `.sequence-badge` | 10 | Sequence type display |
| Responsive | 20 | Mobile adjustments |

**Keep only**:
- `.sequence-container`
- `.race-track`, `.track-wrapper`, `.track-line`, `.track-markers`
- `.player-avatar`, `.stick-figure` (CSS runner)
- `.preview-marker` (ghost position)
- `.step-cards`, `.step-card`
- `.history-log`, `.history-entry`
- `.turn-indicator`
- `.sequence-badge`
- `.ai-reaction`

**Delete** (now in game-base.css):
- `.game-info-panel` → use base
- `.mode-toggle` → use base
- `.game-over-overlay` → use base
- `.math-insight` → use base
- Touch/mobile breakpoints → use base

---

### ShapeArchitect.css

**Current**: 442 lines → **Target**: 250 lines

| Component | Lines | Purpose |
|-----------|-------|--------|
| `.grid-board` + cells | 40 | 2D grid |
| `.ghost-overlay` | 25 | Placement preview |
| `.piece-inventory` + cards | 35 | Piece selection |
| `.isometric-preview` | 20 | 3D piece preview |
| `.rotate-btn` | 15 | Rotation controls |
| `.view-mode-toggle` | 10 | 2D/3D switch |
| `.camera-presets` | 25 | 3D camera angles |
| 3D-specific styles | 40 | Three.js canvas |
| Responsive | 25 | Mobile adjustments |

**Keep only**:
- `.shape-container`
- `.grid-board`, `.grid-cell`, `.grid-cell--target`, `.grid-cell--filled`
- `.ghost-overlay`, `.ghost-cell`
- `.piece-inventory`, `.piece-card`, `.piece-preview`
- `.isometric-preview` (3D piece preview)
- `.rotate-btn`
- `.view-mode-toggle` (2D/3D switch)
- `.camera-presets` (3D camera angles)
- `.grid-board-3d`, `.view-3d-controls`
- `.placement-controls`

**Delete** (now in game-base.css):
- `.level-info` → use base
- `.shape-win-overlay` → rename to `.game-over-overlay`
- `.math-insight` → use base
- Responsive breakpoints (shared) → use base

---

## Step 3: Import Order

Update each game's CSS import:

```css
/* MagicGraph.css */
@import '@/shared/styles/game-base.css';

/* Only game-specific styles below */
.puzzle-container { ... }
```

Or import in the component:

```tsx
// MagicGraphGame.tsx
import '@/shared/styles/game-base.css';
import './MagicGraph.css';
```

---

## File Size Verification

After refactor, run:

```bash
wc -l src/shared/styles/game-base.css
wc -l src/games/*/[A-Z]*.css
```

Expected output:
```
  200 src/shared/styles/game-base.css
  200 src/games/MagicGraph/MagicGraph.css
  180 src/games/SequenceRace/SequenceRace.css
  250 src/games/ShapeArchitect/ShapeArchitect.css
```

**Total**: ~830 lines (current: ~1360, previous: ~3000)

### Current Status

| File | Current | Target | Gap |
|------|---------|--------|-----|
| `game-base.css` | 272 | 200 | -72 |
| `MagicGraph.css` | 358 | 200 | -158 |
| `SequenceRace.css` | 290 | 180 | -110 |
| `ShapeArchitect.css` | 442 | 250 | -192 |

---

## Grep Verification

After refactor, these should match:

```bash
# Shared patterns should only exist in game-base.css
grep -l "game-info-panel" src/**/*.css
# Expected: only game-base.css

grep -l "game-modal" src/**/*.css
# Expected: only game-base.css

grep -l "math-insight" src/**/*.css
# Expected: only game-base.css
```

---

## Component Rename Map

Standardize class names across games:

| Old (per-game) | New (shared) |
|----------------|--------------|
| `.puzzle-info` | `.game-info-panel` |
| `.level-info` | `.game-info-panel` |
| `.shape-win-overlay` | `.game-over-overlay` |
| `.win-overlay` | `.game-over-overlay` |
| `.game-modal` | `.game-modal` (keep) |
