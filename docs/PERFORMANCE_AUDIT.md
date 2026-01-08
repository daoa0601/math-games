# Performance Audit Report

This document identifies performance anti-patterns, inefficient algorithms, and memory management issues discovered in the codebase.

## Summary

| Category | Issues Found | Severity |
|----------|-------------|----------|
| React Re-rendering | 8 patterns | High |
| Storage Access | 7 patterns | Medium-High |
| Algorithm Efficiency | 9 patterns | Critical-Medium |
| Three.js Memory | 5 patterns | High-Medium |
| Context Providers | 1 pattern | Medium |

---

## 1. React Re-rendering Issues

### 1.1 Inline Style Objects (High Priority)

Creating style objects in JSX breaks referential equality and causes unnecessary re-renders.

| File | Line | Issue |
|------|------|-------|
| `src/games/MagicGraph/components/PuzzleBoard.tsx` | 228 | `style={{ transformOrigin: ... }}` |
| `src/games/SequenceRace/components/RaceTrack.tsx` | 42, 56, 66 | Multiple inline styles for markers |
| `src/pages/Dashboard/tabs/StatsTab.tsx` | 47-62 | Complex gradient calculation in style |
| `src/games/ShapeArchitect/components/GridBoard.tsx` | 44-46 | Style per grid cell |
| `src/games/ShapeArchitect/components/PieceInventory.tsx` | 113 | Style per preview cell |

**Fix**: Extract styles to `useMemo` or move to CSS classes.

### 1.2 Unmemoized List Components (High Priority)

List items re-render on every parent update without `React.memo`.

| File | Component | Issue |
|------|-----------|-------|
| `src/games/ShapeArchitect/components/PieceInventory.tsx:24` | `DraggablePiece` | Not memoized, rendered in `.map()` |
| `src/games/ShapeArchitect/components/GridBoard.tsx:21` | `DroppableCell` | Not memoized, hundreds of instances |
| `src/shared/components/gamification/AchievementsGallery.tsx:98` | `AchievementCard` | Not memoized in list |

**Fix**: Wrap with `React.memo` and ensure stable props.

### 1.3 Inline Event Handlers (Medium Priority)

New function instances created on every render.

| File | Lines | Issue |
|------|-------|-------|
| `src/games/SequenceRace/components/StepCards.tsx` | 113-118 | 6 inline handlers per button |
| `src/games/MagicGraph/components/NumberInventory.tsx` | 26-48 | Inline `handleClick` wrapper |
| `src/games/MagicGraph/components/NumberPicker.tsx` | 77 | `onClick={() => onSelect(num)}` |
| `src/games/ShapeArchitect/components/PieceInventory.tsx` | 97 | `onSelect={() => onSelectPiece(piece.id)}` |

**Fix**: Use `useCallback` or pass stable handler with data attributes.

### 1.4 Array/Object Creation in Render (High Priority)

New arrays created during render without memoization.

| File | Lines | Issue |
|------|-------|-------|
| `src/games/MagicGraph/components/NumberPicker.tsx` | 56 | `.filter()` creates new array |
| `src/games/SequenceRace/components/RaceTrack.tsx` | 23-28 | Markers array recreated |
| `src/pages/Dashboard/tabs/AchievementsTab.tsx` | 53-101 | Filter per category in render |
| `src/pages/Dashboard/tabs/ProfileTab.tsx` | 88-124 | Same filter pattern |

**Fix**: Wrap with `useMemo` with proper dependencies.

### 1.5 useMemo with Empty Dependencies (Medium Priority)

```typescript
// src/pages/Dashboard/tabs/PlayTab.tsx:69-83
const gamesWithProgress = useMemo(() => {...}, []);  // Never updates!

// src/shared/components/DailyChallenge/DailyChallengeBanner.tsx:28-29
const completions = useMemo(() => getTodayCompletions(), []);  // Stale data
```

**Fix**: Add proper dependencies or remove `useMemo` if not needed.

---

## 2. Storage Access Patterns

### 2.1 N+1 Read Pattern in Achievement Unlock (High Priority)

**File**: `src/shared/contexts/PlayerContext.tsx:227-244`

```typescript
newAchievementIds.forEach((id) => {
  const { isNew } = unlockAchievementService(id);  // Each reads storage
  // ...
});
setProfile(getPlayerProfile());  // Another read
```

For 3 achievements: 4+ storage reads instead of 1.

### 2.2 Chained Storage Reads (High Priority)

**File**: `src/shared/services/player.ts`

```typescript
// Line 212-215
export function updatePreferences(preferences) {
  const profile = getPlayerProfile();  // READ 1
  return updatePlayerProfile({...});   // READ 2 inside
}
```

**Fix**: Add `update()` method to TypedStorage that reads once.

### 2.3 Loop Storage Reads (Medium Priority)

**File**: `src/shared/utils/storage.ts:192-213`

