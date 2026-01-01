# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Commands

```bash
npm run dev          # Start Vite dev server with HMR
npm run build        # TypeScript compilation + Vite production build
npm run lint         # ESLint with TypeScript-aware rules
npm run preview      # Preview production build locally
npm test             # Run tests in watch mode (Vitest)
npm run test:coverage # Run tests with coverage report
```

## Architecture

React + TypeScript SPA for educational math games (primary to middle school). Uses Vite bundling and react-router-dom navigation.

### Project Structure

```
src/
├── App.tsx                 # Routes with React.lazy code splitting
├── games/                  # Each game is a self-contained module
│   ├── MagicGraph/         # Graph-based number placement puzzle
│   ├── SequenceRace/       # Turn-based strategy game vs AI
│   └── ShapeArchitect/     # Voxel-based geometry puzzle
├── shared/
│   ├── components/         # Reusable UI components
│   │   ├── ui/             # Primitives: Button, Timer, ProgressRing
│   │   ├── layout/         # Layout: GameLayout, GameCard, DashboardTabs
│   │   ├── gamification/   # StatsDisplay, AchievementToast, RankUpOverlay
│   │   ├── DailyChallenge/ # DailyChallenge, DailyChallengeBanner
│   │   ├── Tutorial/       # Tutorial overlay system
│   │   └── icons/          # Custom SVG game icons
│   ├── contexts/           # PlayerContext (stats, rank, achievements)
│   ├── hooks/              # Categorized hooks with barrel exports
│   │   ├── game/           # useGameTimer, useGameRewards, useGameKeyboard
│   │   ├── accessibility/  # useFocusTrap, useAnnounce, useHighContrast
│   │   ├── gestures/       # useSwipe, usePinchZoom, useDragScroll
│   │   └── useTutorial.ts  # Cross-cutting tutorial hook
│   ├── schemas/            # Zod schemas (extracted from utils)
│   │   ├── playerProfile.schema.ts
│   │   ├── daily.schema.ts
│   │   └── storage.schema.ts
│   ├── services/           # player.ts, rank.ts, achievements.ts, daily.ts
│   └── utils/              # storage.ts, audio.ts, TypedStorage
├── i18n/                   # Internationalization (EN/VI)
└── pages/
    └── Dashboard/          # Tabbed dashboard with folder structure
        ├── Dashboard.tsx   # Main component with tab state
        ├── CompactHeader.tsx
        └── tabs/           # Tab panel components
            ├── PlayTab.tsx
            ├── StatsTab.tsx
            └── AchievementsTab.tsx
```

### Path Aliases

Use path aliases for all imports from `src/`:

```typescript
// Preferred:
import { GameLayout } from '@/shared/components';
import { useGameTimer } from '@/shared/hooks';

// Instead of:
import { GameLayout } from '../../shared/components';
```

Configured in `tsconfig.app.json` and `vite.config.ts`.

### Game Module Pattern

Each game follows this structure:
- `logic/` - Pure TypeScript game engine (types, solver/engine, presets)
- `components/` - React UI components specific to the game
- `hooks/` - Game-specific React hooks (e.g., useThreeCleanup)
- `[GameName]Game.tsx` - Main game component with state management
- `index.ts` - Barrel export

### Code Splitting

Games are lazy-loaded in `App.tsx`:
- Core bundle: ~1MB (React, router, i18n, shared)
- MagicGraph: ~20KB
- SequenceRace: ~40KB
- ShapeArchitect: ~370KB (includes three.js)

### Dashboard Tabs

The Dashboard uses a tabbed layout with three views:

| Tab | Component | Content |
|-----|-----------|---------|
| Play | `PlayTab` | Game grid + DailyChallengeBanner |
| Stats | `StatsTab` | Overall stats, rank progress, per-game breakdown |
| Achievements | `AchievementsTab` | Full gallery by category |

```typescript
import { DashboardTabs, type DashboardTabId } from '@/shared/components/layout';

const [activeTab, setActiveTab] = useState<DashboardTabId>('play');
```

Key features:
- **CompactHeader**: Rank badge, player name, streak, and settings controls
- **Tab animations**: Fade-in with `prefers-reduced-motion` support
- **Responsive**: Icons-only on mobile (<600px), full labels on tablet+
- **Accessible**: Proper `tablist`/`tab`/`tabpanel` ARIA roles

---

## Progression System

### Counter-Based Stats (No XP)

Players progress through simple counters, not points:
- `totalGamesPlayed` - Any timed game completion
- `totalPuzzlesSolved` - MagicGraph & ShapeArchitect solves
- `totalWins` - SequenceRace wins

