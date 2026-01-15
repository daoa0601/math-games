# ShapeArchitect Revamp Changelog

**Date**: January 2025

This document summarizes the comprehensive revamp of the ShapeArchitect game.

---

## Summary of Changes

| Phase | Change | Impact |
|-------|--------|--------|
| 1 | Fixed double-preview bug | Cleaner visual feedback |
| 2 | Removed 3D mode entirely | Smaller bundle, simpler UX |
| 3 | Added dual placement UX | Better touch/click support |
| 4 | UX polish (animations, haptics) | More responsive feel |
| 5 | Added expert/master difficulties | More puzzle variety |

---

## Phase 1: Preview System Fix

**Problem**: `GridBoard.tsx` was rendering BOTH cell background colors AND a ghost overlay simultaneously when previewing piece placement, causing visual confusion.

**Solution**: Removed the duplicate cell preview classes, keeping only the ghost overlay.

**Files Modified**:
- `src/games/ShapeArchitect/components/GridBoard.tsx` - Removed lines that added `sa-cell--preview-valid/invalid` classes
- `src/games/ShapeArchitect/ShapeArchitect.css` - Removed `.sa-cell--preview-valid` and `.sa-cell--preview-invalid` styles

---

## Phase 2: 3D Mode Removal

**Rationale**: 3D mode added significant bundle size (~370KB from Three.js) and complexity while providing limited educational value for the target audience.

### Files Deleted
| File | Purpose |
|------|---------|
| `components/GridBoard3D.tsx` | Main 3D board renderer |
| `components/Voxel.tsx` | 3D voxel component |
| `components/GridFloor.tsx` | 3D floor plane |
| `components/InstancedVoxels.tsx` | Instanced voxel rendering |
| `components/CameraPresetButtons.tsx` | 3D camera controls |
| `components/LayerControls.tsx` | Layer visibility toggle |
| `components/IsometricPiecePreview.tsx` | 3D inventory preview |
| `components/Canvas3DErrorBoundary.tsx` | Three.js error boundary |
| `hooks/useThreeCleanup.ts` | Three.js memory cleanup |
| `hooks/useSharedGeometry.ts` | Shared Three.js geometry |

### Files Modified
- `ShapeArchitectGame.tsx` - Removed viewMode state, 3D imports, camera controls
- `components/index.ts` - Removed 3D component exports
- `hooks/index.ts` - Removed Three.js hook exports
- `hooks/useShapeArchitectState.ts` - Removed viewMode state and auto-switching logic
- `components/PieceInventory.tsx` - Simplified to always use 2D preview
- `logic/presets.ts` - Removed all 3D levels (`3d_easy_*`, `3d_med_*`, `3d_hard_*`)
- `ShapeArchitect.css` - Removed 3D-related styles

---

## Phase 3: Dual Placement UX

**Goal**: Support both tap-to-select/tap-to-place AND drag-and-drop for piece placement.

**Implementation**:
- Tap a piece in inventory to select it
- Tap a valid cell on the grid to place directly (no modal)
- Invalid positions still open the placement modal for rotation adjustment
- Drag-and-drop continues to work as before

**Files Modified**:
- `ShapeArchitectGame.tsx` - Updated `handleCellClick` to attempt direct placement for valid positions

---

## Phase 4: UX Polish

### 4.1 Snap Animation
Added a satisfying "snap-in" animation when pieces are placed:

```css
.sa-cell--just-placed {
    animation: snap-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes snap-in {
    0% { transform: scale(0.8); opacity: 0.5; }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
}
```

### 4.2 Haptic Feedback
Added haptic feedback for touch devices:

**New file**: `src/shared/utils/haptics.ts`

| Action | Feedback |
|--------|----------|
| Piece selection | Light vibration |
| Piece placement | Medium vibration |
| Invalid placement / Puzzle solved | Heavy vibration |

### 4.3 Rotation Preview Badge
Added a rotation indicator badge on the ghost overlay showing current rotation angle.

---

## Phase 5: New Difficulty Levels

### Added Difficulties
| Difficulty | Piece Count | Cell Range | Shapes Used |
|------------|-------------|------------|-------------|
| Easy | 3-4 | 12-16 | Tetrominoes |
| Medium | 5-6 | 20-30 | Tetrominoes + Pentominoes |
| Hard | 7-8 | 35-40 | Pentominoes |
| **Expert** | 6-8 | 36-48 | Hexominoes |
| **Master** | 5-7 | 35-49 | Heptominoes |

### Type System Updates
Centralized `Difficulty` type in `logic/types.ts` to avoid circular dependencies:

```typescript
export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'master';
```

### Files Modified
- `src/games/ShapeArchitect/logic/types.ts` - Added `Difficulty` type, updated `LevelConfig`
- `src/games/ShapeArchitect/logic/seededGenerator.ts` - Updated `PIECE_COUNT_RANGE` with expert/master
- `src/games/ShapeArchitect/logic/presets.ts` - Updated `generateRandomLevel` signature
- `src/games/ShapeArchitect/hooks/useShapeArchitectState.ts` - Updated type imports
- `src/games/ShapeArchitect/logic/index.ts` - Exported `Difficulty` type
- `src/games/ShapeArchitect/ShapeArchitectGame.tsx` - Added expert/master to difficulty selector
- `src/shared/components/ui/DifficultySelector.tsx` - Added 'expert' emoji mapping

### Translation Updates
Added translations for 'expert' difficulty:

| Locale | Key | Value |
|--------|-----|-------|
| English | `difficulty.expert` | "Expert" |
| Vietnamese | `difficulty.expert` | "Chuyên gia" |

---

## Verification

After the revamp:
- ✅ Build passes with no TypeScript errors
- ✅ All 621 unit tests pass
- ✅ Three.js removed from ShapeArchitect chunk (significant bundle reduction)
- ✅ All 2D gameplay functional
- ✅ New difficulty levels working correctly

---

## Future Considerations

1. **Hexomino/Heptomino definitions**: The `polyominoes.ts` file with all 35 hexominoes and 108 heptominoes can be expanded for more puzzle variety
2. **Difficulty balancing**: Expert and master levels may need tuning based on player feedback
3. **Performance**: Monitor solver performance with larger piece counts
