# Shape Architect Engine Optimization Plan

**Goal**: Replace DOM-based grid rendering with Canvas 2D + Three.js 3D visualization, optimize the solver and grid data structures, and move heavy computation off the main thread.

**Current state**: Shape Architect renders via a CSS grid of `<button>` elements. The voxel engine supports full 3D (24-rotation system, collision detection, backtracking solver) but the UI only renders `grid[x][y][0]` — a flat 2D slice. 3D levels exist in the type system but have no visual representation.

---

## Phase A — Canvas 2D Renderer (replace DOM grid)

Foundation for all subsequent rendering work.

### A1. `<ShapeArchitectCanvas>` component

Create `src/games/ShapeArchitect/components/ShapeArchitectCanvas.tsx`.

- Replace the CSS grid of buttons with a single `<canvas>` element
- Draw grid cells as filled rectangles with border strokes
- Color mapping: empty = white, target = light gray (#f5f5f5), filled = piece color
- Use `requestAnimationFrame` for draw loop (or just redraw on state change via `useEffect`)
- Maintain current grid dimensions: `width × height` from `config.gridSize`

Props interface:
```typescript
interface ShapeArchitectCanvasProps {
  grid: CellState[][][]
  config: LevelConfig
  placedPieces: PlacedPiece[]
  selectedPiece: Piece | null
  placementRotation: Rotation3D
  onCellClick: (position: Position3D) => void
}
```

### A2. Hit testing

- On canvas click: translate `(clientX, clientY)` to grid `(x, y)` using cell size + padding
- Cell size = `Math.floor(canvasWidth / gridWidth)`
- Account for canvas DPI scaling (`window.devicePixelRatio`)
- Return `Position3D` with `z: 0` for 2D mode

### A3. Ghost piece preview

- On mouse move over canvas: calculate which cell the cursor is over
- If a piece is selected, compute `getPieceWorldPositions(selectedPiece, hoveredCell, rotation)`
- Draw those cells with the piece color at 30% opacity
- If placement would be invalid (fails `canPlacePiece`), draw in red at 20% opacity
- Clear ghost on mouse leave

### A4. Animated placement

- On successful placement: interpolate piece cell opacity from 0 to 1 over 200ms
- Use `requestAnimationFrame` with a timestamp delta
- Optional: subtle scale-in effect (cells grow from 80% to 100%)

### A5. Verification

- All E2E tests still pass (click coordinates may need updating for canvas)
- Visual regression: side-by-side comparison with old DOM grid
- Touch interaction works on mobile (canvas touch events)
- `pnpm check` passes

---

## Phase B — Isometric 2.5D View (intermediate step)

Before full Three.js, add an isometric projection mode for 3D levels on the same Canvas 2D context. This gives 3D visualization without a new dependency.

### B1. Isometric projection

Standard isometric transform:
```
screenX = (x - y) * tileWidth / 2
screenY = (x + y) * tileHeight / 2 - z * tileHeight
```

- Draw each voxel as an isometric cube (top face + left face + right face)
- Face colors: top = piece color, left = 15% darker, right = 30% darker
- Draw order: back-to-front, bottom-to-top (painter's algorithm)

### B2. Layer controls

- Toggle buttons to show/hide individual z-layers
- "Exploded view": vertically separate layers with gaps
- Opacity slider for upper layers (see through to bottom)

### B3. Verification

- 3D preset levels render correctly with proper occlusion
- 2D levels still use flat grid (no isometric overhead)
- Performance: 60fps for grids up to 10×10×5

---

## Phase C — Three.js 3D Renderer

Full 3D visualization for Shape Architect.

### C1. Three.js setup

Add `three` as a dependency. Create `src/games/ShapeArchitect/components/ShapeArchitect3D.tsx`.

- Lazy-load Three.js only on the `/games/shape-architect` route (dynamic import)
- Performance budget: Three.js chunk under 150KB gzipped
- Use `React.lazy` + `Suspense` with a fallback to the Canvas 2D renderer

Scene setup:
- `PerspectiveCamera` positioned at isometric-like angle (45deg azimuth, 35.264deg elevation)
- `AmbientLight` (0.6 intensity) + `DirectionalLight` (0.8 intensity, casting shadows)
- `OrbitControls` for camera rotation (constrained: no flipping below ground plane)
- Ground plane grid helper showing the grid footprint

### C2. Voxel rendering with `InstancedMesh`

- One `InstancedMesh` per piece color (batch all cubes of same color)
- Cube geometry: `BoxGeometry(0.95, 0.95, 0.95)` with slight gap between cells
- Material: `MeshStandardMaterial` with piece color, roughness 0.7, metalness 0.1
- On grid state change: rebuild instance matrices from `placedPieces` positions
- Target cells (unfilled): wireframe cubes or translucent boxes (opacity 0.15)

### C3. Ghost piece preview in 3D

- When a piece is selected and cursor hovers over a valid cell: show ghost cubes
- Ghost material: same color at 40% opacity, no shadows
- Raycast from camera through mouse position to intersect the grid plane
- Snap intersection point to nearest grid cell

### C4. Drag-to-place interaction

- Click piece in sidebar → piece attaches to cursor in 3D view
- Move cursor over grid → ghost preview follows
- Click to place (if valid) or right-click to cancel
- Rotation: keyboard shortcuts (Q/E for Z-axis, R/F for X-axis, T/G for Y-axis)

### C5. Piece sidebar 3D previews

- Small inline `<canvas>` per piece in the sidebar showing a 3D preview of the piece shape
- Use a shared offscreen renderer or individual small Three.js scenes
- Rotate slowly on hover for spatial understanding

### C6. View mode toggle

- UI toggle: "2D" / "3D" view mode
- 2D levels default to Canvas 2D (Phase A), 3D levels default to Three.js
- User can switch freely
- Persist preference in `localStorage`

### C7. Verification

- 3D rendering matches 2D grid state exactly (same cells filled, same colors)
- Orbit controls don't interfere with piece placement
- Performance: 60fps for grids up to 10×10×10 (~1000 cubes)
- Mobile: touch-based orbit + tap-to-place
- `pnpm check` passes
- Bundle size check: Three.js chunk verified under budget

---

## Phase D — Solver Optimization

### D1. Constraint propagation

Before backtracking, apply:
- **Naked singles**: if a target cell can only be reached by one piece in one orientation, that placement is forced
- **Volume partitioning**: if the target shape splits into disconnected regions, each region must be independently fillable by a subset of pieces
- Run propagation after each placement in the backtracking tree

Implementation: add `propagateConstraints(grid, remainingPieces, targetVoxels)` to `solver.ts` that returns forced placements or detects impossibility early.

### D2. Algorithm X / Dancing Links (DLX)

The polyomino packing problem is an exact cover problem. Knuth's Algorithm X with Dancing Links is the optimal solver.

- Columns: one per target cell + one per piece
- Rows: one per valid (piece, position, rotation) placement
- DLX finds all solutions by covering/uncovering columns

Create `src/games/ShapeArchitect/logic/dlx-solver.ts`:
- Build the cover matrix from `LevelConfig`
- Implement DLX with column-selection heuristic (smallest column first)
- Return first solution found

Expected speedup: 10-100x for complex puzzles. The current backtracking solver searches ~5000 states for medium puzzles; DLX typically needs <500.

### D3. Web Worker for solver

Create `src/games/ShapeArchitect/logic/solver.worker.ts`:

- Move solver execution to a Web Worker so the UI thread never freezes
- Message protocol:
  - Main → Worker: `{ type: 'solve', level: LevelConfig, maxTimeMs: number }`
  - Worker → Main: `{ type: 'result', result: SolverResult }`
  - Main → Worker: `{ type: 'cancel' }` (for early termination)
- In the route component: `const worker = useMemo(() => new Worker(...), [])`
- Fallback: if Web Workers unavailable (unlikely), run solver synchronously with a warning

Cloudflare Workers note: Web Workers are a *browser* API used client-side. The solver runs in the browser, not on the server. No conflict with Cloudflare Workers (which is the server runtime).

### D4. Bitboard grid representation

Replace `CellState[][][]` with a flat bitset for solver-internal use:

```typescript
class VoxelBitboard {
  private data: Uint32Array  // 1 bit per cell, packed into 32-bit words
  
  constructor(width: number, height: number, depth: number)
  get(x: number, y: number, z: number): boolean
  set(x: number, y: number, z: number): void
  clear(x: number, y: number, z: number): void
  
  // Bulk operations
  canPlace(pieceMask: VoxelBitboard, offset: number): boolean  // AND == 0
  place(pieceMask: VoxelBitboard, offset: number): void        // OR
  isSolved(targetMask: VoxelBitboard): boolean                 // equals
  clone(): VoxelBitboard                                        // slice
}
```

Pre-compute piece masks for each (piece, rotation) combination. Placement check = single bitwise AND. Placement = single bitwise OR.

Expected speedup: 10-50x for grid operations in the solver hot loop.

---

## Phase E — Grid Data Structure

Optimize the game-state grid used by the engine (not just the solver).

### E1. Flat `Uint8Array` grid

Replace `CellState[][][]` with:

```typescript
class VoxelGrid {
  readonly width: number
  readonly height: number
  readonly depth: number
  private data: Uint8Array  // length = width * height * depth
  
  get(x: number, y: number, z: number): CellState {
    return this.data[x * this.height * this.depth + y * this.depth + z]
  }
  
  set(x: number, y: number, z: number, value: CellState): void {
    this.data[x * this.height * this.depth + y * this.depth + z] = value
  }
  
  clone(): VoxelGrid {
    const copy = new VoxelGrid(this.width, this.height, this.depth)
    copy.data.set(this.data)  // single memcpy
    return copy
  }
}
```

### E2. Update engine functions

All functions in `engine.ts` that take `CellState[][][]` switch to `VoxelGrid`:
- `createGrid` → `VoxelGrid.create(size)`
- `initializeGrid` → `VoxelGrid.fromLevel(level)`
- `placePiece` → `grid.clone()` then `grid.set(...)` per cell
- `canPlacePiece` → `grid.get(...)` per cell
- `checkSolved` → iterate `targetVoxels` with `grid.get(...)`

The `clone()` operation goes from nested `map()` calls to a single `Uint8Array.set()` — ~100x faster for a 10×10×5 grid.

### E3. Verification

- All engine unit tests updated to use `VoxelGrid`
- Game state in React component uses `VoxelGrid` (serializable for server functions via `.toArray()`)
- `pnpm check` passes

---

## File inventory

Files to create:
- `src/games/ShapeArchitect/components/ShapeArchitectCanvas.tsx` (Phase A)
- `src/games/ShapeArchitect/components/ShapeArchitect3D.tsx` (Phase C)
- `src/games/ShapeArchitect/components/PiecePreview3D.tsx` (Phase C5)
- `src/games/ShapeArchitect/rendering/isometric.ts` (Phase B)
- `src/games/ShapeArchitect/rendering/three-scene.ts` (Phase C — scene setup, materials, helpers)
- `src/games/ShapeArchitect/logic/dlx-solver.ts` (Phase D2)
- `src/games/ShapeArchitect/logic/solver.worker.ts` (Phase D3)
- `src/games/ShapeArchitect/logic/voxel-grid.ts` (Phase E)
- `src/games/ShapeArchitect/logic/voxel-bitboard.ts` (Phase D4)

Files to modify:
- `src/routes/games/shape-architect.tsx` — swap DOM grid for Canvas/3D, add view toggle
- `src/games/ShapeArchitect/logic/engine.ts` — use `VoxelGrid` instead of `CellState[][][]`
- `src/games/ShapeArchitect/logic/solver.ts` — add constraint propagation, use bitboard internally
- `src/games/ShapeArchitect/logic/types.ts` — add `VoxelGrid` type, keep `CellState` as the enum
- `package.json` — add `three` and `@types/three` dependencies

Files unchanged:
- `src/games/ShapeArchitect/logic/polyominoes.ts` — piece definitions stay the same
- `src/games/ShapeArchitect/logic/presets.ts` — level configs stay the same
- `src/games/ShapeArchitect/logic/seededGenerator.ts` — output format unchanged (generates `LevelConfig`)
- `src/games/ShapeArchitect/module.ts` — game module interface unchanged

---

## Dependency additions

```json
{
  "three": "^0.175.0",
  "@types/three": "^0.175.0"
}
```

Three.js is lazy-loaded only on `/games/shape-architect` via dynamic import. Other routes are unaffected.

---

## Risks & decisions

1. **Three.js bundle size**: ~150KB gzipped. Mitigate with dynamic import + route-level code splitting. Verify with `npx vite-bundle-visualizer`.
2. **Mobile performance**: Three.js on low-end phones may struggle. Fall back to Canvas 2D (Phase A) if WebGL is unavailable or fps drops below 30.
3. **Touch interaction in 3D**: Orbit controls + tap-to-place need careful gesture handling to avoid conflicts. Consider a "place mode" toggle that disables orbit while placing pieces.
4. **Web Worker in Cloudflare context**: Web Workers are browser-only. The solver runs client-side. Vite handles worker bundling via `new Worker(new URL(...), { type: 'module' })`.
5. **DLX complexity**: Algorithm X is well-documented but nontrivial to implement correctly with 3D rotations. Test extensively against the existing backtracking solver — both must produce the same solvability results.
6. **Phasing**: A → E → D3 → B → C → D1 → D2 → D4 is the recommended order. Canvas 2D + flat grid + Web Worker are independent quick wins. Isometric and Three.js build on Canvas. DLX is the most complex and lowest urgency.
