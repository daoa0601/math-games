# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Commands

```bash
# Development
npm run dev          # Start Vite dev server with HMR
npm run build        # TypeScript compilation + Vite production build
npm run lint         # ESLint with TypeScript-aware rules
npm run preview      # Preview production build locally

# Testing
npm test             # Run unit tests in watch mode (Vitest)
npm run test:coverage # Run unit tests with coverage report
npm run test:e2e     # Run Playwright E2E tests (logs to logs/e2e-results.{log,json})
npm run test:e2e:ui  # Run E2E tests with interactive UI
npm run test:e2e:report # View HTML report of last E2E test run
cat logs/e2e-results.log # View E2E console output without re-running
jq '.stats' logs/e2e-results.json # Parse E2E results programmatically

# Component Development
npm run storybook       # Launch Storybook component explorer
npm run build-storybook # Build static Storybook site
```

## Architecture

React + TypeScript SPA for educational math games (primary to middle school). Uses Vite bundling, react-router-dom navigation, and Firebase for optional cloud sync.

### Firebase Integration

The app uses Firebase for authentication and data sync while keeping localStorage as the primary data store:

| Service | Purpose | Status |
|---------|---------|--------|
| Firebase Auth | Anonymous + Google sign-in | ✅ Enabled |
| Cloud Firestore | Player data sync | ✅ Configured |
| Offline Persistence | IndexedDB cache | ✅ Enabled |

**Key Architecture Decisions:**
- **localStorage-first**: All data saves to localStorage immediately, then syncs to Firestore
- **Non-blocking auth**: Users can play immediately as guests, auth happens in background
- **2-second debounce**: Firestore writes are debounced to reduce API calls
- **Offline-capable**: Full gameplay works without internet, syncs when reconnected

```
src/firebase/
├── config.ts               # Firebase configuration
├── index.ts                # App initialization with offline persistence
├── auth.ts                 # Auth functions (anonymous, Google, email)
├── loader.ts               # Lazy loading for code splitting
├── FirebaseAuthContext.tsx # Auth state provider (React context)
├── FirebaseAuthContexts.ts # Auth context type definitions
├── useFirebaseAuthHooks.ts # Custom hooks for auth state
├── services/
│   ├── index.ts            # Barrel export
│   ├── playerService.ts    # Firestore CRUD for profiles
│   └── migrationService.ts # localStorage → Firestore migration
└── sync/
    ├── index.ts            # Barrel export
    └── syncManager.ts      # Debounced sync with rate limiting
```

**Firebase Project:** `han-edu-central`
**Feature Flag:** `VITE_USE_FIREBASE=true` (set to `false` to disable)

### Project Structure

