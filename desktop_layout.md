# Desktop Layout Implementation Plan

> **FOR CLAUDE CODE**: Use `frontend-design` skill for responsive patterns. Query Context7 MCP for CSS Grid, Flexbox layout patterns, and responsive design best practices.

---

## Current State Analysis

### ✅ What's Already Implemented

| Component | Mobile | Tablet | Desktop | Notes |
|-----------|--------|--------|---------|-------|
| `index.css` base | ✅ | ✅ | ⚠️ Partial | Has breakpoints but limited desktop styles |
| Bottom navigation | ✅ | ✅ | ⚠️ Stays bottom | Should move to top/sidebar on desktop |
| Dashboard grid | ✅ | ✅ | ✅ | 2-col at 1024px, 3-col at 1280px |
| MagicGraph | ✅ | ⚠️ | ⚠️ | Only container width changes |
| SequenceRace | ✅ | ⚠️ | ❌ | No desktop adaptation |
| ShapeArchitect | ✅ | ⚠️ | ⚠️ | Controls stack on all sizes |
| Game modals | ✅ | ✅ | ✅ | Fixed width, centered |

### Breakpoint Reference

```css
--bp-sm: 480px;   /* Large phones */
--bp-md: 768px;   /* Tablets */
--bp-lg: 1024px;  /* Desktop */
--bp-xl: 1280px;  /* Large desktop */
--bp-2xl: 1536px; /* Extra large */
```

---

## Phase 1: Shared Desktop Utilities

**File**: `src/shared/styles/game-base.css`  
**Priority**: HIGH  
**Estimated Lines**: +40 lines

### Add Desktop Layout Utilities

```css
/* ----------------------------------------
   Desktop Layout Utilities
   ---------------------------------------- */

/* Visibility helpers */
.desktop-only { display: none; }
.mobile-only { display: block; }

@media (min-width: 1024px) {
  .desktop-only { display: block; }
  .mobile-only { display: none; }
}

/* Flex variants */
.desktop-row {
  display: flex;
  flex-direction: column;
}

@media (min-width: 1024px) {
  .desktop-row {
    flex-direction: row;
    gap: var(--space-xl);
  }
}

/* Game layout wrapper - side-by-side on desktop */
.game-layout {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  width: 100%;
}

@media (min-width: 1024px) {
  .game-layout {
    flex-direction: row;
    align-items: flex-start;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .game-layout__main {
    flex: 1;
    max-width: 700px;
  }
  
  .game-layout__sidebar {
    width: 320px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    position: sticky;
    top: var(--space-lg);
  }
}
```

---

## Phase 2: Navigation Refactor

**File**: `src/index.css`  
**Priority**: MEDIUM  
**Estimated Lines**: +30 lines

### Desktop Navigation Options

#### Option A: Top Navigation (Recommended)

```css
/* Desktop: Move navigation to top */
@media (min-width: 1024px) {
  .nav {
    position: fixed;
    top: 0;
    bottom: auto;
    height: 56px;
    border-top: none;
    border-bottom: 1px solid var(--border);
    padding-bottom: 0;
  }
  
  .page {
    padding-top: 72px; /* Nav height + spacing */
    padding-bottom: var(--space-xl);
  }
  
  .nav__item {
    flex-direction: row;
    gap: var(--space-sm);
  }
}
```

#### Option B: Sidebar Navigation (Alternative)

```css
/* Desktop: Convert to sidebar */
@media (min-width: 1024px) {
  body {
    display: flex;
  }
  
  .nav {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: 72px;
    height: 100vh;
    flex-direction: column;
    justify-content: flex-start;
    padding: var(--space-xl) var(--space-sm);
    border-top: none;
    border-right: 1px solid var(--border);
  }
  
  .page {
    margin-left: 72px;
    padding-bottom: var(--space-xl);
  }
}
```

---

## Phase 3: Game-Specific Desktop Layouts

### 3.1 MagicGraph Desktop

**File**: `src/games/MagicGraph/MagicGraph.css`  
**Lines to Add**: +50 lines

```css
/* ========================================
   DESKTOP LAYOUT
   ======================================== */
@media (min-width: 1024px) {
  .mg-container {
    flex-direction: row;
    align-items: flex-start;
    max-width: 1000px;
    gap: var(--space-xl);
  }
  
  /* Main puzzle area */
  .mg-board-wrapper {
    flex: 1;
    max-width: 600px;
  }
  
  /* Sidebar with controls */
  .mg-sidebar {
    width: 280px;
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    position: sticky;
    top: 80px; /* Below top nav */
  }
  
  /* Level selector as vertical list */
  .mg-levels {
    flex-direction: column;
    align-items: stretch;
  }
  
  .mg-level {
    text-align: left;
    justify-content: flex-start;
  }
  
  /* Inventory as compact grid */
  .mg-inventory {
    gap: var(--space-xs);
  }
  
  .mg-chip {
    width: 36px;
    height: 36px;
    font-size: var(--text-sm);
  }
  
  /* Actions in sidebar */
  .mg-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .mg-actions .action {
    width: 100%;
  }
}
```

