# Math Gymnasium Architecture

This document provides a comprehensive overview of the Math Gymnasium system architecture.

## System Overview

Math Gymnasium is a **React + TypeScript Single Page Application (SPA)** designed for educational math games targeting primary to middle school students.

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| UI Framework | React 19 | Component-based UI |
| Language | TypeScript 5.9 | Type safety |
| Bundler | Vite 7 | Fast development and builds |
| Routing | react-router-dom 7 | Client-side navigation |
| Backend | Firebase (Firestore + Auth) | Cloud sync & authentication |
| i18n | react-i18next | English/Vietnamese support |
| State Validation | Zod 4 | Runtime type validation |
| 3D Graphics | Three.js + @react-three/fiber | ShapeArchitect game |
| Drag & Drop | @dnd-kit | Piece manipulation |
| Animations | canvas-confetti | Win celebrations |

---

## Project Structure

```
math-gymnasium/
├── src/
│   ├── App.tsx                 # Route definitions with React.lazy
│   ├── main.tsx                # Application entry point
│   ├── index.css               # Global design system
│   │
│   ├── games/                  # Game modules (self-contained)
│   │   ├── MagicGraph/         # Graph-based puzzle
│   │   ├── SequenceRace/       # Turn-based strategy vs AI
│   │   └── ShapeArchitect/     # Voxel geometry puzzle
│   │
│   ├── pages/
│   │   └── Dashboard/          # Main hub with tabs
│   │       ├── Dashboard.tsx
│   │       ├── CompactHeader.tsx
│   │       └── tabs/
│   │           ├── PlayTab.tsx
│   │           ├── StatsTab.tsx
│   │           ├── AchievementsTab.tsx
│   │           └── LearnTab.tsx
│   │
│   ├── shared/
│   │   ├── components/         # Reusable UI
│   │   │   ├── ui/             # Button, Timer, ProgressRing
│   │   │   ├── layout/         # GameLayout, GameCard, DashboardTabs
│   │   │   ├── gamification/   # StatsDisplay, AchievementToast
│   │   │   ├── DailyChallenge/ # Daily challenge system
│   │   │   ├── Tutorial/       # Tutorial overlay
│   │   │   └── icons/          # Custom SVG icons
│   │   │
│   │   ├── contexts/           # React Context providers
│   │   │   └── PlayerContext   # Global player state
│   │   │
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── game/           # useGameTimer, useGameRewards
│   │   │   ├── accessibility/  # useFocusTrap, useAnnounce
│   │   │   └── gestures/       # useSwipe, usePinchZoom
│   │   │
│   │   ├── schemas/            # Zod validation schemas
│   │   │   ├── playerProfile.schema.ts
│   │   │   ├── daily.schema.ts
│   │   │   └── storage.schema.ts
│   │   │
│   │   ├── services/           # Business logic
│   │   │   ├── player.ts       # Profile management
│   │   │   ├── rank.ts         # Rank calculation
│   │   │   ├── achievements.ts # Achievement tracking
│   │   │   └── daily.ts        # Daily challenges
│   │   │
│   │   └── utils/              # Utilities
│   │       ├── storage.ts      # Legacy storage helpers
│   │       ├── TypedStorage.ts # Type-safe localStorage
│   │       └── audio.ts        # Sound effects
│   │
│   └── i18n/                   # Internationalization
│       ├── index.ts            # i18next configuration
│       ├── en.json             # English translations
│       └── vi.json             # Vietnamese translations
│
├── docs/                       # Documentation
│   ├── ARCHITECTURE.md         # This file
│   └── adr/                    # Architectural Decision Records
│
└── public/                     # Static assets
```

---

## Data Flow

