# Math Gymnasium - Tasks

## Remaining Work

### Magic Graph
- [ ] Web Worker for solver (prevent UI blocking on complex puzzles)
- [ ] Grandmaster mode (optimization: minimize/maximize target sum)
- [ ] Custom topology editor

### Sequence Sprinter
- [ ] Two-player local multiplayer mode
- [ ] Extract SequenceInfoBadge component (reduce duplication)

### Shape Architect
- [ ] 3D Mode with @react-three/fiber
- [ ] Custom level editor

### Polish
- [ ] Sound effects files (infrastructure complete, audio files needed in `public/sounds/`)
- [ ] Mobile touch optimization
- [ ] Keyboard shortcuts (R for rotate, arrows for selection)
- [ ] Accessibility (ARIA labels, high contrast mode)

---

## Recently Completed (Dec 2025 - Latest Session)

### Testing Infrastructure ✅
- [x] Vitest + React Testing Library setup
- [x] 74 unit tests across 4 test files
- [x] Coverage reporting configured

### New Sequence Types ✅
- [x] Triangular numbers: 1, 3, 6, 10, 15...
- [x] Powers of 3: 1, 3, 9, 27...
- [x] 4 new preset games using these sequences

### Additional Pentominoes ✅
- [x] Added 8 new pentominoes: I, L, N, T, V, X, Y, Z
- [x] 2 new expert-level puzzles

### Undo Last Piece (ShapeArchitect) ✅
- [x] `removePieceFromGrid` engine function
- [x] Undo button in UI
- [x] i18n translations (EN/VI)

### Win Animations ✅
- [x] canvas-confetti integration
- [x] Added to all 3 games

### Sound Placeholder Infrastructure ✅
- [x] `src/shared/utils/audio.ts` with Howler.js
- [x] `SOUNDS.md` documentation
- [x] `public/sounds/` directory ready

---

## Previously Completed (Dec 2025)

### Magic Graph
- [x] Hidden Target Mode (master difficulty)
- [x] Advanced Hint Engine (Auditor, Starter, Algebraist)
- [x] Simplified node interaction (click → pick)
- [x] Undo/redo with keyboard shortcuts

### Sequence Sprinter
- [x] Teacher Mode Hints
- [x] First-Player Win Validation
- [x] Minimax Depth Limit

### Shape Architect
- [x] Volume Conservation Check
- [x] Piece Placement Preview
- [x] Snap-to-Grid Drag with @dnd-kit

### Cross-Game
- [x] Shared Storage Service
- [x] Level Progression (unlock system)
- [x] Score Tracking
- [x] Internationalization (EN/VI)

### Bug Fixes
- [x] Fixed puzzle generation issues
- [x] Added solver iteration limit
- [x] Fixed minimax array mutation
- [x] Fixed Fisher-Yates shuffle

### Code Quality
- [x] Memoized expensive components
- [x] Extracted shared constants
- [x] TypeScript improvements
