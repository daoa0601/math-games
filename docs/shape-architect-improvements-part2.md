# Shape Architect - Improvement Plan Part 2

## Bug 3: 3D Mode Not Playable

### Problem
When switching to 3D view mode, the puzzle grid shows as wireframe 3D but the **pieces remain 2D flat squares** in the inventory. The 2D pieces cannot meaningfully interact with the 3D wireframe target.

**Root Cause:**
The current level (`4x4 Square`) uses 2D tetrominoes with `z: 0` for all voxels. The 3D view renders these flat pieces at ground level, but since all current Easy/Medium levels are `type: '2D'`, the 3D toggle is just a viewing option—not a gameplay change.

**Core Issue:** There are no true 3D levels with z > 0 voxels in the Easy/Medium difficulty.

---

### Solution: Implement Proper 3D Levels

#### Step 1: Add 3D Polycube Pieces to Presets
**File:** `src/games/ShapeArchitect/logic/presets.ts`

The file already has 3D polycubes defined but they're not used in Easy/Medium levels:

```ts
// Already exists - L3D, T3D polycubes
export const POLYCUBES_3D = {
    // L-shaped 3D (4 cubes)
    L3D: (id: string, color: string): Piece => ({...}),
    // T-shaped 3D (4 cubes)  
    T3D: (id: string, color: string): Piece => ({...}),
    // Small cube 2x2x2 (8 cubes)
    CUBE_2X2X2: (id: string, color: string): Piece => ({...}),
};
```

**Action:** Add more 3D polycube shapes:
```ts
// Add to POLYCUBES_3D
STAIR: (id: string, color: string): Piece => ({
    id, name: 'Stair', color,
    layout: [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 1, y: 0, z: 1 },
        { x: 2, y: 0, z: 1 },
    ],
}),

TOWER: (id: string, color: string): Piece => ({
    id, name: 'Tower', color,
    layout: [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 1 },
        { x: 0, y: 0, z: 2 },
    ],
}),
```

#### Step 2: Create Easy 3D Levels
**File:** `src/games/ShapeArchitect/logic/presets.ts`

Add simple 3D levels to the `presetLevels` array:

```ts
// === EASY 3D LEVELS ===
{
    id: 'easy_3d_1',
    name: '2x2x2 Cube',
    type: '3D',
    gridSize: [4, 4, 4],
    targetVoxels: [
        // 2x2x2 cube = 8 cells
        { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 },
        { x: 1, y: 2, z: 0 }, { x: 2, y: 2, z: 0 },
        { x: 1, y: 1, z: 1 }, { x: 2, y: 1, z: 1 },
        { x: 1, y: 2, z: 1 }, { x: 2, y: 2, z: 1 },
    ],
    pieces: [
        POLYCUBES_3D.CUBE_2X2X2('cube1', '#FFEB3B'),
    ],
    difficulty: 'easy',
},
{
    id: 'easy_3d_2',
    name: 'L-Tower',
    type: '3D',
    gridSize: [4, 4, 4],
    targetVoxels: [
        { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 },
        { x: 1, y: 1, z: 1 }, { x: 1, y: 1, z: 2 },
    ],
    pieces: [
        POLYCUBES_3D.L3D('l1', '#4CAF50'),
    ],
    difficulty: 'easy',
},
```

#### Step 3: Fix View Mode Toggle UX
**File:** `src/games/ShapeArchitect/ShapeArchitectGame.tsx`

The toggle should indicate that 2D levels can be viewed in 3D, but only 3D levels have true volumetric puzzles:

```tsx
{/* View Mode Toggle - with level type indicator */}
<div className="view-mode-toggle" role="group" aria-label="View mode">
    <button
        className={`view-mode-btn ${viewMode === '2d' ? 'view-mode-btn--active' : ''}`}
        onClick={() => setViewMode('2d')}
        aria-pressed={viewMode === '2d'}
    >
        2D
    </button>
    <button
        className={`view-mode-btn ${viewMode === '3d' ? 'view-mode-btn--active' : ''}`}
        onClick={() => setViewMode('3d')}
        aria-pressed={viewMode === '3d'}
        disabled={gameState.level.type === '2D'} // Disable for 2D-only levels
        title={gameState.level.type === '2D' ? 'This is a 2D level' : 'View in 3D'}
    >
        3D {gameState.level.type === '3D' && '✓'}
    </button>
</div>
```

