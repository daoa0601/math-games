# Shape Architect - Code Review & Improvement Plan

## 🐛 Reported Bugs & Analysis

### Bug 1: Levels Are Locked (Forces Replaying Same Puzzle)

**User Report:** Levels show 🔒 icon and cannot be played.

**Root Cause:** The `isLevelUnlocked()` function in `src/shared/utils/storage.ts` requires levels to be unlocked sequentially. A level is only unlocked when the previous level is completed via `completeLevel()` which adds the next level to `unlockedLevels`.

**Location:** `storage.ts:143-151`
```ts
export function isLevelUnlocked(gameId: GameId, levelId: string, firstLevelId: string): boolean {
    if (levelId === firstLevelId) return true; // First level always unlocked
    const progress = getProgress(gameId);
    return progress.unlockedLevels.includes(levelId); // Requires previous completion
}
```

**Fix Options:**

1. **Option A: Remove Lock System Entirely (Recommended for casual play)**
   - Modify `ShapeArchitectGame.tsx` line 550-558 to always treat levels as unlocked
   - Simple change: `const unlocked = true;`

2. **Option B: Add "Unlock All" Button**
   - Add developer/cheat button to unlock all levels
   - Useful for testing without removing progression for users who want it

3. **Option C: Unlock by Difficulty Tier**
   - Allow all "Easy" levels unlocked by default
   - Only require progression within Medium/Hard tiers

**Proposed Implementation (Option A - Quick Fix):**
```tsx
// ShapeArchitectGame.tsx line 550
// BEFORE:
const unlocked = isLevelUnlocked('shape-architect', level.id, firstLevelId);

// AFTER:
const unlocked = true; // All levels always unlocked
// OR for dev mode toggle:
const unlocked = import.meta.env.DEV ? true : isLevelUnlocked('shape-architect', level.id, firstLevelId);
```

---

### Bug 2: Rotation Doesn't Work

**User Report:** Clicking rotation buttons does nothing.

**Root Cause:** Rotation is intentionally disabled when no piece is selected.

**Location:** `ShapeArchitectGame.tsx:696`
```tsx
<RotationControls
    disabled={!selectedPiece || showTimeUp || gameState.isSolved}
    // ^^ Disabled when no piece selected
/>
```

**Why This Happens:** Users must first click/select a piece from the inventory (shown below the rotation controls) before rotation becomes active. This is correct behavior, but the UX is confusing because:
1. The piece inventory may be below the fold (not visible without scrolling)
2. There's no visual indication that pieces need to be selected first

**Fix Options:**

1. **Option A: Improve Visual Feedback**
   - Add pulsing glow to piece inventory when no piece is selected
   - Add tooltip on rotation buttons saying "Select a piece first"

2. **Option B: Auto-Select First Piece**
   - When level loads, automatically select the first available piece
   - This makes rotation immediately available

3. **Option C: Show Instructions More Prominently**
   - Make the "Select a Tetris piece below" instruction more visible

**Proposed Implementation (Option B - Best UX):**
```tsx
// ShapeArchitectGame.tsx - in createGameState or useEffect
// Auto-select first piece when level loads
useEffect(() => {
    if (gameState.remainingPieces.length > 0 && !gameState.selectedPieceId) {
        setGameState(prev => ({
            ...prev,
            selectedPieceId: prev.remainingPieces[0].id
        }));
    }
}, [gameState.level.id]); // Trigger on level change
```

---

## Overview
This document provides a comprehensive review of Shape Architect's implementation, identifies issues, and proposes improvements including a new **Hover Preview Button** feature.

---

## Part 1: Current Issues

### Critical Issues

#### 1. Massive Component Size
**File:** `ShapeArchitectGame.tsx` (875 lines)  
**Problem:** 15+ useState hooks, keyboard/swipe handling, timer, daily mode, level editor, tutorial all in one file.

**Recommendation:** Extract into hooks:
- `useShapeArchitectState()` - core game state
- `useKeyboardControls()` - keyboard handling  
- `useLevelProgression()` - level navigation

#### 2. Duplicate Placement Logic
**Problem:** `handleCellClick` and `handleDragEnd` both implement placement separately.

**Recommendation:** Create unified `usePiecePlacement()` hook:
```tsx
function usePiecePlacement(gameState, setGameState) {
  const placePieceAt = useCallback((position: Position3D, piece: Piece, rotation: Rotation3D) => {
    const snapped = findNearestValidPosition(gameState.grid, piece, position, rotation, gameState.level.gridSize, 2);
    if (!snapped) return false;
    // Unified placement logic here
    return true;
  }, [gameState]);
  
  return { placePieceAt };
}
```

#### 3. 3D Performance
**Problem:** Every hover triggers expensive calculations. No voxel batching.

**Recommendation:** 
- Throttle hover events (50ms)
- Use Three.js InstancedMesh for voxels
- Implement layer visibility culling

---

### Moderate Issues

| Issue | File | Recommendation |
|-------|------|----------------|
| No level validation | engine.ts | Add validation in `createGameState` |
| Solver blocks UI | solver.ts | Move to Web Worker |
| No keyboard nav in 3D | GridBoard3D.tsx | Add ARIA controls |
| Deprecated code | engine.ts | Remove `rotatePieceLayout()` |

---

## Part 2: Hover Preview Button Feature

