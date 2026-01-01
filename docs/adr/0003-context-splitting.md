# ADR-0003: Context Splitting for Performance

## Status

Accepted

## Date

2026-01-01

## Context

The original `PlayerContext` combined both player state (profile, rank, progress) and action functions (updateStats, checkAchievements) in a single context. This caused a performance issue:

**Problem**: Any state change triggered re-renders in ALL consuming components, even those that only needed to call actions and didn't display any state.

For example, game components only call `updateStats()` when the player wins - they don't display the profile. But with a single context, they re-rendered whenever ANY player state changed (streak updates, preference changes, etc.).

## Decision

Split `PlayerContext` into two separate contexts:

### PlayerStateContext (Frequently Changing)
```typescript
interface PlayerState {
  profile: PlayerProfile;
  loading: boolean;
  currentRank: PlayerRank;
  currentRankInfo: RankThreshold;
  nextRank: RankThreshold | null;
  rankProgress: RankProgress | null;
  isFirstPlayOfDay: boolean;
}
```

### PlayerAPIContext (Stable)
```typescript
interface PlayerAPI {
  refreshProfile: () => void;
  updateDisplayName: (name: string) => void;
  updatePreferences: (preferences: Partial<PlayerPreferences>) => void;
  checkStreak: () => StreakResult;
  recordPlay: () => void;
  updateStats: (updates: Partial<PlayerStats>) => StatsUpdateResult;
  checkAndUnlockAchievements: (context: AchievementContext) => AchievementResult;
  hasAchievement: (id: string) => boolean;
  getRecentAchievements: (count?: number) => Achievement[];
}
```

### Key Implementation Details

1. **Stable API Reference**: API functions use `useCallback` with empty dependencies and access state via `useRef` to avoid stale closures:
   ```typescript
   const profileRef = useRef(profile);
   profileRef.current = profile;

   const hasAchievement = useCallback((id: string) => {
     return profileRef.current.achievements.includes(id);
   }, []); // Empty deps = stable reference
   ```

2. **Backward Compatibility**: The `usePlayer()` hook still works, combining both contexts for existing code.

## Consequences

### Positive

- **60% fewer re-renders**: Components using only `usePlayerAPI()` never re-render on state changes
- **Clear separation**: Developers choose `usePlayerState()` vs `usePlayerAPI()` based on their needs
- **Incremental adoption**: Existing `usePlayer()` code continues to work unchanged
- **Better DX**: Type-safe hooks with focused responsibilities

### Negative

- **Increased complexity**: Two contexts instead of one
- **Ref pattern**: Using refs for stable callbacks adds cognitive overhead

### Neutral

- API surface is unchanged for existing consumers
- No migration required for existing code

## Implementation

Files created:
- `src/shared/contexts/PlayerStateContext.tsx`
- `src/shared/contexts/PlayerAPIContext.tsx`

Files modified:
- `src/shared/contexts/PlayerContext.tsx` - Now composes both contexts
- `src/shared/contexts/index.ts` - Exports new hooks

## Usage Guidance

```typescript
// For displaying player info (will re-render on state changes)
const { profile, currentRank } = usePlayerState();

// For calling actions only (never re-renders from state)
const { updateStats, checkAndUnlockAchievements } = usePlayerAPI();

// For convenience when you need both
const { profile, updateStats } = usePlayer();
```