### PlayerContext Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        PlayerProvider                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    PlayerContext                     │    │
│  │  - profile: PlayerProfile                           │    │
│  │  - updateStats()                                    │    │
│  │  - unlockAchievement()                              │    │
│  │  - checkRankUp()                                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                            │                                 │
│                            ▼                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              TypedStorage<PlayerProfile>            │    │
│  │  ┌───────────────────────────────────────────────┐  │    │
│  │  │  Zod Schema Validation                        │  │    │
│  │  │  - PlayerProfileSchema                        │  │    │
│  │  │  - Runtime type checking                      │  │    │
│  │  │  - Migration support                          │  │    │
│  │  └───────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
│                            │                                 │
│                            ▼                                 │
│                      localStorage                            │
└─────────────────────────────────────────────────────────────┘
```

### Data Validation Flow

1. **Read from storage**: `localStorage` -> JSON.parse -> Zod validation -> Typed data
2. **Write to storage**: Typed data -> Zod validation -> JSON.stringify -> `localStorage`
3. **On validation failure**: Return default value, log warning

---

## Firebase Integration

The app uses Firebase for optional cloud sync while keeping localStorage as the primary data store.

### Firebase Project

| Property | Value |
|----------|-------|
| Project ID | `han-edu-central` |
| Region | `nam5` (US Central) |
| Auth Providers | Anonymous, Google |
| Firestore | Enabled with security rules |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        React App                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   PlayerContext                      │    │
│  │  - Manages player state                             │    │
│  │  - Coordinates localStorage + Firestore             │    │
│  └─────────────────────────────────────────────────────┘    │
│              │                           │                   │
│              ▼                           ▼                   │
│  ┌──────────────────┐       ┌──────────────────────────┐    │
│  │  TypedStorage    │       │  Firebase SyncManager    │    │
│  │  (localStorage)  │       │  - 2s debounce           │    │
│  │  PRIMARY         │       │  - Rate limiting         │    │
│  │  - Instant save  │       │  - Offline queue         │    │
│  └──────────────────┘       └──────────────────────────┘    │
│                                          │                   │
│                                          ▼                   │
│                              ┌──────────────────────────┐    │
│                              │  Firestore (Cloud)       │    │
│                              │  SECONDARY               │    │
│                              │  - Cross-device sync     │    │
│                              │  - Data backup           │    │
│                              └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Sync Strategy

| Data Type | Sync Direction | Conflict Resolution |
|-----------|---------------|---------------------|
| Stats | Bidirectional | Max values win (anti-cheat) |
| Achievements | Bidirectional | Union (never lose) |
| Preferences | Bidirectional | Last-write-wins |
| Daily completions | Client → Server | Append-only |

### Authentication Flow

```
App Launch
    │
    ▼
┌─────────────────┐     Yes    ┌──────────────────┐
│ Firebase Auth   │───────────▶│ Load from        │
│ session exists? │            │ Firestore        │
└────────┬────────┘            └──────────────────┘
         │ No
         ▼
┌─────────────────┐
│ Guest Mode      │◀──── User can play immediately
│ (localStorage)  │
└────────┬────────┘
         │ Optional
         ▼
┌─────────────────┐
│ Sign in with    │──── Google or Anonymous upgrade
│ Google          │
└─────────────────┘
```

### Key Files

```
src/firebase/
├── config.ts              # Firebase configuration from env vars
├── index.ts               # App initialization with offline persistence
├── auth.ts                # signInAnonymous, signInWithGoogle, linkAccount
├── loader.ts              # Lazy loading wrapper
├── FirebaseAuthContext.tsx # React context for auth state
├── services/
│   ├── playerService.ts   # Firestore CRUD operations
│   └── migrationService.ts # localStorage → Firestore migration
└── sync/
    └── syncManager.ts     # Debounced sync with offline queue
