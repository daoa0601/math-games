# Architecture Overview

This document describes the architecture of the React Math Games application, a bilingual (EN/VI) educational SPA for elementary to middle school students.

## Table of Contents

- [Project Structure](#project-structure)
- [Key Patterns](#key-patterns)
- [State Management](#state-management)
- [Data Persistence](#data-persistence)
- [Performance Optimizations](#performance-optimizations)
- [Dependencies](#dependencies)

---

## Project Structure

The project uses a **hybrid architecture** combining feature-based (vertical slice) organization for games with layer-based organization for shared infrastructure.

```
src/
├── App.tsx                 # Routes with React.lazy code splitting
├── games/                  # Feature modules (vertical slices)
│   ├── MagicGraph/         # Graph-based number placement puzzle
│   │   ├── logic/          # Pure TypeScript game engine
│   │   ├── components/     # React UI components
│   │   ├── hooks/          # Game-specific hooks
│   │   └── MagicGraphGame.tsx
│   ├── SequenceRace/       # Turn-based strategy game vs AI
│   └── ShapeArchitect/     # Voxel-based geometry puzzle (Three.js)
├── shared/                 # Shared infrastructure (horizontal layers)
│   ├── components/         # Reusable UI components
│   │   ├── gamification/   # StatsDisplay, AchievementToast, etc.
│   │   └── overlays/       # WinOverlay, TimeUpOverlay (planned)
│   ├── contexts/           # React contexts (PlayerContext)
│   ├── hooks/              # Shared hooks (useGameTimer, useGameRewards)
│   ├── machines/           # XState state machines (gameMachine)
│   ├── services/           # Business logic (player, rank, achievements)
│   ├── types/              # Shared TypeScript types
│   └── utils/              # Utilities (storage, audio, TypedStorage)
├── i18n/                   # Internationalization (EN/VI)
└── pages/
    └── Dashboard.tsx       # Game selector with player profile
```

### Path Aliases

The project uses path aliases for cleaner imports:

```typescript
// Instead of:
import { GameLayout } from '../../shared/components';

// Use:
import { GameLayout } from '@/shared/components';
```

Configured in `tsconfig.app.json` and `vite.config.ts`.

---

## Key Patterns

### Game Module Structure

Each game follows a consistent pattern:

| Directory | Purpose |
|-----------|---------|
| `logic/` | Pure TypeScript game engine (no React dependencies) |
| `components/` | React UI components |
| `hooks/` | Game-specific React hooks |
| `machines/` | XState state machines (when needed) |
| `[GameName]Game.tsx` | Main orchestrator component |

### Separation of Concerns

- **UI Layer**: React components handle rendering and user interaction
- **Logic Layer**: Pure functions in `logic/` for game rules, AI, solving
- **State Layer**: Context + hooks for state management

### Three.js Memory Management

For 3D games (ShapeArchitect), we use a cleanup hook to prevent GPU memory leaks:

```typescript
// In a component inside Canvas
useThreeCleanup(); // Disposes geometries, materials, textures on unmount
```

See `src/games/ShapeArchitect/hooks/useThreeCleanup.ts`.

---

## State Management

### Player State (Global)

Managed via split contexts for performance optimization:

- **`PlayerStateContext`** - Frequently changing data (profile, rank, progress)
- **`PlayerAPIContext`** - Stable action functions (updateStats, checkAchievements)

```typescript
// For displaying player info (re-renders on state change)
const { profile, currentRank } = usePlayerState();

// For actions only (never re-renders from state)
const { updateStats, checkAndUnlockAchievements } = usePlayerAPI();

// Convenience hook for both (backward compatibility)
const { profile, updateStats } = usePlayer();
```

See [ADR-0003: Context Splitting](./adr/0003-context-splitting.md).

### Game State (XState Machine)

Game flow is managed via XState for robust state transitions:

```
idle → playing → { paused, won, lost, timeUp } → idle
```

```typescript
const {
  isPlaying,
  isPaused,
  isComplete,  // won || lost || timeUp
  start,
  pause,
  win,
  restart,
} = useGameMachine();
```

See [ADR-0004: XState Game Flow](./adr/0004-xstate-game-flow.md).

---

## Data Persistence

### TypedStorage with Zod

All localStorage operations use `TypedStorage` for runtime validation:

```typescript
import { TypedStorage, PlayerProfileSchema } from '@/shared/utils';

const profileStorage = new TypedStorage(
  'player-profile',
  PlayerProfileSchema,
  createDefaultProfile()
);

const profile = profileStorage.get(); // Always returns valid data
```

### Storage Schema

| Key | Schema | Description |
|-----|--------|-------------|
| `player_profile` | `PlayerProfileSchema` | Player stats, achievements, preferences |
| `game_progress_*` | `GameProgressSchema` | Per-game level progress |

---

## Performance Optimizations

### Code Splitting

Games are lazy-loaded with React.lazy:

```typescript
const MagicGraph = lazy(() => import('@/games/MagicGraph'));
```

### Bundle Chunking

Vite manual chunks separate vendor libraries:

| Chunk | Contents | Size (gzip) |
|-------|----------|-------------|
| `react-vendor` | React, ReactDOM, Router | ~16KB |
| `i18n-vendor` | i18next | ~18KB |
| `three-vendor` | Three.js, R3F | ~321KB |
| `dnd-vendor` | @dnd-kit | ~13KB |

### Memoization

- `React.memo` on frequently-rendered components
- `useMemo` for expensive calculations
- `useCallback` for event handlers passed to children

---

## Dependencies

### Core

| Package | Version | Purpose |
|---------|---------|---------|
| React | 19.x | UI framework |
| react-router-dom | 7.x | Routing |
| i18next | 25.x | Internationalization |

### State & Validation

| Package | Version | Purpose |
|---------|---------|---------|
| xstate | 5.x | State machines (game flow) |
| @xstate/react | 6.x | React bindings for XState |
| zod | 4.x | Runtime schema validation |

### 3D Graphics (ShapeArchitect only)

| Package | Version | Purpose |
|---------|---------|---------|
| three | 0.170.x | 3D rendering |
| @react-three/fiber | 9.x | React bindings for Three.js |
| @react-three/drei | 10.x | Helper components |

---

## ADRs (Architectural Decision Records)

Major decisions are documented in `docs/adr/`:

- [ADR-0001: Path Aliases](./adr/0001-path-aliases.md)
- [ADR-0002: TypedStorage with Zod](./adr/0002-typed-storage-zod.md)
- [ADR-0003: Context Splitting](./adr/0003-context-splitting.md)
- [ADR-0004: XState Game Flow](./adr/0004-xstate-game-flow.md)

---

## Future Plans

1. **Hook Extraction** - Reduce game component sizes to <300 lines (SequenceRace pilot)
2. **Storybook** - Component documentation
3. **Three.js Optimization** - Reduce bundle size with three-minifier
4. **ESLint Boundaries** - Prevent cross-game imports