### Rank System

Ranks are based on games played + puzzles solved:

| Rank | Games | Solves |
|------|-------|--------|
| Beginner | 0 | 0 |
| Learner | 5 | 3 |
| Apprentice | 15 | 10 |
| Intermediate | 30 | 20 |
| Advanced | 60 | 40 |
| Expert | 100 | 75 |
| Master | 200 | 150 |
| Grandmaster | 500 | 300 |

### Practice Mode

Practice mode = **zero tracking**. No stats, no achievements, no progress saved.
Use practice mode purely for learning without pressure.

### Achievements (10 total)

- Global: first_steps, all_games, streak_30, grandmaster
- MagicGraph: first_solve, grandmaster
- SequenceRace: first_victory, hard_winner
- ShapeArchitect: first_build, master_architect

---

## Key Patterns

### Performance
- **React.memo**: Applied to `GameCard` and frequently-rendered components
- **useMemo**: Dashboard memoizes progress calculations
- **useCallback**: All context actions wrapped
- **Lazy initialization**: `useState(() => getPlayerProfile())` for localStorage
- **Code splitting**: Games loaded on-demand
- **Three.js cleanup**: `useThreeCleanup()` hook prevents GPU memory leaks

### TypedStorage with Zod

Use `TypedStorage` for localStorage operations with runtime validation:

```typescript
import { TypedStorage, PlayerProfileSchema } from '@/shared/utils';

const storage = new TypedStorage(
  'player-profile',
  PlayerProfileSchema,
  createDefaultProfile()
);

const profile = storage.get(); // Always returns valid data
storage.set({ ...profile, streak: 5 }); // Validates before storing
```

See `docs/adr/0002-typed-storage-zod.md` for details.

### Three.js Memory Management

For 3D scenes (ShapeArchitect), use the cleanup hook:

```typescript
function Scene3DContent() {
  useThreeCleanup(); // Must be inside Canvas
  return <>{/* scene content */}</>;
}
```

This disposes geometries, materials, and textures on unmount.

### Toast Staggering
```tsx
{toastQueue.map((achievement, index) => (
  <AchievementToast key={achievement.id} delay={index * 500} ... />
))}
```

### Sound Throttling
Module-level cooldown (2s) prevents audio chaos with multiple toasts.

### CSS
- Global design system in `src/index.css`
- Component-specific CSS colocated
- BEM naming: `.achievement-toast__icon`
- CSS variables: `--color-primary`, `--space-md`

### Animations
Each game has a distinct visual theme with CSS-only animations:

**MagicGraph** - "Mystical Constellation"
- Starfield background with twinkling stars
- Golden glow on fixed nodes (`starGlow`)
- Shimmer on completed lines (`lineShimmer`)
- Particle burst on placement (`particleExpand` via `drop-shadow`)
- Constellation reveal on win (`constellationReveal`)

**SequenceRace** - "Track & Field"
- CSS stick figures replace emoji runners
- Running animation: arm swing, leg stride, body lean
- Victory/defeat poses
- Multi-particle dust trail

**ShapeArchitect** - "Building Workshop"
- Wood grain workbench background
- Blueprint grid on target cells
- Snap wobble animation (`snapPlaceWobble`)
- Dust burst with ring effect

**Animation Performance:**
- All animations use GPU-composited properties: `transform`, `opacity`, `filter`
- SVG particles created via multi-directional `drop-shadow()` filters
- Reduced motion: All games respect `@media (prefers-reduced-motion: reduce)`

---

## Internationalization

Bilingual (EN/VI) via react-i18next. Default: Vietnamese.

```typescript
const { t } = useTranslation();
t('ranks.intermediate');  // "Intermediate" or "Trung cấp"
```

---

## Design System

### Colors
```css
--color-primary: hsl(12, 90%, 62%)    /* Warm Coral */
--color-secondary: hsl(174, 65%, 42%) /* Soft Teal */
--color-accent: hsl(45, 100%, 55%)    /* Sunny Yellow */
--color-magic: hsl(270, 75%, 60%)     /* Magic Purple */
--color-success: hsl(145, 65%, 42%)   /* Leafy Green */
```

### Typography
- Display: 'Quicksand' (titles, headings)
- Body: 'Nunito' (text, buttons)

---

## Documentation

- `docs/ARCHITECTURE.md` - System overview, patterns, dependencies
- `docs/adr/` - Architectural Decision Records
- `CONTRIBUTING.md` - Contributing guidelines
