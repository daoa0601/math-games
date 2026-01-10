# Performance Analysis Report

> **Last Updated:** 2026-01-10
> **Status:** Several critical issues have been addressed. See annotations below.

This document identifies performance anti-patterns, inefficient algorithms, and optimization opportunities discovered in the math-games codebase.

## Summary

| Category | Critical | High | Medium | Total |
|----------|----------|------|--------|-------|
| React Re-renders | 2 | 3 | 6 | 11 |
| Algorithm Inefficiencies | 3 | 4 | 6 | 13 |
| Storage N+1 Patterns | 3 | 2 | 3 | 8 |
| Firebase Sync Patterns | 2 | 2 | 1 | 5 |
| Hook Anti-patterns | 1 | 3 | 4 | 8 |
| Three.js Memory Leaks | 3 | 0 | 3 | 6 |
| **Total** | **14** | **14** | **23** | **51** |

---

## 1. React Re-render Issues

### CRITICAL: Inline Functions in Nested Grid Loop

**File:** `src/games/ShapeArchitect/components/GridBoard.tsx:371-396`

```tsx
// Line 371-379: handleClick created inside nested map (height × width iterations)
const handleClick = () => {
    if (cell === 1) {
        onCellClick(position);
    } else if (cell === 2 && cellData && onPlacedPieceClick) {
        onPlacedPieceClick(cellData.pieceId);
    }
};

// Line 395: inline arrow for onMouseEnter
onMouseEnter={() => cell === 1 && handleMouseEnter(position)}

// Line 396: inline arrow for onKeyDown
onKeyDown={(e) => handleGridKeyDown(e, x, y, cell)}
```

**Problem:** Three inline functions are created for every grid cell on every render. For a 10×10 grid, creates 300 new function objects per render. Even with `DroppableCell` memoized, the new function references cause prop comparison to fail.

**Fix:** Extract cell-level handlers using a child component pattern or use data attributes:
```tsx
// Option 1: Memoized cell wrapper with stable handlers
const CellWrapper = memo(function CellWrapper({
    x, y, cell, onCellClick, onPlacedPieceClick, ...rest
}) {
    const handleClick = useCallback(() => {
        if (cell === 1) onCellClick({ x, y, z: 0 });
        else if (cell === 2) onPlacedPieceClick?.(pieceId);
    }, [x, y, cell, onCellClick, onPlacedPieceClick, pieceId]);

    return <DroppableCell onClick={handleClick} {...rest} />;
});

// Option 2: Data attributes with single handler at grid level
const handleCellClick = useCallback((e: React.MouseEvent) => {
    const { x, y, cell, pieceId } = e.currentTarget.dataset;
    // ... handle based on data attributes
}, [onCellClick, onPlacedPieceClick]);
```

---

### CRITICAL: Inline Gradient Style Object

**File:** `src/pages/Dashboard/tabs/StatsTab.tsx:47-63`

```tsx
style={{
  background: `linear-gradient(135deg, hsl(${currentRankInfo.rank === 'beginner' ? '120, 60%, 50%' :
    currentRankInfo.rank === 'learner' ? '200, 70%, 55%' :
    // ... 16 more ternary conditions
  }))`
}}
```

**Problem:** Inline style object with complex ternary logic creates new object reference every render.

**Fix:**
```tsx
const rankBadgeStyle = useMemo(() => ({
  background: getRankGradient(currentRankInfo.rank)
}), [currentRankInfo.rank]);
```

### HIGH: Inline onClick Handlers in Loops

Multiple components create new function references on every render inside `.map()` loops:

| File | Line | Component |
|------|------|-----------|
| `src/shared/components/layout/BottomNav.tsx` | 96, 110 | Tab buttons |
| `src/shared/components/layout/DashboardTabs.tsx` | 72 | Tab buttons |
| `src/pages/Dashboard/tabs/LearnTab.tsx` | 63 | Game cards |
| `src/shared/components/ui/DifficultySelector.tsx` | 47 | Difficulty buttons |
| `src/games/SequenceRace/components/StepCards.tsx` | 113 | Step cards |
| `src/games/MagicGraph/components/NumberInventory.tsx` | 42 | Number buttons |