```typescript
for (const gameId of gameIds) {
  const progress = getProgress(gameId);  // 3 reads in sequence
}
```

### 2.4 Repeated Query Functions (Medium Priority)

**File**: `src/shared/services/daily.ts`

`isDailyCompleted()`, `getTodayCompletion()`, `getTodayCompletions()` each read storage independently. A component calling all three does 3 reads.

### 2.5 Startup Blocking Operations (Medium Priority)

**File**: `src/shared/contexts/AuthContext.tsx:49-74`

Three synchronous storage operations at app startup blocking the main thread.

---

## 3. Algorithm Inefficiencies

### 3.1 Exponential Combination Generation (CRITICAL)

**File**: `src/games/MagicGraph/logic/solver.ts:267-297`

```typescript
function canSumTo(arr, k, target) {
  for (const combo of combinations(arr, k)) {  // O(C(n,k))
    if (combo.reduce((a, b) => a + b, 0) === target) return true;
  }
}
```

For C(9,4) = 126 combinations per call. Used in hot paths during hint generation.

**Fix**: Use dynamic programming subset sum O(n*target).

### 3.2 O(n²) Array Lookups (High Priority)

**File**: `src/games/MagicGraph/logic/solver.ts`

| Line | Issue |
|------|-------|
| 411 | `lines.filter(l => l.nodeIds.includes(node.id))` - O(m*n) per node |
| 581-617 | Nested loops with `.filter().includes()` - O(n²*m²) |
| 209-213 | `keepVisible.includes(i)` twice per element |

**Fix**: Pre-compute lookups as `Map` or `Set`.

### 3.3 Repeated Solver Calls (High Priority)

**File**: `src/games/MagicGraph/logic/solver.ts:681-688`

```typescript
for (let targetSum = minSearch; targetSum <= maxSearch; targetSum++) {
  const solutions = solve(...);  // 40+ calls for range [10,50]
}
```

Called during Grandmaster puzzle generation, causes UI lag.

### 3.4 Minimax Key Sort Overhead (Medium Priority)

**File**: `src/games/SequenceRace/logic/engine.ts:188`

```typescript
const key = `${state.currentPosition}-${[...state.availableSteps].sort().join(',')}`;
```

O(n log n) sort on every recursive call (thousands of times).

**Fix**: Pre-sort or use hash-based memoization.

### 3.5 String Key Creation in Hot Loop (Medium Priority)

**File**: `src/games/ShapeArchitect/logic/solver.ts:136-145`

24 array sorts + string concatenations for rotation uniqueness check.

**Fix**: Compare arrays directly without string conversion.

---

## 4. Three.js Memory Management

### 4.1 Vector3 Created Every Animation Frame (CRITICAL)

**File**: `src/games/ShapeArchitect/components/InstancedVoxels.tsx:100`

```typescript
useFrame(() => {
  tempMatrix.scale(new THREE.Vector3(scale, scale, scale));  // GC pressure!
});
```

Creates garbage on every frame causing GC stutters.

**Fix**: Create reusable `tempVector` at module level like `tempMatrix`.

### 4.2 Materials/Geometries Created Per Render (High Priority)

| File | Line | Issue |
|------|------|-------|
| `src/games/ShapeArchitect/components/Voxel.tsx` | 111-116 | `meshStandardMaterial` per render |
| `src/games/ShapeArchitect/components/Voxel.tsx` | 120 | `edgesGeometry` per render |
| `src/games/ShapeArchitect/components/Voxel.tsx` | 121-125 | `lineBasicMaterial` per render |

While react-three-fiber handles cleanup, constant creation during gameplay causes memory churn.

**Fix**: Use shared materials via context or `useMemo` with proper disposal.

---

## 5. Context Provider Issues

### 5.1 API Object Not Memoized (Medium Priority)

**File**: `src/shared/contexts/AuthContext.tsx:152`

```typescript
const api: AuthAPI = { login, loginAsGuest, logout, clearError };  // New object every render!
```

The `api` object should be wrapped in `useMemo` like in `PlayerContext.tsx`.

**Fix**:
```typescript
const api: AuthAPI = useMemo(() => ({
  login, loginAsGuest, logout, clearError
}), [login, loginAsGuest, logout, clearError]);
```

---

## Priority Matrix

### Immediate (High Impact, Easy Fix)
1. Add `tempVector` to InstancedVoxels.tsx
2. Wrap AuthContext api in useMemo
3. Memoize `DroppableCell` and `DraggablePiece`
4. Convert array lookups to Sets in solver.ts

### Short-term (High Impact, Medium Effort)
1. Refactor storage to use update() pattern
2. Pre-compute node-to-lines mapping
3. Memoize RaceTrack markers
4. Extract inline styles to useMemo/CSS

### Long-term (Architecture Changes)
1. Replace combination generation with DP subset sum
2. Implement storage batching/caching layer
3. Add material pooling for Three.js components
4. Profile and optimize puzzle generation for Grandmaster mode