#### Step 4: Auto-Switch Viewmode Based on Level
```tsx
// When level changes, auto-set appropriate view mode
useEffect(() => {
    setViewMode(gameState.level.type === '3D' ? '3d' : '2d');
}, [gameState.level.id, gameState.level.type]);
```

---

## Issue: Shapes Are Not Creative

### Problem
Currently the game mainly uses standard Tetrominoes (I, O, T, S, Z, J, L). The `4x4 Square` level uses 4x O-Blocks which is boring.

### Solution: Add Creative Theme-Based Levels

#### Step 1: Add Themed Shape Collections
**File:** `src/games/ShapeArchitect/logic/presets.ts`

```ts
// === THEMED SHAPES ===
export const THEMED_SHAPES = {
    // Animal shapes (stylized)
    DOG: (id: string, color: string): Piece => ({
        id, name: 'Dog', color,
        layout: [
            { x: 0, y: 2, z: 0 }, // head
            { x: 1, y: 2, z: 0 }, // ear
            { x: 0, y: 1, z: 0 }, // neck
            { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, // body
        ],
    }),

    BIRD: (id: string, color: string): Piece => ({
        id, name: 'Bird', color,
        layout: [
            { x: 0, y: 1, z: 0 }, // head
            { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }, // body
            { x: 1, y: 0, z: 0 }, // tail
            { x: 3, y: 1, z: 0 }, // wing
        ],
    }),

    // Vehicle shapes
    CAR: (id: string, color: string): Piece => ({
        id, name: 'Car', color,
        layout: [
            { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 2, y: 0, z: 0 }, // base
            { x: 1, y: 1, z: 0 }, // cabin
        ],
    }),

    // Letter shapes
    LETTER_A: (id: string, color: string): Piece => ({
        id, name: 'A', color,
        layout: [
            { x: 0, y: 0, z: 0 }, { x: 2, y: 0, z: 0 }, // legs
            { x: 0, y: 1, z: 0 }, { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }, // middle
            { x: 0, y: 2, z: 0 }, { x: 2, y: 2, z: 0 }, // top legs
            { x: 1, y: 3, z: 0 }, // top
        ],
    }),
};
```

#### Step 2: Create Themed Levels
```ts
// === CREATIVE THEMED LEVELS ===
{
    id: 'creative_zoo',
    name: 'Build a Zoo',
    type: '2D',
    gridSize: [8, 8, 1],
    targetVoxels: generateRectangle(8, 5, 1, 1), // Custom target
    pieces: [
        THEMED_SHAPES.DOG('dog1', '#8B4513'),
        THEMED_SHAPES.BIRD('bird1', '#FF6B6B'),
        THEMED_SHAPES.DOG('dog2', '#D4A574'),
        // Fill remaining with standard tetrominoes
    ],
    difficulty: 'medium',
},
{
    id: 'creative_letters',
    name: 'Spell MATH',
    type: '2D',
    gridSize: [16, 5, 1],
    targetVoxels: [...], // Letter outlines
    pieces: [
        THEMED_SHAPES.LETTER_M('m1', '#6366F1'),
        // etc.
    ],
    difficulty: 'hard',
},
```

#### Step 3: Add Random Level Themes
**File:** `src/games/ShapeArchitect/logic/presets.ts`

Update `generateRandomLevel` to include themed pieces:

```ts
export function generateRandomLevel(difficulty: 'easy' | 'medium' | 'hard'): LevelConfig {
    const allPieces = [
        ...Object.values(TETRIS),
        ...(difficulty !== 'easy' ? Object.values(PENTOMINOES) : []),
        ...(difficulty === 'hard' ? Object.values(THEMED_SHAPES) : []),
    ];
    // ... rest of generation logic
}
```

---

## Implementation Checklist

### 3D Mode Fixes
- [ ] Add more POLYCUBES_3D shapes (Stair, Tower, Corner, etc.)
- [ ] Create 3-5 Easy 3D levels with simple shapes
- [ ] Create 3-5 Medium 3D levels with multi-piece puzzles
- [ ] Auto-switch viewMode based on level.type
- [ ] Disable 3D toggle for 2D-only levels (or keep as "preview mode")