**Fix:** Use `useCallback` with stable identifiers or event delegation:
```tsx
// Instead of:
onClick={() => onSelectItem(item.id)}

// Use:
const handleClick = useCallback((id: string) => {
  onSelectItem(id);
}, [onSelectItem]);

// Or use data attributes:
onClick={handleClick}
data-id={item.id}
```

### MEDIUM: useMemo with Empty Dependencies

**File:** `src/shared/components/DailyChallenge/DailyChallengeBanner.tsx:28-29`

```tsx
const completions = useMemo(() => getTodayCompletions(), []);
const allCompleted = useMemo(() => isAllGamesCompletedToday(), []);
```

**Problem:** Empty dependency arrays mean values never update even when the date changes.

**Fix:** Add a refresh trigger or use a time-based dependency.

---

## 2. Algorithm Inefficiencies

### CRITICAL: Nested Loops in Backtracking Solver

**File:** `src/games/MagicGraph/logic/solver.ts:97-114`

```typescript
for (const line of lines) {
    for (const nodeId of line.nodeIds) {  // NESTED LOOP
        const val = assignment.get(nodeId) ?? fixedValues.get(nodeId);
        // ...
    }
}
```

**Problem:** `isValidPartial()` is called on every backtracking iteration (~100,000 max). This creates O(m×n×iterations) operations.

**Fix:** Use incremental constraint checking - only validate affected lines when a value changes:
```typescript
function isValidPartialIncremental(
  nodeId: string,
  value: number,
  affectedLines: Line[]  // Pre-computed map of nodeId -> lines
): boolean
```

### CRITICAL: Array Spread in Deep Recursion

**File:** `src/games/ShapeArchitect/logic/solver.ts:292-301`

```typescript
const newRemaining = [
    ...remainingPieces.slice(0, i),
    ...remainingPieces.slice(i + 1),
];
const newSolution: SolutionStep[] = [
    ...solution,
    { pieceId: piece.id, position, rotation },
];
```

**Problem:** Creates O(N) new arrays at each recursion level = O(N²) total allocations.

**Fix:** Use a persistent data structure or mutation with explicit backtracking:
```typescript
// Use index tracking instead of new arrays
const usedPieceIndices = new Set<number>();
usedPieceIndices.add(i);
// ... recurse
usedPieceIndices.delete(i);  // Backtrack
```

### HIGH: .sort() Inside Loops

**File:** `src/games/ShapeArchitect/logic/solver.ts:138-141`

```typescript
for (const rotation of rotations) {
    const sorted = [...rotated].sort((a, b) => ...);  // O(k log k) × 24 rotations
}
```

**Fix:** Pre-sort piece layouts during level initialization.

### HIGH: .find() Without Memoization

**File:** `src/games/MagicGraph/MagicGraphGame.tsx:298`

```typescript
const node = puzzle.nodes.find((n) => n.id === nodeId);
```

**Fix:** Create a `Map<string, Node>` once and use `.get()`:
```typescript
const nodeMap = useMemo(() =>
  new Map(puzzle.nodes.map(n => [n.id, n])),
  [puzzle.nodes]
);
```

---

### HIGH: O(n²) Lookup in cellColorMap

**File:** `src/games/ShapeArchitect/components/GridBoard.tsx:165-181`

```typescript
const cellColorMap = useMemo(() => {
    const colorMap = new Map<string, {...}>();
    for (const placed of placedPieces) {
        const piece = levelPieces.find(p => p.id === placed.pieceId);  // O(n) per iteration
        if (!piece) continue;
        // ...
    }
    return colorMap;
}, [placedPieces, levelPieces]);
```

**Problem:** `Array.find()` inside a loop creates O(n×m) complexity. With 10 placed pieces and 30 level pieces, performs up to 300 comparisons.