```
src/
├── App.tsx                 # Routes with React.lazy code splitting
├── firebase/               # Firebase integration (auth, sync, services)
├── games/                  # Each game is a self-contained module
│   ├── MagicGraph/         # Graph-based number placement puzzle
│   ├── SequenceRace/       # Turn-based strategy game vs AI
│   └── ShapeArchitect/     # Voxel-based geometry puzzle
├── shared/
│   ├── components/         # Reusable UI components
│   │   ├── ui/             # Primitives: Button, Timer, BottomSheet, SettingsDrawer
│   │   │   └── shadcn/     # shadcn/ui components (see shadcn section below)
│   │   ├── layout/         # Layout: GameLayout, GameCard, DashboardTabs
│   │   ├── overlays/       # VictoryModal (unified game-end overlay)
│   │   ├── gamification/   # StatsDisplay, AchievementToast, RankUpOverlay
│   │   ├── auth/           # AuthModal, SignInButton, AccountLinkBanner
│   │   ├── DailyChallenge/ # DailyChallenge, DailyChallengeBanner
│   │   ├── FeedbackModal/  # User feedback submission
│   │   ├── LearnModal/     # Educational content modal with game tutorials
│   │   ├── PersonalBest/   # Personal best display component
│   │   ├── Tutorial/       # Tutorial overlay system
│   │   └── icons/          # Custom SVG game icons
│   ├── constants/          # App-wide constants
│   ├── contexts/           # PlayerContext (stats, rank, achievements)
│   ├── hooks/              # Categorized hooks with barrel exports
│   │   ├── game/           # useGameTimer, useGameRewards, useGameKeyboard
│   │   ├── accessibility/  # useFocusTrap, useAnnounce, useHighContrast
│   │   ├── gestures/       # useSwipe, usePinchZoom, useDragScroll
│   │   ├── device/         # useDeviceType, useOrientation
│   │   ├── firebase/       # useFirebaseSync, useAuthState
│   │   └── useTutorial.ts  # Cross-cutting tutorial hook
│   ├── lib/                # Utility functions
│   │   └── utils.ts        # cn() helper for shadcn class merging
│   ├── machines/           # XState state machines
│   ├── schemas/            # Zod schemas (extracted from utils)
│   │   ├── playerProfile.schema.ts
│   │   ├── daily.schema.ts
│   │   └── storage.schema.ts
│   ├── services/           # player.ts, rank.ts, achievements.ts, daily.ts
│   ├── styles/             # CSS architecture (see CSS section below)
│   ├── types/              # TypeScript type definitions
│   └── utils/              # storage.ts, audio.ts, TypedStorage
├── i18n/                   # Internationalization (EN/VI)
└── pages/
    └── Dashboard/          # Tabbed dashboard with folder structure
        ├── Dashboard.tsx   # Main component with tab state
        ├── CompactHeader.tsx
        └── tabs/           # Tab panel components
            ├── PlayTab.tsx
            ├── StatsTab.tsx
            ├── AchievementsTab.tsx
            └── LearnTab.tsx
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

The Dashboard uses a tabbed layout with four views:

| Tab | Component | Content |
|-----|-----------|---------|
| Play | `PlayTab` | Game grid + DailyChallengeBanner |
| Stats | `StatsTab` | Overall stats, rank progress, per-game breakdown |
| Achievements | `AchievementsTab` | Full gallery by category |
| Learn | `LearnTab` | Educational content and game tutorials |

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

### Centralized Storage Keys

All localStorage keys are centralized in `src/shared/constants/storageKeys.ts`:

```typescript
// Import constants, never hardcode key strings
import { PLAYER_KEY, LANGUAGE_KEY, SOUND_ENABLED_KEY, THEME_KEY } from '@/shared/constants/storageKeys';

// Keys follow naming convention: `${STORAGE_PREFIX}-${name}`
// STORAGE_PREFIX = 'math-games'
```

**Why this matters:**
- Prevents typos in localStorage key strings
- Single source of truth for all storage keys
- Makes refactoring easier (change in one place)
- `ALL_STATIC_KEYS` array helps with debugging/clearing data

### CSS Architecture

**Two Surface Types:**

| Type | Used For | Styling Rules |
|------|----------|---------------|
| Editorial (flat) | Buttons, inputs, labels, game boards | No gradients, no shadows, border-radius ≤2px |
| Premium (credit card) | Cards, modals, navigation, achievements | Gradients allowed, 8px radius, soft shadows |

**Files:**
- `src/index.css` - Global design system + slab styling
- `src/shared/styles/tokens/` - Design tokens (palette, type, scale, motion)
- `src/shared/styles/shadcn-theme.css` - Tailwind v4 + shadcn variable mapping
- `src/shared/styles/premium-surfaces.css` - Credit card aesthetic classes
- `src/shared/styles/a11y.css` - Accessibility styles (focus rings, high contrast)
- `src/shared/styles/game-base.css` - Shared game component styles
- `src/shared/styles/hints.css` - Hint system styling
- `src/shared/styles/orientation.css` - Device orientation handling
- `src/shared/styles/patterns.css` - Decorative pattern backgrounds
- `src/shared/styles/patterns-vn.css` - Vietnamese-themed patterns

**Tailwind CSS v4 Integration:**
- Uses `tw:` prefix (e.g., `tw:flex`, `tw:text-primary`) to avoid conflicts with existing CSS
- Configured via CSS-first approach in `shadcn-theme.css`
- shadcn components use `--shadcn-*` prefixed variables to avoid overwriting design tokens

```typescript
// Using cn() helper for conditional classes
import { cn } from '@/shared/lib/utils';

