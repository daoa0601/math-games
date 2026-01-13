# ShapeArchitect Responsiveness Fix

**Date:** 2026-01-13
**Status:** Approved
**Problem:** Click events not registering and sluggish block movement in ShapeArchitect game

## Background

The ShapeArchitect game has two responsiveness issues:
1. **Click not registering** — Tapping/clicking on blocks sometimes requires multiple attempts
2. **Sluggish movement** — Dragging blocks feels laggy with visible delay

## Root Causes Identified

| Issue | Severity | Location |
|-------|----------|----------|
| Hover throttling hook exists but not applied | High | GridBoard.tsx, GridBoard3D.tsx |
| Snap-to-nearest calculation runs every hover | High | usePlacedPieceMovement.ts:124-129 |
| `onClick` requires pointer down+up on same mesh | Medium | Voxel.tsx:100-104 |
| `stopPropagation` called before handler | Low | Voxel.tsx:100-104 |

## Solution: Approach A — Apply Existing Throttling + Event Fixes

Minimal surgical changes (~50 lines) using existing infrastructure.

---

## Fix 1: Wire Up Hover Throttling

**File:** `src/games/ShapeArchitect/ShapeArchitectGame.tsx`

Apply the existing `useThrottledHover` hook to wrap hover handlers:

```typescript
import { useThrottledHover } from './hooks/useThrottledHover';

// Wrap handlers with 50ms throttle
const throttledSetHoverPosition = useThrottledHover(setHoverPosition);
const throttledSetMovePreviewPosition = useThrottledHover(setMovePreviewPosition);

// Pass throttled versions to components
<GridBoard onCellHover={throttledSetHoverPosition} />
<GridBoard3D onCellHover={selectedPlacedPieceId ? throttledSetMovePreviewPosition : throttledSetHoverPosition} />
```

**Impact:** Reduces hover callbacks from ~60/sec to ~20/sec.

---

## Fix 2: Fix Click Detection with onPointerDown

**File:** `src/games/ShapeArchitect/components/Voxel.tsx`

Replace `onClick` with `onPointerDown` for immediate response:

```typescript
// BEFORE:
onClick={(e) => {
  e.stopPropagation();
  onClick?.();
}}

// AFTER:
onPointerDown={(e) => {
  if (e.button === 0) {  // Left click only
    onClick?.();
    e.stopPropagation();  // Stop AFTER handling
  }
}}
```

**Impact:** Clicks register on first tap consistently.

---

## Fix 3: Memoize Snap-to-Nearest Calculation

**File:** `src/games/ShapeArchitect/hooks/usePlacedPieceMovement.ts`

Add memoized preview calculation:

```typescript
const snappedPreviewPosition = useMemo(() => {
  if (!selectedPlacedPieceId || !previewPosition || !piece || !placedPiece) {
    return null;
  }

  const gridWithoutPiece = createGridWithoutPiece(
    gameState.grid, piece, placedPiece, gameState.level.targetVoxels
  );

  return findNearestValidPosition(
    gridWithoutPiece, piece, previewPosition, moveRotation,
    gameState.level.gridSize, 2
  );
}, [
  selectedPlacedPieceId,
  previewPosition?.x, previewPosition?.y, previewPosition?.z,
  moveRotation, gameState.grid, piece, placedPiece
]);
```

Update `handleMoveToPosition` to use pre-computed value when position matches.

**Impact:** Grid traversal only runs when hover cell actually changes.

---

## Files to Modify

1. `src/games/ShapeArchitect/ShapeArchitectGame.tsx` — Wire up throttled hover
2. `src/games/ShapeArchitect/components/Voxel.tsx` — Change onClick to onPointerDown
3. `src/games/ShapeArchitect/hooks/usePlacedPieceMovement.ts` — Memoize snap calculation

## Testing

- Verify clicks register on first tap in both 2D and 3D views
- Verify block movement preview is smooth during drag
- Verify no regressions in piece placement, rotation, or undo
- Test on mobile (touch) and desktop (mouse)