**Fix:** Pre-index pieces by ID:
```typescript
const levelPiecesById = useMemo(() =>
    new Map(levelPieces.map(p => [p.id, p])),
    [levelPieces]
);

const cellColorMap = useMemo(() => {
    const colorMap = new Map<string, {...}>();
    for (const placed of placedPieces) {
        const piece = levelPiecesById.get(placed.pieceId);  // O(1)
        if (!piece) continue;
        // ...
    }
    return colorMap;
}, [placedPieces, levelPiecesById]);
```

### MEDIUM: .filter() + .includes() Pattern

**File:** `src/shared/services/player.ts:147-149`

```typescript
const filteredAchievements = oldAchievements.filter((id) =>
    typeof id === 'string' && coreAchievements.includes(id)  // O(n×m)
);
```

**Fix:** Convert to Set for O(1) lookups:
```typescript
const coreSet = new Set(coreAchievements);
const filteredAchievements = oldAchievements.filter((id) =>
    typeof id === 'string' && coreSet.has(id)
);
```

---

## 3. Storage N+1 Patterns

### ~~CRITICAL: Achievement Unlock Loop~~ ✅ FIXED

**File:** `src/shared/contexts/PlayerContext.tsx`

**Status:** Uses `profileRef` pattern to avoid redundant storage reads. Achievement checks now efficient.
```typescript
function unlockAchievementsBatch(ids: string[]): { newIds: string[] } {
  const profile = getPlayerProfile();  // Single read
  const newIds = ids.filter(id => !profile.achievements.includes(id));
  if (newIds.length > 0) {
    profile.achievements.push(...newIds);
    savePlayerProfile(profile);  // Single write
  }
  return { newIds };
}
```

### ~~CRITICAL: All Games Completed Check~~ ✅ FIXED

**File:** `src/shared/services/daily.ts:148-157`

**Status:** Now uses single storage read with `getDailyChallengeState()`.

### CRITICAL: getGameStreak() Inside Loop

**File:** `src/shared/components/DailyChallenge/DailyChallenge.tsx:94-98`

```tsx
{GAMES.map((game) => {
  const streak = getGameStreak(game.id);  // Storage read per game
  // ...
})}
```

**Fix:** Fetch all streaks once:
```tsx
const streaks = useMemo(() => {
  const state = getDailyChallengeState();
  return state.streaks;
}, []);

// Then in map:
const streak = streaks[game.id];
```

### HIGH: Double Read in Tutorial Check

**File:** `src/shared/services/tutorialProgress.ts:34-36`

```typescript
export function shouldShowTutorial(gameId: string): boolean {
  return !isTutorialCompleted(gameId) &&  // Read 1
         !isTutorialSkipped(gameId);       // Read 2
}
```

**Fix:**
```typescript
export function shouldShowTutorial(gameId: string): boolean {
  const progress = storage.get();  // Single read
  return !(progress.completedTutorials[gameId] || progress.skippedTutorials[gameId]);
}
```

---

## 4. Firebase Sync Patterns

### CRITICAL: Achievement Sync Loop (N+1 Network Calls)

**File:** `src/shared/contexts/PlayerContext.tsx:244-252`

```typescript
newIds.forEach((id) => {
    const achievement = getAchievementById(id);
    if (achievement) {
        newAchievements.push(achievement);
        unlockAchievementApi(id).catch(console.error);  // N API calls
        syncAchievementToFirebase(id);                   // N Firebase calls
    }
});
```

**Problem:** Individual Firebase sync calls in a loop instead of batching. Unlocking 3 achievements triggers 6 network operations instead of 2 batched operations.

**Fix:** Use the existing batch function in `syncManager.ts:341-359`:
```typescript
// After the loop, batch sync all achievements
if (newIds.length > 0) {
    unlockAchievementsBatchApi(newIds).catch(console.error);
    syncAchievementsBatch(newIds);  // Already exists, unused
}
```

---

### CRITICAL: Debounce Stale Closure Bug

**File:** `src/firebase/sync/syncManager.ts:268-319`

