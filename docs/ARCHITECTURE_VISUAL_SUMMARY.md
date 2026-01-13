# Math Gymnasium - Consolidated Architecture & Visual Design Summary

## 1. System Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | React 19 + TypeScript 5.9 | Component-based UI with type safety |
| Bundler | Vite 7 | Fast development with code splitting |
| Routing | react-router-dom 7 | Client-side SPA navigation |
| Backend | Firebase (Firestore + Auth) | Optional cloud sync with offline-first design |
| i18n | react-i18next | English/Vietnamese bilingual support |
| Validation | Zod 4 | Runtime type validation for localStorage |
| 3D Graphics | Three.js + @react-three/fiber | ShapeArchitect voxel rendering |
| UI Components | shadcn/ui + Radix primitives | Accessible component library |

### Core Architecture Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                        React App                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   PlayerContext                      │    │
│  │  - Manages player state (stats, rank, achievements) │    │
│  │  - Coordinates localStorage + Firestore sync         │    │
│  └─────────────────────────────────────────────────────┘    │
│              │                           │                   │
│              ▼                           ▼                   │
│  ┌──────────────────┐       ┌──────────────────────────┐    │
│  │  TypedStorage    │       │  Firebase SyncManager    │    │
│  │  (localStorage)  │       │  - 2s debounce           │    │
│  │  PRIMARY         │       │  - Offline queue         │    │
│  └──────────────────┘       └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**Key Architecture Decisions:**
- **localStorage-first**: All data saves locally immediately, syncs to Firestore in background
- **Non-blocking auth**: Users play as guests, optional Google sign-in
- **Module isolation**: Each game is self-contained with its own routing and lazy-loaded bundle

### Game Module Structure

Each game follows a consistent pattern:
```
games/[GameName]/
├── logic/                    # Pure TypeScript (no React)
│   ├── types.ts              # Type definitions
│   ├── engine.ts             # Core game logic
│   ├── solver.ts             # Algorithm (if applicable)
│   └── presets.ts            # Level configurations
├── components/               # React UI components
├── hooks/                    # Game-specific hooks
├── [GameName]Game.tsx        # Main game container
└── index.ts                  # Barrel export
```

### Bundle Sizes (Production)

| Bundle | Size | Contents |
|--------|------|----------|
| Core | ~1 MB | React, router, i18n, shared components |
| MagicGraph | ~20 KB | Graph puzzle logic + UI |
| SequenceRace | ~40 KB | AI engine (minimax) + game UI |
| ShapeArchitect | ~370 KB | Three.js + 3D rendering |

---

## 2. Visual Design System: "Vietnamese Premium"

The design follows a **dark-first, credit card aesthetic** optimized for elegance and mobile-friendliness.

### Color Palette

```css
/* Backgrounds */
--bg-primary: #0d1b2a;    /* Deep navy base */
--bg-secondary: #1b263b;  /* Card backgrounds */

/* Vietnamese Accents */
--accent-gold: #d4af37;   /* Primary accent (gold) */
--accent-emerald: #10b981; /* Success states */
--accent-coral: #f97316;  /* Warnings */
--accent-lotus: #e11d48;  /* Errors */

/* Text */
--text-primary: #f1f5f9;  /* Main text */
--text-muted: #64748b;    /* Secondary text */
--border: #334155;        /* Borders */
```

### Typography

| Purpose | Font | Style |
|---------|------|-------|
| Display/Headings | Crimson Pro | Vietnamese-friendly serif |
| UI/Data | Space Grotesk | Modern geometric sans-serif |

### Two Surface Types

The design system splits elements into two visual categories:

| Surface Type | Used For | Styling Rules |
|--------------|----------|---------------|
| **Editorial (flat)** | Buttons, inputs, labels, game boards | No gradients, no shadows, border-radius ≤2px |
| **Premium (credit card)** | Cards, modals, navigation, achievements | Gradients allowed, 8px radius, soft shadows |

### Premium Surface Tokens

```css
--card-gradient: linear-gradient(135deg, #1b263b 0%, #0d1b2a 50%, #1b263b 100%);
--card-radius: 8px;
--card-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
--gold-gradient: linear-gradient(90deg, #d4af37 0%, #f5d67a 50%, #d4af37 100%);
--text-emboss: 0 1px 0 rgba(255,255,255,0.1), 0 -1px 0 rgba(0,0,0,0.3);
```

### Premium Surface Features

- **Diagonal shine animation**: Credit card light reflection on hover
- **Gold border variants**: Holographic-inspired metallic edges
- **Vietnamese corner decorations**: L-shaped gold accent corners
- **Embossed text effects**: Subtle 3D text treatment
- All effects respect `prefers-reduced-motion`

---

## 3. Page Visual Presentation

### Dashboard

The main hub uses a **tabbed layout** with four views:

| Tab | Visual Content |
|-----|----------------|
| **Play** | Grid of game cards + Daily Challenge banner |
| **Stats** | Overall stats, rank progress bar, per-game breakdown |
| **Achievements** | Full gallery by category with unlock states |
| **Learn** | Educational content cards and game tutorials |

**Header (CompactHeader):**
- Rank badge with gold accent
- Player name display
- Streak indicator
- Settings gear button

**Responsive behavior:**
- Icons-only on mobile (<600px)
- Full labels on tablet+
- Tab animations with fade-in

---

## 4. Game Visual Presentations

### MagicGraph: Mystical Constellation Puzzle

**Visual Theme:** Graph nodes as star constellations on a deep navy background

**Core Visual Elements:**

| Element | Visual Treatment |
|---------|-----------------|
| **Nodes** | Circular buttons with number slots, glow on hover |
| **Lines** | Connecting paths between nodes with color-coded status |
| **Number Pool** | Draggable chips in available numbers area |
| **Target Sum** | Prominent display at top of puzzle |

