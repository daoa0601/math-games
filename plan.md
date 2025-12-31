# Math Games - Future Enhancements

This document tracks remaining features and enhancements to be implemented.

---

## MagicGraph

### Web Worker for Solver
- Create `src/games/MagicGraph/workers/solver.worker.ts`
- Move heavy computation off main thread
- Show loading indicator during complex puzzle generation

### Grandmaster Mode
- Optimization puzzles: minimize/maximize target sum
- Add `GameMode = 'classic' | 'grandmaster'`
- Create `findOptimalSum()` function in solver

### Custom Topology Editor
- Create `src/games/MagicGraph/components/TopologyEditor.tsx`
- Click to add nodes, shift+drag to create lines
- Validate custom graphs are solvable
- Save to localStorage (`math-games-custom-graphs`)

---

## SequenceRace

### Two-Player Local Mode
- Add `GameMode = 'vs-ai' | 'vs-human'`
- Mode toggle in level selector UI
- Color-code players (blue/red)

### Extract SequenceInfoBadge Component
- Create `src/games/SequenceRace/components/SequenceInfoBadge.tsx`
- Replace duplicate usages in SequenceRaceGame.tsx
- Support variants: `badge`, `hint`, `full`

---

## ShapeArchitect

### 3D Mode with React Three Fiber
- Create `src/games/ShapeArchitect/components/Grid3D.tsx`
- Use `@react-three/fiber` Canvas with OrbitControls
- Create 3D-specific preset levels with depth > 1
- Add mode toggle (2D/3D)

### Custom Level Editor
- Create `src/games/ShapeArchitect/components/LevelEditor.tsx`
- Toggle cells to create target shape
- Select pieces from palette
- Real-time volume validation
- Save to localStorage (`math-games-custom-levels`)

---

## Polish & Accessibility

### Mobile Touch Optimization
- Increase touch targets (min 44x44px)
- Replace hover with long-press for previews
- Add swipe gestures for rotation
- Use `@media (hover: none)` for touch styles

### Keyboard Shortcuts
- Create `src/shared/hooks/useKeyboardShortcuts.ts`
- R = rotate (ShapeArchitect)
- Escape = close modals/deselect
- Arrow keys for navigation

### Accessibility
- Add ARIA labels to interactive elements
- Implement keyboard navigation
- Add high contrast mode option
- Support `prefers-contrast: high` media query