### Problem Statement
Currently, the only way to preview piece placement is by hovering with a mouse. This is inaccessible for:
- Touch devices (no hover state)
- Keyboard users
- Users who find hover distracting

### Proposed Solution: Preview Lock Button

#### UI Design
Add a "Lock Preview" toggle button next to piece controls:
```
[🔒 Lock Preview] - When clicked, shows the piece at the last hovered position
```

#### States
1. **Off (default):** Preview follows mouse hover (current behavior)
2. **On (locked):** Preview stays at the last hovered position until:
   - User clicks to place
   - User presses the button again to unlock
   - User selects a different piece

#### Implementation

##### 1. Add State (`ShapeArchitectGame.tsx`)
```tsx
const [previewLocked, setPreviewLocked] = useState(false);
const [lockedPosition, setLockedPosition] = useState<Position3D | null>(null);

// Modify hover handler
const handleCellHover = useCallback((position: Position3D | null) => {
  if (!previewLocked) {
    setLockedPosition(position);
  }
  // Still track current hover for unlocking purposes
  setHoverPosition(position);
}, [previewLocked]);

// Lock button handler
const togglePreviewLock = useCallback(() => {
  if (previewLocked) {
    // Unlocking: use current hover position
    setLockedPosition(hoverPosition);
  }
  setPreviewLocked(!previewLocked);
}, [previewLocked, hoverPosition]);

// Use lockedPosition for preview when locked
const effectivePreviewPosition = previewLocked ? lockedPosition : hoverPosition;
```

##### 2. Add Button to Controls Area
```tsx
<div className="shape-controls">
  <button
    className={`btn btn--icon ${previewLocked ? 'btn--active' : ''}`}
    onClick={togglePreviewLock}
    disabled={!selectedPiece || showTimeUp || gameState.isSolved}
    title={previewLocked ? t('controls.unlockPreview') : t('controls.lockPreview')}
    aria-pressed={previewLocked}
  >
    {previewLocked ? '🔓' : '🔒'}
  </button>
  {/* existing rotation controls */}
</div>
```

##### 3. CSS Styling
```css
/* Preview lock button active state */
.shape-controls .btn--active {
  background: var(--color-primary);
  color: white;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Locked preview visual indicator */
.grid-cell--preview-locked {
  animation: lockedPulse 1.5s ease-in-out infinite;
}

@keyframes lockedPulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 0.9; }
}
```

##### 4. Pass to GridBoard
```tsx
<GridBoard
  // ... existing props
  hoverPosition={effectivePreviewPosition}
  isPreviewLocked={previewLocked}
/>
```

##### 5. Update GridBoard to Show Locked State
```tsx
// In GridBoard.tsx, add locked styling
if (previewData.positions.has(posKey)) {
  cellClass += previewData.isValid
    ? ' grid-cell--preview-valid'
    : ' grid-cell--preview-invalid';
  if (isPreviewLocked) {
    cellClass += ' grid-cell--preview-locked';
  }
}
```

#### Keyboard Support
Add keyboard shortcut for preview lock:
```tsx
case 'l':
  // L key = toggle lock
  if (selectedPiece) {
    togglePreviewLock();
  }
  break;
```

#### Mobile/Touch Support
On touch devices, tapping a cell acts as both hover (preview) and lock. The lock button allows users to "tap to preview, rotate, then tap again to place":

1. First tap → Shows preview at that position
2. Rotate buttons → Rotate the piece
3. Second tap (same position) → Place the piece

---

## Implementation Checklist

### Phase 1: Refactoring (High Priority)
- [ ] Create `useShapeArchitectState` hook
- [ ] Create `usePiecePlacement` hook (unify click/drag)
- [ ] Create `useKeyboardControls` hook
- [ ] Extract overlay components (Win, TimeUp)

### Phase 2: Preview Lock Feature
- [ ] Add `previewLocked` and `lockedPosition` state
- [ ] Add toggle button to UI
- [ ] Update GridBoard to accept `isPreviewLocked` prop
- [ ] Add CSS for locked state
- [ ] Add keyboard shortcut (L key)
- [ ] Add i18n strings for button labels
- [ ] Test on mobile/touch

### Phase 3: Performance
- [ ] Throttle hover events
- [ ] Implement InstancedMesh for 3D voxels
- [ ] Add Web Worker for solver

### Phase 4: Accessibility
- [ ] Add ARIA labels to all controls
- [ ] Keyboard navigation for 3D view
- [ ] Screen reader announcements for piece placement

---

## Testing Requirements

### Manual Tests
1. Lock preview with mouse, rotate, place
2. Lock preview with keyboard (L key)
3. Switch pieces while locked (should unlock)
4. Mobile: tap-to-preview-and-lock flow

### Unit Tests
```tsx
describe('Preview Lock', () => {
  it('should lock preview position when button clicked', () => {});
  it('should unlock and use current hover when toggled off', () => {});
  it('should unlock when piece is changed', () => {});
  it('should work with keyboard shortcut', () => {});
});
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `ShapeArchitectGame.tsx` | Add lock state, button, keyboard handler |
| `GridBoard.tsx` | Accept `isPreviewLocked` prop, add CSS class |
| `GridBoard3D.tsx` | Same as GridBoard |
| `ShapeArchitect.css` | Add locked preview styles |
| `locales/en/shapeArchitect.json` | Add i18n strings |
| `locales/vi/shapeArchitect.json` | Add i18n strings |