**Traffic Light Feedback System:**

| Line Color | Status | Meaning |
|------------|--------|---------|
| **Gray** | Incomplete | Line has empty nodes |
| **Green** | Correct | Line complete and sums to target |
| **Orange** | Overflow | Partial sum already exceeds target |
| **Red** | Incorrect | Line complete but wrong sum |

**Interactions:**
- Drag-and-drop numbers onto nodes
- Click placed numbers to return to pool
- Visual feedback flashes on placement

**Difficulty Progression:**

| Level | Shapes | Visual Complexity |
|-------|--------|-------------------|
| Easy | Lines, Crosses | 3-5 nodes, 1-2 lines |
| Medium | Triangles, Diamonds | 6-9 nodes, multiple shared nodes |
| Hard | Magic Squares | 9 nodes in 3×3 grid, 6+ lines |
| Master/Grandmaster | Complex graphs | Hidden target, optimization challenges |

---

### SequenceRace: Track & Field Number Sprint

**Visual Theme:** Race track with runners competing to reach a target

**Core Visual Elements:**

| Element | Visual Treatment |
|---------|-----------------|
| **Race Track** | Horizontal track with numbered positions |
| **Player Runner** | Visual marker at current position |
| **AI Runner** | Opponent marker (when playing vs AI) |
| **Step Cards** | Selectable number chips from sequence pool |
| **History Log** | Scrollable list of previous moves |
| **Target Flag** | Finish line indicator at target number |

**Game Modes:**
- **vs AI**: Single player against computer (Easy/Medium/Hard)
- **Two Player**: Local multiplayer on same device

**Visual Feedback:**
- Selected step highlights before confirmation
- Position updates animate along track
- Win/lose overlays with game summary
- Teacher mode shows optimal move analysis

**Sequence Types (visual variety in step pools):**

| Type | Display Name | Example Steps |
|------|--------------|---------------|
| Arithmetic | Counting Numbers | 1, 2, 3, 4, 5 |
| Geometric | Powers of 2 | 1, 2, 4, 8, 16 |
| Fibonacci | Fibonacci | 1, 1, 2, 3, 5, 8 |
| Prime | Prime Numbers | 2, 3, 5, 7, 11 |
| Square | Perfect Squares | 1, 4, 9, 16, 25 |
| Triangular | Triangular Numbers | 1, 3, 6, 10, 15 |
| Powers of 3 | Powers of 3 | 1, 3, 9, 27, 81 |

---

### ShapeArchitect: Building Workshop

**Visual Theme:** Woodworking workshop with blueprint grids and colorful blocks

**Core Visual Elements:**

| Element | Visual Treatment |
|---------|-----------------|
| **Workbench Background** | Wood grain texture creating craftsman's workspace |
| **Blueprint Grid** | Target cells with white lines on blue pattern |
| **Piece Tray** | Inventory of available tetromino/pentomino pieces |
| **Colored Blocks** | Vibrant distinct colors per piece type |
| **3D Canvas** | Three.js rendered isometric/perspective view |
| **Layer Controls** | Visibility slider for 3D puzzles |

**View Modes:**
- **2D Mode**: Top-down grid view for simpler puzzles
- **3D Mode**: Isometric view with camera controls (isometric, top, front, side)

**Visual Feedback:**

| State | Visual |
|-------|--------|
| Target cells | Blue with blueprint pattern |
| Valid ghost | Blue semi-transparent preview |
| Invalid ghost | Red semi-transparent (blocked placement) |
| Placed piece | Solid color matching piece |
| Snap animation | Wobble + dust burst particles |

**Piece Types:**
- **Tetrominoes (7 pieces)**: I, O, T, S, Z, J, L - the classic Tetris shapes
- **Pentominoes (12 pieces)**: F, I, L, N, P, T, U, V, W, X, Y, Z - for harder levels
- **Polycubes (3D)**: Corner3D, Tower, L3D, Cube2x2x2 - for 3D challenges

**Rotation System:**
- 2D levels: Z-axis only (4 orientations)
- 3D levels: X, Y, Z axes (24 possible orientations)
- Keyboard shortcuts: R (Z-axis), T (X-axis), Y (Y-axis)

---

## 5. Shared Visual Components

### Overlay System

**BottomSheet**: Mobile-first modal that renders as:
- Bottom sheet on mobile (swipe-to-dismiss)
- Centered modal on desktop
- Focus trap for accessibility

**VictoryModal**: Unified game-end overlay with variants:
- `win` - Green success state
- `lose` - Red failure state
- `timeUp` - Amber timeout state

**SettingsDrawer**: Progressive disclosure pattern:

| Always Visible | Hidden in Drawer |
|----------------|------------------|
| Timer, Game info | Difficulty selector |
| Undo/Redo, Hints | Mode toggle |
| Main actions | New game, Editor, Rules |

### Animation Philosophy

**Minimal feedback only** - no idle animations, no playful theming:
- Flash feedback: `flash-success` (green), `flash-warning` (amber)
- All flashes are one-time, 0.3s duration
- **NO** float, wiggle, pulse, or permanent glow effects
- **NO** translateY hover lifts (use opacity/border-color only)
- All animations use GPU-composited properties: `transform`, `opacity`, `filter`
- Respects `prefers-reduced-motion`

---

## 6. Design Philosophy Summary

1. **Vietnamese Premium** = Dark-first + Gold accents + Credit card surfaces
2. **Two surface types** prevent visual confusion (flat for interaction, premium for containers)
3. **Each game has a distinct visual identity** while sharing the core design system
4. **Mobile-first** with progressive enhancement for desktop
5. **Accessibility-first** with reduced motion support and keyboard navigation