**Component Changes Required**:
- Wrap controls in a new `<div className="mg-sidebar">` element
- Structure: `mg-container` → `mg-board-wrapper` + `mg-sidebar`

---

### 3.2 SequenceRace Desktop

**File**: `src/games/SequenceRace/SequenceRace.css`  
**Lines to Add**: +60 lines

```css
/* ========================================
   DESKTOP LAYOUT
   ======================================== */
@media (min-width: 1024px) {
  .sr-container {
    flex-direction: row;
    align-items: flex-start;
    max-width: 1100px;
    gap: var(--space-xl);
  }
  
  /* Main track takes most space */
  .sr-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }
  
  .sr-track {
    width: 100%;
  }
  
  .sr-track__wrapper {
    height: 140px; /* Taller on desktop */
  }
  
  .sr-avatar {
    width: 56px;
    height: 56px;
    font-size: 1.75rem;
  }
  
  /* Sidebar with controls and history */
  .sr-sidebar {
    width: 300px;
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    position: sticky;
    top: 80px;
  }
  
  /* Step cards in vertical stack */
  .sr-steps {
    flex-direction: column;
    width: 100%;
  }
  
  .sr-step {
    width: 100%;
    height: 64px;
    flex-direction: row;
    justify-content: space-between;
    padding: 0 var(--space-lg);
  }
  
  .sr-step__label {
    order: -1;
  }
  
  /* History log taller */
  .sr-history {
    max-height: 250px;
  }
  
  /* Turn indicator prominent */
  .sr-turn {
    width: 100%;
    text-align: center;
    padding: var(--space-md);
  }
}
```

**Component Changes Required**:
- Add `sr-main` wrapper around track
- Add `sr-sidebar` wrapper around controls, history, and step cards

---

### 3.3 ShapeArchitect Desktop

**File**: `src/games/ShapeArchitect/ShapeArchitect.css`  
**Lines to Add**: +70 lines

```css
/* ========================================
   DESKTOP LAYOUT
   ======================================== */
@media (min-width: 1024px) {
  .sa-container {
    flex-direction: row;
    align-items: flex-start;
    max-width: 1200px;
    gap: var(--space-xl);
  }
  
  /* Main board area */
  .sa-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    max-width: 700px;
  }
  
  .sa-board {
    width: 100%;
  }
  
  .sa-cell {
    width: 56px;
    height: 56px;
  }
  
  .sa-board-3d {
    width: 100%;
    max-width: 650px;
    min-height: 450px;
  }
  
  /* Right sidebar with inventory and controls */
  .sa-sidebar {
    width: 350px;
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    position: sticky;
    top: 80px;
  }
  
  /* Inventory as vertical scrollable list */
  .sa-inventory {
    flex-direction: column;
    max-height: 400px;
    overflow-y: auto;
    gap: var(--space-md);
  }
  
  .sa-card {
    flex-direction: row;
    width: 100%;
    padding: var(--space-md) var(--space-lg);
  }
  
  .sa-card__clickable {
    flex-direction: row;
    width: 100%;
  }
  
  .sa-preview {
    flex-shrink: 0;
  }
  
  .sa-card__name {
    flex: 1;
    text-align: left;
    margin-left: var(--space-md);
  }
  
  /* 3D controls in compact row */
  .sa-3d-controls {
    flex-direction: row;
    flex-wrap: wrap;
    background: var(--surface);
    padding: var(--space-md);
    border: 1px solid var(--border);
  }
  
  /* Layer control full width in sidebar */
  .sa-layer {
    width: 100%;
  }
}

/* Extra large: 3-column layout */
@media (min-width: 1536px) {
  .sa-container {
    max-width: 1400px;
  }
  
  /* Left panel for 3D controls */
  .sa-controls-panel {
    width: 280px;
    order: -1;
  }
  
  .sa-main {
    max-width: 800px;
  }
  
  .sa-cell {
    width: 64px;
    height: 64px;
  }
}
```

**Component Changes Required**:
- Add `sa-main` wrapper around board
- Add `sa-sidebar` wrapper around inventory and controls
- Optional: `sa-controls-panel` for 3-column layout

