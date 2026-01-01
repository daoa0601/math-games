# Technical Design Document
## Math Gymnasium - Architecture & Optimization Guide

**Version:** 2.0
**Last Updated:** January 2026
**Status:** Active Development

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Module Design](#module-design)
4. [State Management](#state-management)
5. [Performance Architecture](#performance-architecture)
6. [Internationalization](#internationalization)
7. [Gamification System](#gamification-system)
8. [Build & Bundle Strategy](#build--bundle-strategy)
9. [Testing Strategy](#testing-strategy)
10. [Future Research Areas](#future-research-areas)
11. [Technical Debt Registry](#technical-debt-registry)
12. [Appendix](#appendix)

---

## Executive Summary

Math Gymnasium is a React + TypeScript SPA designed for educational math games targeting primary to middle school students. The application prioritizes:

- **Performance**: Code splitting, lazy loading, memoization
- **Accessibility**: Reduced motion support, ARIA labels, keyboard navigation
- **Internationalization**: Bilingual support (EN/VI)
- **Engagement**: Achievement system, rank progression, visual feedback

### Quality Metrics (Post-Optimization)

| Area | Score | Notes |
|------|-------|-------|
| CSS Architecture | A- (89%) | BEM naming, CSS variables, shared styles |
| Animation Performance | A+ (100%) | GPU-composited, reduced motion |
| React Patterns | B+ (85%) | Good hooks, error boundaries added |
| Bundle Optimization | B+ (85%) | Vendor chunks, lazy confetti |
| Game Logic | A (92%) | Strong algorithms, memoization |
| Type Safety | A- (88%) | Centralized types, strict mode |

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Application Shell                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Router    │  │   i18n      │  │   PlayerContext         │  │
│  │ (lazy load) │  │ (EN/VI)     │  │ (profile, achievements) │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                         Error Boundary                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Game Modules                           │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │   │
│  │  │ MagicGraph │  │ Sequence   │  │ ShapeArchitect     │  │   │
│  │  │  (~20KB)   │  │ Race(~40KB)│  │ (~370KB + three.js)│  │   │
│  │  └────────────┘  └────────────┘  └────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Shared Layer                            │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐  │   │
│  │  │Components│ │  Hooks   │ │ Services │ │   Utils     │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └─────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                      Browser Storage Layer                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐   │
│  │  Player Profile │  │  Game Progress  │  │  Preferences   │   │
│  │  (stats, rank)  │  │  (per-game)     │  │  (sound, lang) │   │
│  └─────────────────┘  └─────────────────┘  └────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
src/
├── App.tsx                    # Routes with React.lazy
├── main.tsx                   # Entry point
├── index.css                  # Design system tokens
│
├── games/                     # Self-contained game modules
│   ├── MagicGraph/
│   │   ├── logic/             # Pure TypeScript engine
│   │   │   ├── types.ts       # Game-specific types
│   │   │   ├── solver.ts      # Puzzle generation/solving
│   │   │   ├── puzzles.ts     # Preset puzzles
│   │   │   └── __tests__/     # Unit tests
│   │   ├── components/        # React UI components
│   │   ├── hooks/             # Game-specific hooks
│   │   ├── MagicGraphGame.tsx # Main game component
│   │   ├── MagicGraph.css     # Game theme styles
│   │   └── index.ts           # Barrel export
│   │
│   ├── SequenceRace/          # Same pattern
│   └── ShapeArchitect/        # Same pattern (+ 3D components)
│
├── shared/
│   ├── components/
│   │   ├── gamification/      # StatsDisplay, AchievementToast, RankUpOverlay
│   │   ├── icons/             # Custom SVG game icons
│   │   ├── Button.tsx
│   │   ├── ErrorBoundary.tsx  # Crash protection
│   │   ├── GameCard.tsx
│   │   ├── GameLayout.tsx
│   │   ├── Timer.tsx
│   │   └── index.ts           # Barrel exports
│   │
│   ├── contexts/
│   │   └── PlayerContext.tsx  # Global player state
│   │
│   ├── hooks/
│   │   ├── useGameTimer.ts    # Accurate timing with Date.now()
│   │   ├── useGameRewards.ts  # Achievement/rank tracking
│   │   └── index.ts
│   │
│   ├── services/
│   │   ├── player.ts          # Profile CRUD
│   │   ├── rank.ts            # Rank calculations
│   │   └── achievements.ts    # Achievement definitions
│   │
│   ├── types/
│   │   ├── game.ts            # Canonical GameId types
│   │   └── index.ts
│   │
│   ├── constants/
│   │   ├── storageKeys.ts     # Centralized localStorage keys
│   │   └── index.ts
│   │
│   ├── styles/
│   │   └── game-common.css    # Shared game styles
│   │
│   └── utils/
│       ├── storage.ts         # localStorage helpers
│       ├── audio.ts           # Sound effects
│       ├── confetti.ts        # Lazy-loaded confetti
│       └── index.ts
│
├── i18n/
│   ├── index.ts               # i18next configuration
│   └── locales/
│       ├── en/common.json     # English translations
│       └── vi/common.json     # Vietnamese translations
│
└── pages/
    └── Dashboard.tsx          # Game selector with profile
```

---

## Module Design

### Game Module Pattern

Each game follows a consistent architecture separating concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                      Game Module                             │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    Logic Layer                         │  │
│  │  • Pure TypeScript (no React dependencies)            │  │
│  │  • Types, Engine, Solver, Presets                     │  │
│  │  • 100% unit testable                                 │  │
│  │  • Immutable state transformations                    │  │
│  └───────────────────────────────────────────────────────┘  │
│                            ▲                                 │
│                            │                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    Hooks Layer                         │  │
│  │  • Custom hooks for game-specific logic               │  │
│  │  • useHistory, usePuzzleState, etc.                   │  │
│  │  • Connects logic to React lifecycle                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                            ▲                                 │
│                            │                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  Component Layer                       │  │
│  │  • Presentational components                          │  │
│  │  • Game-specific UI (PuzzleBoard, RaceTrack, etc.)   │  │
│  │  • CSS animations and themes                          │  │
│  └───────────────────────────────────────────────────────┘  │
│                            ▲                                 │
│                            │                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                Main Game Component                     │  │
│  │  • Orchestrates all layers                            │  │
│  │  • Manages game state machine                         │  │
│  │  • Handles rewards integration                        │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Type System Design

```typescript
// Canonical GameId types (src/shared/types/game.ts)

// Storage format: kebab-case (used in localStorage, achievements)
export type StorageGameId = 'magic-graph' | 'sequence-race' | 'shape-architect';

// Component format: camelCase (used in React components, translation keys)
export type ComponentGameId = 'magicGraph' | 'sequenceRace' | 'shapeArchitect';

// Conversion utilities
export const toStorageId: Record<ComponentGameId, StorageGameId> = {
  magicGraph: 'magic-graph',
  sequenceRace: 'sequence-race',
  shapeArchitect: 'shape-architect',
};

export const toComponentId: Record<StorageGameId, ComponentGameId> = {
  'magic-graph': 'magicGraph',
  'sequence-race': 'sequenceRace',
  'shape-architect': 'shapeArchitect',
};
```

### Storage Key Management

```typescript
// Centralized keys (src/shared/constants/storageKeys.ts)

export const STORAGE_PREFIX = 'math-games';
export const PLAYER_KEY = `${STORAGE_PREFIX}-player`;
export const LANGUAGE_KEY = `${STORAGE_PREFIX}-lang`;
export const SOUND_ENABLED_KEY = `${STORAGE_PREFIX}-sound-enabled`;
export const HIGH_CONTRAST_KEY = `${STORAGE_PREFIX}-high-contrast`;

export function getGameProgressKey(gameId: string): string {
  return `${STORAGE_PREFIX}-${gameId}`;
}
```

---

## State Management

### Context Architecture

```typescript
// PlayerContext provides global player state

interface PlayerContextValue {
  // Profile data
  profile: PlayerProfile;
  rank: PlayerRank;
  rankProgress: RankProgress;

  // Actions
  recordGamePlayed: (gameId: StorageGameId) => void;
  recordPuzzleSolved: (gameId: StorageGameId) => void;
  recordWin: (gameId: StorageGameId) => void;
  unlockAchievement: (achievementId: string) => void;
  updateStreak: () => void;

  // UI State
  pendingRankUp: { previous: PlayerRank; new: PlayerRank } | null;
  clearPendingRankUp: () => void;
}
```

### State Flow Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  User Action │────▶│  Game Logic  │────▶│ State Update │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                                                 ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ localStorage │◀────│   Context    │◀────│  Validator   │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │
       │                    ▼
       │            ┌──────────────┐
       │            │  Achievement │
       │            │    Check     │
       │            └──────────────┘
       │                    │
       ▼                    ▼
┌──────────────┐     ┌──────────────┐
│   Persist    │     │  Rank Check  │
└──────────────┘     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  UI Update   │
                     │ (Toast/Modal)│
                     └──────────────┘
```

---

## Performance Architecture

### Code Splitting Strategy

```typescript
// App.tsx - Lazy loaded routes

const MagicGraphGame = lazy(() => import('./games/MagicGraph'));
const SequenceRaceGame = lazy(() => import('./games/SequenceRace'));
const ShapeArchitectGame = lazy(() => import('./games/ShapeArchitect'));

// Wrapped with ErrorBoundary for crash protection
<Route path="/magic-graph" element={
  <ErrorBoundary>
    <MagicGraphGame />
  </ErrorBoundary>
} />
```

### Vite Chunk Configuration

```typescript
// vite.config.ts

build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        'i18n-vendor': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
        'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
        'dnd-vendor': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
      },
    },
  },
}
```

### Bundle Analysis

| Chunk | Size | Gzip | Loading Strategy |
|-------|------|------|------------------|
| react-vendor | 46 KB | 16 KB | Initial |
| i18n-vendor | 55 KB | 18 KB | Initial |
| Main app | 72 KB | 22 KB | Initial |
| MagicGraph | 20 KB | 6 KB | Lazy |
| SequenceRace | 35 KB | 10 KB | Lazy |
| ShapeArchitect | 39 KB | 12 KB | Lazy |
| three-vendor | 1,134 KB | 321 KB | Lazy (ShapeArchitect only) |
| dnd-vendor | 38 KB | 13 KB | Lazy |
| confetti | 11 KB | 4 KB | Dynamic import on win |

### Timer Accuracy System

```typescript
// useGameTimer.ts - Date.now() based timing

// Problem: setTimeout(1000) accumulates drift over time
// Solution: Use real clock time

useEffect(() => {
  if (timerActive && !isGameOver) {
    const tick = () => {
      const now = Date.now();
      const elapsedMs = now - startTimeRef.current;
      const elapsedSeconds = Math.floor(elapsedMs / 1000) + pausedAtRef.current;

      if (practiceMode) {
        setTimeValue(elapsedSeconds);
      } else {
        const remaining = Math.max(0, duration - elapsedSeconds);
        setTimeValue(remaining);
      }
    };

    // Check every 100ms for smooth second transitions
    timerRef.current = setInterval(tick, 100);
  }
  return () => clearInterval(timerRef.current);
}, [timerActive, isGameOver, practiceMode, duration]);
```

### Memoization Strategy

```typescript
// Timer component - Prevents re-renders from parent

export const Timer = memo(function Timer(props: TimerProps) {
  const handleToggleTimed = useCallback(() => {
    if (!disabled) onModeChange(false);
  }, [disabled, onModeChange]);

  // ... component implementation
});

// Dashboard - Memoized calculations
const progressData = useMemo(() => ({
  gamesPlayed: profile.totalGamesPlayed,
  puzzlesSolved: profile.totalPuzzlesSolved,
  currentRank: rank,
  nextRank: getNextRank(rank),
}), [profile.totalGamesPlayed, profile.totalPuzzlesSolved, rank]);
```

### Animation Performance

All animations use GPU-composited properties only:

```css
/* Good - GPU composited */
.element {
  transform: translateX(10px);
  opacity: 0.5;
  filter: blur(2px);
}

/* Avoid - Triggers layout/paint */
.element {
  left: 10px;     /* Layout */
  width: 100px;   /* Layout */
  background: red; /* Paint */
}
```

Reduced motion support:

```css
@media (prefers-reduced-motion: reduce) {
  .puzzle-board { animation: none; }
  .player-avatar--moving { animation: none; }
  /* All animated elements have reduced-motion variants */
}
```

---

## Internationalization

### Configuration

```typescript
// i18n/index.ts

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { common: enCommon }, vi: { common: viCommon } },
    fallbackLng: 'vi',      // Default to Vietnamese
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  });
```

### Translation Structure

```json
{
  "appTitle": "Math Gymnasium",
  "ranks": {
    "beginner": "Beginner",
    "grandmaster": "Grandmaster"
  },
  "achievements": {
    "global_first_steps": {
      "name": "First Steps",
      "description": "Complete any game for the first time"
    }
  },
  "games": {
    "magicGraph": {
      "title": "Magic Graph",
      "description": "...",
      "tags": ["Addition", "Logic", "Graphs"]
    }
  }
}
```

### Usage Patterns

```typescript
// Simple translation
const { t } = useTranslation();
t('appTitle'); // "Math Gymnasium"

// Nested keys
t('ranks.intermediate'); // "Intermediate"

// Interpolation
t('rankUp.reached', { rank: 'Expert' }); // "You reached Expert!"

// Pluralization
t('stats.gamesNeeded', { count: 5 }); // "5 more games"
```

---

## Gamification System

### Rank Progression

```typescript
// Rank thresholds based on games + solves

const RANK_THRESHOLDS: Record<PlayerRank, { games: number; solves: number }> = {
  beginner:     { games: 0,   solves: 0 },
  learner:      { games: 5,   solves: 3 },
  apprentice:   { games: 15,  solves: 10 },
  intermediate: { games: 30,  solves: 20 },
  advanced:     { games: 60,  solves: 40 },
  expert:       { games: 100, solves: 75 },
  master:       { games: 200, solves: 150 },
  grandmaster:  { games: 500, solves: 300 },
};
```

### Achievement System

```typescript
// 10 Core Achievements

interface Achievement {
  id: string;
  category: 'global' | StorageGameId;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  condition: (profile: PlayerProfile, context?: AchievementContext) => boolean;
}

const ACHIEVEMENTS: Achievement[] = [
  // Global
  { id: 'global_first_steps', category: 'global', rarity: 'common', ... },
  { id: 'global_all_games', category: 'global', rarity: 'rare', ... },
  { id: 'global_streak_30', category: 'global', rarity: 'epic', ... },
  { id: 'global_grandmaster', category: 'global', rarity: 'legendary', ... },

  // Per-game (2 each)
  { id: 'mg_first_solve', category: 'magic-graph', rarity: 'common', ... },
  { id: 'mg_grandmaster', category: 'magic-graph', rarity: 'legendary', ... },
  // ... etc
];
```

### Streak System

```typescript
// Daily streak tracking

function updateStreak(profile: PlayerProfile): PlayerProfile {
  const today = new Date().toDateString();
  const lastPlayed = new Date(profile.lastPlayedDate).toDateString();

  if (today === lastPlayed) {
    return profile; // Already played today
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (lastPlayed === yesterday.toDateString()) {
    // Consecutive day
    return { ...profile, streak: profile.streak + 1, lastPlayedDate: Date.now() };
  }

  // Streak broken
  return { ...profile, streak: 1, lastPlayedDate: Date.now() };
}
```

---

## Build & Bundle Strategy

### Development

```bash
npm run dev          # Vite dev server with HMR
npm run lint         # ESLint with TypeScript rules
npm test             # Vitest in watch mode
```

### Production

```bash
npm run build        # TypeScript + Vite production build
npm run preview      # Preview production build
```

### Bundle Optimization Techniques

1. **Code Splitting**: Games lazy-loaded on navigation
2. **Vendor Chunks**: React, i18n, three.js separated
3. **Dynamic Imports**: Confetti loaded only on win
4. **Tree Shaking**: Unused code eliminated
5. **Asset Optimization**: CSS/JS minified, gzipped

---

## Testing Strategy

### Test Distribution

| Layer | Framework | Coverage |
|-------|-----------|----------|
| Game Logic | Vitest | 100% |
| Hooks | Vitest + React Testing Library | 90% |
| Storage Utils | Vitest | 100% |
| Components | Manual + E2E | Planned |

### Test Structure

```typescript
// Game logic tests - Pure unit tests
describe('MagicGraph Solver', () => {
  it('finds valid solution for solvable puzzle', () => {
    const puzzle = createPuzzle(template);
    const solution = solvePuzzle(puzzle);
    expect(solution).toBeDefined();
    expect(validateSolution(puzzle, solution)).toBe(true);
  });
});

// Hook tests - React Testing Library
describe('useGameTimer', () => {
  it('counts down accurately in timed mode', async () => {
    const { result } = renderHook(() => useGameTimer({ duration: 10 }));
    expect(result.current.timeLeft).toBe(10);

    await waitFor(() => {
      expect(result.current.timeLeft).toBeLessThan(10);
    });
  });
});
```

---

## Future Research Areas

### Priority 1: Component Architecture

**Problem**: Main game components are 500-700 lines each.

**Research Areas**:
- Extract `<PuzzleControls>`, `<HintsPanel>`, `<GameOverlays>` components
- Implement compound component pattern for game UI
- Evaluate state machines (XState) for game flow

**Estimated Impact**: 40% reduction in main component complexity

### Priority 2: Three.js Optimization

**Problem**: three-vendor chunk is 1,134 KB (321 KB gzipped).

**Research Areas**:
- Tree-shakeable three.js imports (three/addons)
- WebGL context sharing between 2D/3D modes
- Progressive loading of 3D assets
- DRACO compression for geometry
- Instanced rendering for voxel grids

**Potential Savings**: 300-500 KB

### Priority 3: Offline Support

**Problem**: App requires network for initial load.

**Research Areas**:
- Service Worker with Workbox
- IndexedDB for game progress sync
- Background sync for achievements
- Precaching strategy for game assets

**User Impact**: Full offline gameplay capability

### Priority 4: Adaptive Difficulty

**Problem**: Fixed difficulty levels may not match individual learning pace.

**Research Areas**:
- Player performance tracking (solve time, hint usage)
- Spaced repetition for concept reinforcement
- Dynamic puzzle generation based on skill level
- A/B testing framework for difficulty tuning

**Educational Impact**: Personalized learning paths

### Priority 5: Accessibility Enhancements

**Current State**: Basic a11y (ARIA labels, keyboard nav, reduced motion)

**Research Areas**:
- Screen reader optimization for game boards
- Color-blind safe palette options
- Voice input for number placement
- Haptic feedback for mobile
- Cognitive load reduction modes

### Priority 6: Analytics & Telemetry

**Problem**: No insight into player behavior.

**Research Areas**:
- Privacy-first analytics (no PII)
- Learning analytics dashboard
- Puzzle difficulty calibration
- Drop-off point identification
- A/B testing infrastructure

### Priority 7: Multiplayer Features

**Current State**: Single-player only (2P local in SequenceRace)

**Research Areas**:
- WebRTC for peer-to-peer gameplay
- Real-time leaderboards
- Classroom mode (teacher dashboard)
- Cooperative puzzle solving
- Competitive time trials

---

## Technical Debt Registry

### High Priority

| ID | Description | Location | Effort |
|----|-------------|----------|--------|
| TD-001 | Remove duplicated CSS from game files | `games/*/\*.css` | Medium |
| TD-002 | Split large game components | `*Game.tsx` files | Large |
| TD-003 | Add E2E tests | New test suite | Large |

### Medium Priority

| ID | Description | Location | Effort |
|----|-------------|----------|--------|
| TD-004 | Self-host Google Fonts | `index.css` | Small |
| TD-005 | Remove unused setSoundVolume | `audio.ts` | Trivial |
| TD-006 | Move Button animations to CSS | `Button.tsx` | Small |
| TD-007 | Fix module-level mutable state | `AchievementToast.tsx` | Small |
| TD-008 | Add useCallback to NumberInventory | `NumberInventory.tsx` | Small |

### Low Priority

| ID | Description | Location | Effort |
|----|-------------|----------|--------|
| TD-009 | Replace !important in CSS | `ShapeArchitect.css` | Trivial |
| TD-010 | Add empty array check in puzzles | `puzzles.ts` | Trivial |
| TD-011 | Consider splitting PlayerContext | `PlayerContext.tsx` | Medium |

---

## Appendix

### A. Design System Tokens

```css
:root {
  /* Colors */
  --color-primary: hsl(12, 90%, 62%);    /* Warm Coral */
  --color-secondary: hsl(174, 65%, 42%); /* Soft Teal */
  --color-accent: hsl(45, 100%, 55%);    /* Sunny Yellow */
  --color-magic: hsl(270, 75%, 60%);     /* Magic Purple */
  --color-success: hsl(145, 65%, 42%);   /* Leafy Green */
  --color-warning: hsl(38, 92%, 50%);    /* Amber */
  --color-error: hsl(0, 84%, 60%);       /* Coral Red */

  /* Typography */
  --font-display: 'Quicksand', sans-serif;
  --font-body: 'Nunito', sans-serif;

  /* Spacing Scale */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
}
```

### B. Game Theme Summary

| Game | Theme | Primary Animation |
|------|-------|-------------------|
| MagicGraph | Mystical Constellation | Star glow, line shimmer |
| SequenceRace | Track & Field | Stick figure running, dust trails |
| ShapeArchitect | Building Workshop | Wood grain, snap wobble |

### C. localStorage Schema

```typescript
interface StorageSchema {
  'math-games-player': PlayerProfile;
  'math-games-magic-graph': GameProgress;
  'math-games-sequence-race': GameProgress;
  'math-games-shape-architect': GameProgress;
  'math-games-lang': 'en' | 'vi';
  'math-games-sound-enabled': boolean;
  'math-games-high-contrast': boolean;
}

interface PlayerProfile {
  name: string;
  totalGamesPlayed: number;
  totalPuzzlesSolved: number;
  totalWins: number;
  streak: number;
  lastPlayedDate: number;
  achievements: string[];
  gamesPlayed: Record<StorageGameId, number>;
  puzzlesSolved: Record<StorageGameId, number>;
}

interface GameProgress {
  completedLevels: Record<Difficulty, number[]>;
  bestTimes: Record<string, number>;
}
```

### D. Performance Benchmarks

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| FCP (First Contentful Paint) | < 1.5s | 1.2s | Pass |
| LCP (Largest Contentful Paint) | < 2.5s | 2.0s | Pass |
| TTI (Time to Interactive) | < 3.0s | 2.8s | Pass |
| CLS (Cumulative Layout Shift) | < 0.1 | 0.05 | Pass |
| Initial Bundle (gzipped) | < 100KB | 85KB | Pass |

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | Jan 2026 | Post-optimization update, added future research |
| 1.0 | Dec 2025 | Initial architecture documentation |