```typescript
syncDebounceTimer = setTimeout(async () => {
    if (now - lastSyncTime < MIN_SYNC_INTERVAL_MS) {
        // Recursive call captures stale 'profile' from closure
        syncDebounceTimer = setTimeout(
            () => syncToFirestore(profile),  // ❌ Stale profile!
            MIN_SYNC_INTERVAL_MS - (now - lastSyncTime)
        );
        return;
    }
    // ...
}, SYNC_DEBOUNCE_MS);
```

**Problem:** Recursive rescheduling captures profile from closure. Race conditions can cause older profile data to overwrite newer data.

**Fix:** Use module-level pending state:
```typescript
let pendingProfile: PlayerProfile | null = null;

export function syncToFirestore(profile: PlayerProfile) {
    pendingProfile = profile;  // Always update to latest

    if (syncDebounceTimer) clearTimeout(syncDebounceTimer);

    syncDebounceTimer = setTimeout(async () => {
        if (!pendingProfile) return;
        const profileToSync = pendingProfile;
        pendingProfile = null;
        await performSync(profileToSync);
    }, SYNC_DEBOUNCE_MS);
}
```

---

### HIGH: Profile Listener Full Re-merge on Every Update

**File:** `src/firebase/sync/syncManager.ts:171-246`

```typescript
function handleRemoteProfileChange(remoteProfile: PlayerProfile | null) {
    // Creates new Set for every achievement merge
    const merged = new Set([...localProfile.achievements, ...remoteProfile.achievements]);

    // Performs multiple Math.max() comparisons for each field
    // Creates new Date objects on every comparison
    // Full profile save triggers PlayerContext re-renders
    saveLocalProfile(merged);
}
```

**Problem:** Firestore listeners fire frequently with offline persistence. Each remote change triggers expensive merge operations and cascading re-renders.

**Fix:** Debounce the profile merge or use shallow comparison before full merge.

---

### HIGH: Auth State Object Recreation

**File:** `src/firebase/FirebaseAuthContext.tsx:93-100`

```typescript
setState({
    user,
    isAuthenticated: user !== null,
    isAnonymous: user?.isAnonymous ?? false,
    isLoading: false,
    error: null,
    isFirebaseAvailable: true,
});
```

**Problem:** Creates entirely new state object on every auth change, even when only one field changes.

**Fix:** Use functional update with comparison:
```typescript
setState(prev => {
    if (prev.user === user && !prev.isLoading) return prev;
    return {
        ...prev,
        user,
        isAuthenticated: user !== null,
        isAnonymous: user?.isAnonymous ?? false,
        isLoading: false,
    };
});
```

---

## 5. Hook Anti-patterns

### CRITICAL: Missing useEffect Dependency Array

**File:** `src/games/ShapeArchitect/hooks/useThrottledHover.ts:18-20`

```typescript
useEffect(() => {
    handlerRef.current = handler;
});  // NO DEPENDENCY ARRAY - runs every render!
```

**Fix:**
```typescript
useEffect(() => {
    handlerRef.current = handler;
}, [handler]);
```

### HIGH: Custom Hooks Not Memoizing Returns

**File:** `src/shared/hooks/game/useGameRewards.ts:159-167`

```typescript
return {
    handleCompletion,
    rewards,
    // ... 6 more properties
};  // New object every render
```

**Fix:**
```typescript
return useMemo(() => ({
    handleCompletion,
    rewards,
    // ...
}), [handleCompletion, rewards, /* ... */]);
```

### HIGH: Multiple Related useState Calls

**File:** `src/games/ShapeArchitect/hooks/usePlacedPieceMovement.ts:52-55`

```typescript
const [selectedPlacedPieceId, setSelectedPlacedPieceId] = useState<string | null>(null);
const [previewPosition, setPreviewPosition] = useState<Position3D | null>(null);
const [justMovedPositions, setJustMovedPositions] = useState<Set<string>>(new Set());
const [moveRotation, setMoveRotation] = useState<Rotation3D>({ x: 0, y: 0, z: 0 });
```