---

## Phase 4: Game Container Updates

**File**: `src/index.css`  
**Lines to Modify**: ~10 lines

```css
/* Game container - responsive */
.game-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: var(--space-lg);
  background: var(--bg);
}

@media (min-width: 1024px) {
  .game-container {
    padding: var(--space-xl) var(--space-2xl);
    max-width: 1400px;
    margin: 0 auto;
  }
}

.game-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: var(--space-lg);
  border-bottom: 1px solid var(--border);
  margin-bottom: var(--space-lg);
}

@media (min-width: 1024px) {
  .game-header {
    max-width: 1200px;
    margin: 0 auto var(--space-xl);
    width: 100%;
  }
  
  .game-header__title {
    font-size: var(--text-2xl);
  }
}
```

---

## Phase 5: Component Structure Changes

### Required TSX Changes

Each game component needs structural updates to support the new layout:

#### MagicGraph.tsx

```tsx
// Current structure
<div className="mg-container">
  <div className="mg-levels">...</div>
  <div className="mg-board-wrapper">...</div>
  <div className="mg-inventory">...</div>
  <div className="mg-actions">...</div>
</div>

// New structure
<div className="mg-container">
  <div className="mg-board-wrapper">...</div>
  <div className="mg-sidebar">
    <div className="mg-levels">...</div>
    <div className="mg-inventory">...</div>
    <div className="mg-actions">...</div>
  </div>
</div>
```

#### SequenceRace.tsx

```tsx
// Current structure
<div className="sr-container">
  <div className="sr-badge">...</div>
  <div className="sr-track">...</div>
  <div className="sr-turn">...</div>
  <div className="sr-steps">...</div>
  <div className="sr-history">...</div>
</div>

// New structure
<div className="sr-container">
  <div className="sr-main">
    <div className="sr-badge">...</div>
    <div className="sr-track">...</div>
  </div>
  <div className="sr-sidebar">
    <div className="sr-turn">...</div>
    <div className="sr-steps">...</div>
    <div className="sr-history">...</div>
  </div>
</div>
```

#### ShapeArchitect.tsx

```tsx
// Current structure
<div className="sa-container">
  <div className="sa-board">...</div>
  <div className="sa-3d-controls">...</div>
  <div className="sa-inventory">...</div>
</div>

// New structure
<div className="sa-container">
  <div className="sa-main">
    <div className="sa-board">...</div>
  </div>
  <div className="sa-sidebar">
    <div className="sa-3d-controls">...</div>
    <div className="sa-inventory">...</div>
  </div>
</div>
```

---

## Verification Checklist

After implementation, verify:

```bash
# Check no horizontal scroll on any viewport
# Test at these widths: 375px, 768px, 1024px, 1280px, 1536px

# Run dev server
npm run dev

# Browser testing checklist:
# [ ] Mobile (375px): All elements stack vertically
# [ ] Tablet (768px): Slightly larger touch targets
# [ ] Desktop (1024px): Side-by-side layout activates
# [ ] Large (1280px): Maximum content width applies
# [ ] Navigation moves appropriately per breakpoint
# [ ] Sticky sidebar works during scroll
# [ ] Controls remain accessible on all sizes
```

---

## Implementation Order

| Order | Task | File(s) | Effort |
|-------|------|---------|--------|
| 1 | Add desktop utilities | `game-base.css` | Easy |
| 2 | Navigation refactor | `index.css` | Medium |
| 3 | Game container updates | `index.css` | Easy |
| 4 | MagicGraph desktop layout | CSS + TSX | Medium |
| 5 | SequenceRace desktop layout | CSS + TSX | Medium |
| 6 | ShapeArchitect desktop layout | CSS + TSX | Hard |
| 7 | Cross-browser testing | — | Medium |

---

## Design Reference

**Target Aesthetic**: Linear App + Vercel Dashboard

- Desktop: Clean side-by-side layout
- Controls in sticky sidebar
- Game board as primary focus
- Navigation as minimal top bar
- Maximum content width: 1200-1400px
- Generous whitespace on large screens

---

## File Size Impact

| File | Current | After Desktop | Change |
|------|---------|---------------|--------|
| `game-base.css` | 419 lines | ~460 lines | +40 |
| `index.css` | 383 lines | ~420 lines | +37 |
| `MagicGraph.css` | 379 lines | ~430 lines | +50 |
| `SequenceRace.css` | 269 lines | ~330 lines | +60 |
| `ShapeArchitect.css` | 443 lines | ~515 lines | +70 |

**Total increase**: ~260 lines across all files