### Creative Shapes
- [ ] Add THEMED_SHAPES collection (animals, vehicles, letters)
- [ ] Create themed levels ("Build a Zoo", "Spell MATH")
- [ ] Mix themed pieces with tetrominoes for variety
- [ ] Update generateRandomLevel to use themed pieces at higher difficulties

### Files to Modify
| File | Changes |
|------|---------|
| `logic/presets.ts` | Add POLYCUBES_3D shapes, THEMED_SHAPES, new levels |
| `ShapeArchitectGame.tsx` | Auto-switch viewMode, improve toggle UX |
| `components/PieceInventory.tsx` | Better 3D piece preview (already has IsometricPiecePreview) |
| `locales/*/shapeArchitect.json` | Add level names translations |

---

## Priority Order

1. **High:** Add Easy 3D levels so 3D mode is playable
2. **High:** Auto-switch viewMode based on level type
3. **Medium:** Add themed shapes for creative variety
4. **Medium:** Create themed levels
5. **Low:** Improve random level generation with themes

---

## Part 3: Tech Stack Analysis

### Question: Should Shape Architect Use a Different Tech Stack?

**Answer: No** — The current stack is appropriate, but the implementation needs optimization.

### Current Stack
- **React** — UI framework
- **React Three Fiber (R3F)** — React renderer for Three.js
- **@react-three/drei** — R3F utilities
- **Three.js** — WebGL abstraction

### Why Keep the Current Stack

| Factor | Assessment |
|--------|------------|
| **Scale** | Shape Architect uses small grids (4x4x4 to 8x8x8). This is ~64-512 voxels—**trivial** for R3F |
| **React Integration** | App is React-based. Switching would require rewriting the entire UI |
| **Bundle Size** | Three.js (~160KB gzip) is smaller than Babylon.js (~400KB) |
| **Ecosystem** | R3F + drei provides excellent React abstractions |

### The Real Problems (Implementation, Not Framework)

#### Problem 1: Individual Voxels as Separate React Elements
Each voxel is a `<mesh>` component, triggering React reconciliation on every update.

**Solution: Use InstancedMesh**
```tsx
// ❌ Current (slow)
{voxels.map(v => <Voxel key={v.id} position={v.pos} />)}

// ✅ Optimized (fast)
import { Instances, Instance } from '@react-three/drei';

<Instances limit={1000}>
  <boxGeometry args={[1, 1, 1]} />
  <meshStandardMaterial />
  {voxels.map(v => (
    <Instance key={v.id} position={v.pos} color={v.color} />
  ))}
</Instances>
```
**Impact:** Reduces draw calls from hundreds to **one single call**.

#### Problem 2: Continuous Rendering
Canvas renders at 60fps even when nothing changes.

**Solution: On-demand rendering**
```tsx
<Canvas frameloop="demand">
  {/* Only re-renders when invalidate() is called */}
</Canvas>
```

#### Problem 3: Hover Recalculation
`previewData` useMemo recalculates on every mouse pixel movement.

**Solution: Throttle hover events**
```tsx
const throttledHover = useMemo(
  () => throttle((pos) => setHoverPosition(pos), 50),
  []
);
```

### Alternative Frameworks Comparison

| Library | Best For | Why NOT for Shape Architect |
|---------|----------|---------------------------|
| **Three.js/R3F** ✅ | Small-medium 3D with React | **Already using, right choice** |
| **Babylon.js** | Complex game engines, VR/AR | Overkill, larger bundle, React integration awkward |
| **PlayCanvas** | Team collaboration, visual editor | Cloud-dependent, different paradigm |
| **Custom WebGL** | Millions of voxels | Massive overkill for <1000 voxels |

### When You WOULD Switch

| Scenario | Recommendation |
|----------|----------------|
| Voxel worlds with 10,000+ cubes | Custom WebGL voxel engine with greedy meshing |
| VR/AR features needed | Babylon.js (better WebXR support) |
| Non-React app | Babylon.js or PlayCanvas |
| Mobile-first with high perf needs | PlayCanvas |

### Optimization Roadmap

1. **Implement InstancedMesh** — Single biggest performance win
2. **Use `frameloop="demand"`** — Only render when state changes
3. **Throttle hover events** — 50ms minimum
4. **Consider WebGPU** — Future-proof (all libraries adding WebGPU support)

### Conclusion

> **Don't switch stacks. Optimize the existing R3F implementation.**
> The issues are solvable within the current architecture using InstancedMesh and on-demand rendering.
