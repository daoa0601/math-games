# Performance Audit Report

> **Last Updated:** 2026-01-10  
> **Status:** Most critical issues have been addressed. This document now tracks remaining issues.

This document identifies performance anti-patterns, inefficient algorithms, and memory management issues discovered in the codebase.

## Summary

| Category | Originally Found | Fixed | Remaining |
|----------|-----------------|-------|-----------|
| React Re-rendering | 8 patterns | 5 | 3 |
| Storage Access | 7 patterns | 5 | 2 |
| Algorithm Efficiency | 9 patterns | 6 | 3 |
| Three.js Memory | 5 patterns | 3 | 2 |
| Context Providers | 1 pattern | 1 | 0 |

---

## ✅ Fixed Issues

The following high-priority issues have been resolved:

### React & Context
- **InstancedVoxels.tsx**: `tempVector` now at module scope (line 35) - no GC pressure
- **AuthContext.tsx**: API object now wrapped in `useMemo` (lines 221-226)
- **GridBoard.tsx**: `DroppableCell` now memo-wrapped (line 21)
- **PieceInventory.tsx**: `DraggablePiece` now memo-wrapped (line 24)

### Algorithms
- **solver.ts**: `canSumTo()` now uses DP with early termination (lines 269-324)
- **solver.ts**: `buildNodeToLinesMap()` provides O(1) node-to-line lookups (lines 428-442)
- **generatePuzzle**: Uses `Set` for `keepVisibleSet` instead of `.includes()` (line 208)

### Storage
- **daily.ts**: `isAllGamesCompletedToday()` now uses single storage read (lines 148-157)
- **PlayerContext.tsx**: Uses `profileRef` pattern to avoid redundant reads (lines 216-253)

---

## ⚠️ Remaining Issues

### 1. Inline Style Objects (Medium Priority)

| File | Line | Issue |
|------|------|-------|
| `PuzzleBoard.tsx` | 219 | `style={{ transformOrigin: \`${pos.x}px ${pos.y}px\` }}` |

**Fix**: Extract to CSS class with CSS custom properties:
```css
.mg-node { transform-origin: var(--node-x) var(--node-y); }
```

### 2. Inline Handler with .bind() (Medium Priority)

**File**: `PieceInventory.tsx:162`

```tsx
onSelect={handleSelectPiece.bind(null, piece.id)}
```

Creates new function per piece on every render.

**Fix**: Use data attributes or curry the callback at a higher level.

### 3. Grandmaster Solver Loop (Low Priority)

**File**: `solver.ts:756-763`

```typescript
for (let targetSum = minSearch; targetSum <= maxSearch; targetSum++) {
  const solutions = solve(nodes, lines, availableNumbers, targetSum, 1, 10000);
}
```

40+ solver calls for Grandmaster puzzle generation.

**Fix**: Binary search or parallelize with Web Workers for large ranges.

### 4. Multiple useFrame Hooks (Low Priority)

**Files**: `Voxel.tsx`, `InstancedVoxels.tsx`, `GridBoard3D.tsx`

Each voxel potentially has its own `useFrame` hook.

**Note**: This is mitigated by the `InstancedVoxels` batching approach but could be further optimized with a centralized animation manager.

---

## Verification Checklist

When making performance changes, verify with:

1. **React DevTools Profiler**: Check for unnecessary re-renders
2. **Chrome Memory Tab**: Take heap snapshots after gameplay
3. **Performance.mark()**: Measure solver operations timing
4. **Lighthouse**: Run performance audit focusing on Total Blocking Time

---

*See also: [PERFORMANCE_ANALYSIS.md](./PERFORMANCE_ANALYSIS.md) for a more comprehensive list of optimization opportunities.*