**Problem:** Four separate renders when updating related state.

**Fix:** Consolidate into a single state object with useReducer or combined useState.

### MEDIUM: progressVersion Anti-pattern

**File:** `src/games/ShapeArchitect/ShapeArchitectGame.tsx:82-85`

```typescript
const [progressVersion, setProgressVersion] = useState(0);
const totalScore = useMemo(
    () => getTotalScore('shape-architect'),
    [progressVersion]  // Artificial dependency
);
```

**Problem:** Using version counter to force memoization recompute is a code smell.

**Fix:** Properly track the actual dependencies or lift state management.

---

## 5. Three.js Memory Leaks

### CRITICAL: Uncanceled setTimeout

**File:** `src/games/ShapeArchitect/ShapeArchitectGame.tsx:160, 186`

```typescript
setTimeout(() => setPlacementError(null), 2000);
```

**Problem:** No cleanup if component unmounts during delay.

**Fix:**
```typescript
const timeoutRef = useRef<number>();

// In handler:
timeoutRef.current = window.setTimeout(() => setPlacementError(null), 2000);

// In useEffect cleanup:
useEffect(() => {
  return () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };
}, []);
```

### CRITICAL: edgesGeometry Created Per Frame

**File:** `src/games/ShapeArchitect/components/Voxel.tsx:119-126`

```tsx
<lineSegments>
    <edgesGeometry args={[sharedGeometry]} />
```

**Problem:** New edgesGeometry created for every voxel on every render.

**Fix:** Share edge geometry across voxels or use instanced line rendering.

### CRITICAL: Missing useThreeCleanup in PlacementModal

**File:** `src/games/ShapeArchitect/components/PlacementModal.tsx:42-91`

`PiecePreview3D` renders a Three.js Canvas but does not call `useThreeCleanup()`.

**Fix:** Add the cleanup hook:
```typescript
function PiecePreview3D({ piece, position, rotation, isValid }) {
    useThreeCleanup();  // Add this
    // ...
}
```

### MEDIUM: Multiple useFrame Hooks

**Files:** `Voxel.tsx:46`, `InstancedVoxels.tsx:91`, `GridBoard3D.tsx:297`

With 1000+ voxels, each with its own `useFrame` hook, performance degrades.

**Fix:** Consolidate animations into a single animation manager or use instanced mesh animations.

---

## Recommended Fix Priority

### Immediate (High Impact, Low Effort)

1. **DailyChallenge.tsx**: Move `getGameStreak()` outside the map loop
2. **daily.ts**: Fix `isAllGamesCompletedToday()` to use single storage read
3. **useThrottledHover.ts**: Add dependency array to useEffect
4. **ShapeArchitectGame.tsx**: Store setTimeout IDs in refs with cleanup
5. **PlacementModal.tsx**: Add `useThreeCleanup()` to PiecePreview3D

### Short-term (High Impact, Medium Effort)

6. **StatsTab.tsx**: Memoize gradient style computation
7. **PlayerContext.tsx**: Batch achievement unlocks
8. **player.ts**: Convert `.includes()` to Set lookups
9. **MagicGraphGame.tsx**: Create node lookup Map
10. **useGameRewards.ts / useGameInit.ts**: Memoize hook return values

### Medium-term (Medium Impact, Higher Effort)

11. **solver.ts (MagicGraph)**: Implement incremental constraint checking
12. **solver.ts (ShapeArchitect)**: Replace array spread with mutation + backtrack
13. **Voxel.tsx**: Share edge geometry or use instancing
14. **Multiple components**: Wrap onClick handlers in useCallback

---

## Performance Testing Recommendations

1. **React DevTools Profiler**: Run profiler on Dashboard with "Highlight updates" to visualize re-renders
2. **Chrome DevTools Memory**: Take heap snapshots after ShapeArchitect gameplay to detect leaks
3. **Lighthouse**: Run performance audit focusing on Total Blocking Time
4. **Custom timing**: Add `performance.mark()` around solver operations

---

*Last updated: 2026-01-10*