<div className={cn('tw:flex tw:gap-2', isActive && 'tw:bg-primary')} />
```

**Credit Card Tokens:**
```css
--card-gradient: linear-gradient(135deg, #1b263b 0%, #0d1b2a 50%, #1b263b 100%);
--card-radius: 8px;
--card-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
--gold-gradient: linear-gradient(90deg, #d4af37 0%, #f5d67a 50%, #d4af37 100%);
--text-emboss: 0 1px 0 rgba(255,255,255,0.1), 0 -1px 0 rgba(0,0,0,0.3);
```

**CSS Variables for Colors (Important Pattern):**
Always use semantic CSS variables instead of hardcoded colors:

```css
/* ✅ Correct - uses semantic variable */
color: var(--error);        /* Error states */
color: var(--success);      /* Success states */
color: var(--warning);      /* Warning states */
border-color: var(--accent); /* Accent borders */

/* ❌ Wrong - hardcoded color */
color: #ef4444;             /* Error - doesn't adapt to themes */
color: #10b981;             /* Success - doesn't adapt to themes */
```

**Defined in:** `src/shared/styles/tokens/palette.css`

**Why this matters:**
- Enables proper theme switching (light/dark mode)
- Single source of truth for color semantics
- Easier to update colors globally
- Prevents inconsistencies across the codebase

### shadcn/ui Components

Located in `src/shared/components/ui/shadcn/`. Components follow two styling modes:

**Premium surfaces** (credit card aesthetic):
| Component | Usage |
|-----------|-------|
| `Sheet` | Bottom sheets, side drawers |
| `Dialog` | Modal dialogs, confirmations |
| `Toaster` + `toast` | Toast notifications (via Sonner) |

**Editorial flat style** (primitives):
| Component | Usage |
|-----------|-------|
| `Button` | Buttons with variants: default, secondary, ghost, success, destructive, link |
| `Input` | Text inputs |
| `Label` | Form labels (uppercase, monospace) |
| `Textarea` | Multi-line text inputs |
| `Select` | Dropdown selects with Radix UI |

```typescript
// Example: Using Button
import { Button } from '@/shared/components/ui/shadcn';

<Button variant="default">Primary Action</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="ghost" size="icon"><Icon /></Button>

// Example: Using form primitives
import { Input, Label, Textarea, Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/shared/components/ui/shadcn';

<div>
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="you@example.com" />
</div>

<Select>
  <SelectTrigger><SelectValue placeholder="Choose..." /></SelectTrigger>
  <SelectContent>
    <SelectItem value="a">Option A</SelectItem>
    <SelectItem value="b">Option B</SelectItem>
  </SelectContent>
</Select>

// Example: Using toast
import { toast } from '@/shared/components/ui/shadcn';

toast.success('Achievement unlocked!');
toast.error('Game over');
```

**Adding new shadcn components:**
1. Use `npx shadcn@latest add <component>`
2. Component installs to `src/shared/components/ui/shadcn/`
3. Apply `tw:` prefix to all Tailwind classes
4. Premium surfaces: Use `premium-modal` or `premium-surface` classes
5. Editorial primitives: No shadows, no gradients, no border-radius
6. Export from `src/shared/components/ui/shadcn/index.ts`

### Animations
**Minimal feedback only** - no idle animations, no playful theming.

- Flash feedback: `flash-success` (green), `flash-warning` (amber)
- All flashes are one-time, 0.3s, then return to normal
- **NO** float, wiggle, pulse, or permanent glow effects
- **NO** translateY hover lifts (use opacity/border-color only)
- Reduced motion: Respect `@media (prefers-reduced-motion: reduce)`

---

## Internationalization

Bilingual (EN/VI) via react-i18next. Default: Vietnamese.

```typescript
const { t } = useTranslation();
t('ranks.intermediate');  // "Intermediate" or "Trung cấp"
```

---

## Design System

**Vietnamese Premium** - Elegant, dark-first, mobile-friendly with credit card aesthetic for premium surfaces.

### Color Palette
```css
/* Backgrounds */
--bg-primary: #0d1b2a;    /* Deep navy base */
--bg-secondary: #1b263b;  /* Card backgrounds */
--surface: #1b263b;       /* Alias for bg-secondary */

/* Vietnamese Accents */
--accent-gold: #d4af37;   /* Primary accent (gold) */
--accent-emerald: #10b981; /* Success states */
--accent-coral: #f97316;  /* Warnings */
--accent-lotus: #e11d48;  /* Errors */

/* Text */
--text-primary: #f1f5f9;  /* Main text */
--text-muted: #64748b;    /* Secondary text */
--border: #334155;        /* Borders */
```

### Typography
- Display: `Crimson Pro` (Vietnamese-friendly serif for headings)
- UI/Data: `Space Grotesk` (modern geometric sans-serif)

### Surface Rules

**Editorial surfaces** (buttons, inputs, game boards):
- NO gradients (flat colors only)
- NO box-shadow (use 1px borders)
- NO border-radius >2px

**Premium surfaces** (cards, modals, navigation):
- Credit card gradient background allowed
- 8px border-radius
- Soft shadows (`0 4px 24px rgba(0,0,0,0.4)`)
- Gold gradient accents on active/featured states
- **NO diagonal shine animation** (removed for cleaner UX)

---

## Testing

### Test Layers

| Layer | Tool | Count | Purpose |
|-------|------|-------|---------|
| Unit | Vitest | 637 tests | Game logic, utilities, hooks |
| Component | Storybook | 26 stories | Visual component development |
| E2E | Playwright | 260 tests | Full user flows across games |

### Running Tests

```bash
npm test              # Unit tests in watch mode
npm run test:coverage # Unit tests with coverage
npm run test:e2e      # E2E tests (headless)
npm run test:e2e:ui   # E2E tests with interactive UI
npm run storybook     # Component explorer
```

### E2E Test Results Logging

**All E2E test runs are automatically logged** to avoid re-running tests to diagnose failures.

```bash
# Run tests - results automatically saved to both files
npm run test:e2e

# View human-readable console output (with colors, errors, stack traces)
cat logs/e2e-results.log

# Quick diagnostic: which tests failed?
grep -E "✗|failed|error" logs/e2e-results.log

# Get summary of last test run
tail -20 logs/e2e-results.log

# Parse programmatically (JSON format)
cat logs/e2e-results.json | jq '.stats'
```

**Two log files are generated:**
| File | Format | Purpose |
|------|--------|---------|
| `logs/e2e-results.log` | Text (console output) | Human-readable with colors, errors, stack traces |
| `logs/e2e-results.json` | JSON | Machine-readable for programmatic analysis |

`★ Insight ─────────────────────────────────────`
**Why file logging matters:** E2E tests are slow (~5-10 minutes). Without logs, you'd need to re-run the entire suite just to see which specific test failed. The log file preserves all test names, pass/fail status, and error messages for instant inspection.
`─────────────────────────────────────────────────`

### E2E Test Structure

```
e2e/
├── fixtures/          # Test data and helpers
├── pages/             # Page Object Models
├── dashboard.spec.ts  # Dashboard tests (30 tests)
├── magic-graph.spec.ts
├── sequence-race.spec.ts
├── shape-architect.spec.ts
├── accessibility.spec.ts
├── daily-challenge.spec.ts
├── progression.spec.ts
└── navigation.spec.ts
```

---

## Theme System

**Fully functional theme switching** - Users can toggle between light, dark, and system modes via a button in the bottom navigation.

### Theme Provider Setup
- `ThemeProvider` is in `src/main.tsx` as the outermost wrapper
- `ThemeContext` provides `theme`, `resolvedTheme`, and `setTheme`
- Uses `THEME_KEY` from `src/shared/constants/storageKeys.ts` (centralized localStorage keys)
- Default: `'system'` (respects OS preference on first visit)

### Theme Toggle Component
Located at `src/shared/components/ThemeToggle.tsx`:
- Integrated into `BottomNav` between feedback and "more" button
- Cycles: light → dark → system → light
- Icons: sun (light), moon (dark), circle with dot (system)
- Persists choice to localStorage

### Theme Switching Implementation
```css
/* Theme is applied via data attribute on html element */
html[data-theme="dark"]  { /* dark mode variables */ }
html[data-theme="light"] { /* light mode variables */ }
```

**Important:** When modifying theme-related code, remember:
- ThemeProvider is in `main.tsx`, NOT in `App.tsx` (avoid duplicates)
- Use `THEME_KEY` constant from `storageKeys.ts`, never hardcode the key string
- Theme defaults to `'system'`, not `'light'` (respects user's OS preference)

---

## Documentation

- `docs/ARCHITECTURE.md` - System overview, patterns, dependencies
- `docs/adr/` - Architectural Decision Records
- `CONTRIBUTING.md` - Contributing guidelines