```

### Security Rules

Firestore security rules ensure users can only access their own data:
- Users collection scoped by `request.auth.uid`
- Stats can only increase (anti-cheat)
- Display names limited to 20 characters

See `firestore.rules` for full implementation.

---

## Game Module Pattern

Each game follows a consistent modular structure:

```
games/[GameName]/
├── logic/                    # Pure TypeScript (no React)
│   ├── types.ts              # Type definitions
│   ├── engine.ts             # Core game logic
│   ├── solver.ts             # Algorithm (if applicable)
│   └── presets.ts            # Level configurations
│
├── components/               # React UI components
│   ├── Board.tsx             # Main game board
│   ├── Controls.tsx          # User input controls
│   └── [GameName].css        # Scoped styles
│
├── hooks/                    # Game-specific hooks
│   └── use[Feature].ts       # Custom behavior
│
├── [GameName]Game.tsx        # Main game container
└── index.ts                  # Barrel export
```

### Separation of Concerns

| Layer | Responsibility | Dependencies |
|-------|----------------|--------------|
| `logic/` | Game rules, state machine, algorithms | None (pure TS) |
| `components/` | UI rendering, user interaction | React, CSS |
| `hooks/` | React lifecycle, side effects | React hooks |
| `*Game.tsx` | State management, orchestration | All of the above |

---

## Code Splitting Strategy

Games are loaded on-demand using `React.lazy()`:

```typescript
// App.tsx
const MagicGraph = lazy(() => import('./games/MagicGraph'));
const SequenceRace = lazy(() => import('./games/SequenceRace'));
const ShapeArchitect = lazy(() => import('./games/ShapeArchitect'));
```

### Bundle Sizes (Production)

| Bundle | Size | Contents |
|--------|------|----------|
| Core | ~1 MB | React, router, i18n, shared components |
| MagicGraph | ~20 KB | Graph puzzle logic + UI |
| SequenceRace | ~40 KB | AI engine + game UI |
| ShapeArchitect | ~370 KB | Three.js + 3D rendering |

---

## State Management

### Local State

- **React useState**: Component-level UI state
- **React useReducer**: Complex game state (MagicGraph, SequenceRace)

### Global State

- **PlayerContext**: Player profile, stats, achievements, rank
- **TypedStorage**: Persistent localStorage with Zod validation

### No External State Library

The application deliberately avoids Redux/Zustand/Jotai:
- Games are independent modules with localized state
- Global state is minimal (just player profile)
- Context + localStorage provides sufficient persistence

---

## Key Architectural Decisions

### 1. TypedStorage with Zod Validation

See [ADR-0002: TypedStorage with Zod](adr/0002-typed-storage-zod.md)

**Problem**: localStorage stores serialized JSON with no type safety.

**Solution**: Wrap localStorage with Zod schema validation.

```typescript
const storage = new TypedStorage(
  'player-profile',
  PlayerProfileSchema,
  createDefaultProfile()
);
```

### 2. Game Module Isolation

Each game is a self-contained module with:
- Own routing (`/magic-graph`, `/sequence-race`, `/shape-architect`)
- Own lazy-loaded bundle
- Shared only design tokens and common components

**Benefit**: Games can be developed, tested, and deployed independently.

### 3. Counter-Based Progression (No XP)

Players progress through simple activity counters:
- `totalGamesPlayed`
- `totalPuzzlesSolved`
- `totalWins`

**Reasoning**:
- Simpler mental model for young users
- No confusion about point calculations
- Encourages breadth of play across games

### 4. Bilingual First (EN/VI)

The app defaults to Vietnamese with English support:
- Uses react-i18next with namespace organization
- Language detection from browser settings
- Manual switch via UI button

---

## Performance Patterns

### React Optimization

| Pattern | Where Used |
|---------|-----------|
| `React.memo` | GameCard, list items |
| `useMemo` | Progress calculations in Dashboard |
| `useCallback` | Context action handlers |
| Lazy initialization | `useState(() => getProfile())` |

### Three.js Memory Management

ShapeArchitect uses `useThreeCleanup()` hook:

```typescript
function Scene3DContent() {
  useThreeCleanup(); // Disposes GPU resources on unmount
  return <>{/* 3D content */}</>;
}
```

### Animation Performance

All animations use GPU-composited properties:
- `transform`
- `opacity`
- `filter`

Respects `prefers-reduced-motion` media query.

---

## Theme System

### Dark-First Design

The app uses a **Linear Editorial** design optimized for dark mode. While `ThemeContext` provides light/dark switching capability, the design system prioritizes the dark palette.

```
┌─────────────────────────────────────────────────────────┐
│                     ThemeProvider                        │
│  ┌─────────────────────────────────────────────────┐    │
│  │                  ThemeContext                    │    │
│  │  - theme: 'light' | 'dark'                      │    │
│  │  - toggleTheme()                                │    │
│  │  - setTheme(theme)                              │    │
│  └─────────────────────────────────────────────────┘    │
│                          │                               │
│                          ▼                               │
│  ┌─────────────────────────────────────────────────┐    │
│  │  document.documentElement                        │    │
│  │  data-theme="light" | data-theme="dark"         │    │
│  └─────────────────────────────────────────────────┘    │
│                          │                               │
│                          ▼                               │
│                   localStorage                           │
│                   'math-games-theme'                     │
└─────────────────────────────────────────────────────────┘
```

### CSS Custom Properties

Theme colors are defined in `src/index.css` with the dark palette as default:

```css
:root {
  --bg: #0a0f1a;        /* Deep navy base */
  --surface: #111827;   /* Card backgrounds */
  --border: #1e3a5f;    /* Blue-tinted borders */
  --text: #f8fafc;      /* Warm white */
  --muted: #64748b;     /* Slate gray */
  --accent: #60a5fa;    /* Sky blue feedback */
}
```

### Theme-Aware Components

Components use CSS variables for automatic theming:

```css
.slab {
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
}
```

---

## Testing Strategy

| Test Type | Tool | Count | Coverage |
|-----------|------|-------|----------|
| Unit | Vitest | 246 | Game logic, utilities, hooks |
| Component | Storybook | 26 stories | Visual component development |
| E2E | Playwright | 112 | Full user flows across all games |

### Test Commands

```bash
npm test              # Unit tests (watch mode)
npm run test:coverage # Unit tests with coverage report
npm run test:e2e      # E2E tests (headless Chromium)
npm run test:e2e:ui   # E2E tests with interactive UI
npm run storybook     # Launch Storybook component explorer
```

### E2E Test Architecture

E2E tests use the Page Object Model pattern:

```
e2e/
├── fixtures/          # Test data (player profiles, storage helpers)
├── pages/             # Page Object Models (DashboardPage, etc.)
└── *.spec.ts          # Test specifications
```

Key test files:
- `dashboard.spec.ts` - Tab navigation, game cards, header controls
- `magic-graph.spec.ts` - Puzzle solving, validation, hints
- `sequence-race.spec.ts` - AI gameplay, win/lose conditions
- `shape-architect.spec.ts` - 3D mode, piece placement
- `accessibility.spec.ts` - ARIA, keyboard navigation, focus management

---

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for self-hosted deployment options.

### Build Output

```bash
npm run build
# Output: dist/
```

The production build is a static SPA that can be served from any static host.
