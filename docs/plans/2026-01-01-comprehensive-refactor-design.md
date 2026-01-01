# Comprehensive Refactor Sprint Design

**Date:** 2026-01-01
**Status:** Approved
**Scope:** Tutorial bug fix, Dashboard redesign, Repo restructuring

---

## Overview

This design document covers a focused sprint to address three interconnected issues:

1. **Tutorial overlay bug** — Popups render behind the darkening overlay
2. **Dashboard visual hierarchy** — Unclear priorities, too much scrolling to reach games
3. **Repo organization** — Scattered files, inconsistent folder structure

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Timeline | One focused sprint | Cohesive changes, avoid context switching |
| Dashboard focus | Games as hero | Primary user goal is to play games |
| Secondary content | Tabbed layout | Clear separation without hiding content |
| Repo changes | Comprehensive restructure | Clean conventions for future development |

---

## Part 1: Tutorial Bug Fix

### Problem

The tutorial system has a z-index layering bug causing tooltips to appear behind the overlay:

```
Current z-index hierarchy (broken):
├── Tutorial overlay:     1000  ← darkens everything
├── Tutorial spotlight:   1001  ← spotlight hole
├── Tutorial tooltip:      600  ← BEHIND the overlay!
└── Rank-up overlay:      1100  ← would cover tutorial
```

Additionally, SequenceRace shows sidebar positioning issues during tutorial mode ("Khu vực trò chơi" labels escaping container).

### Solution

#### 1.1 Add tutorial z-index tokens

**File:** `src/shared/styles/tokens/spacing.css`

```css
/* Tutorial layering (between modal and toast) */
--z-tutorial-backdrop: 900;
--z-tutorial-spotlight: 901;
--z-tutorial-tooltip: 902;
```

#### 1.2 Update Tutorial.css

**File:** `src/shared/components/Tutorial/Tutorial.css`

```css
.tutorial-overlay {
  /* ... existing styles ... */
  z-index: var(--z-tutorial-backdrop);  /* was: 1000 */
}

.tutorial-spotlight {
  /* ... existing styles ... */
  z-index: var(--z-tutorial-spotlight);  /* was: 1001 */
}

.tutorial-tooltip {
  /* ... existing styles ... */
  z-index: var(--z-tutorial-tooltip);  /* was: var(--z-tooltip) = 600 */
}
```

#### 1.3 Fix SequenceRace sidebar

**File:** `src/games/SequenceRace/SequenceRace.css`

Ensure game area labels have proper containment during tutorial:
- Add `overflow: hidden` to sidebar container
- Verify `position: relative` on parent elements
- Check for any `z-index` conflicts with tutorial overlay

### Files to Modify

- `src/shared/styles/tokens/spacing.css`
- `src/shared/components/Tutorial/Tutorial.css`
- `src/games/SequenceRace/SequenceRace.css`

---

## Part 2: Dashboard Redesign

### Current State

The dashboard has 5 vertically-stacked sections requiring significant scrolling:

1. Header (title + language switcher)
2. PlayerProfileCard (rank, stats, streak, recent achievements)
3. DailyChallenge (countdown + 3 game rows)
4. AchievementsGallery (expandable, 10 achievements)
5. Game Grid (3 game cards)

**Problem:** Games are below the fold. Visual hierarchy is unclear.

### New Layout

```
┌─────────────────────────────────────────────────────────────┐
│  COMPACT HEADER                                             │
│  ┌─────────────────────────────────┐  ┌──────┬──────┬─────┐ │
│  │ 🏆 Rank Badge + Name + Streak   │  │ 🔊   │ ◐    │ EN  │ │
│  └─────────────────────────────────┘  └──────┴──────┴─────┘ │
├─────────────────────────────────────────────────────────────┤
│  TAB BAR                                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐                │
│  │ 🎮 Play  │ │ 📊 Stats │ │ 🏆 Achievements│               │
│  │ (active) │ │          │ │    (3/10)    │                │
│  └──────────┘ └──────────┘ └──────────────┘                │
├─────────────────────────────────────────────────────────────┤
│  TAB CONTENT                                                │
│                                                             │
│  [Play Tab - DEFAULT]                                       │
│                                                             │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐              │
│  │           │  │           │  │           │              │
│  │  MAGIC    │  │ SEQUENCE  │  │  SHAPE    │              │
│  │  GRAPH    │  │   RACE    │  │ ARCHITECT │              │
│  │           │  │           │  │           │              │
│  │  1/15     │  │   1/12    │  │   0/10    │              │
│  └───────────┘  └───────────┘  └───────────┘              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🗓️ Daily Challenge                      09:54:45    │   │
│  │    ○ Magic Graph  ○ Sequence Race  ● Shape Architect│   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Stats Tab]                                                │
│  - Games played breakdown                                   │
│  - Puzzles solved by game                                   │
│  - Win rate (SequenceRace)                                  │
│  - Rank progress visualization                              │
│  - Personal bests                                           │
│                                                             │
│  [Achievements Tab]                                         │
│  - Full AchievementsGallery (no expand/collapse)           │
│  - All 4 categories visible                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Component Changes

| Element | Before | After |
|---------|--------|-------|
| **Profile** | Large card with progress bar, streak, recent achievements | Compact header bar (rank badge + name + streak) |
| **Daily Challenge** | Full section with countdown + 3 game rows | Compact horizontal bar with dot indicators |
| **Games** | Below fold after scrolling | **Hero position** — immediately visible in Play tab |
| **Achievements** | Expandable gallery inline | Dedicated tab with full gallery |
| **Stats** | Scattered in profile card | Dedicated tab with detailed breakdown |

### New Components

#### 2.1 CompactHeader

**File:** `src/pages/Dashboard/CompactHeader.tsx`

```tsx
interface CompactHeaderProps {
  profile: PlayerProfile;
  streak: number;
}

// Displays: [Rank Badge] [Player Name] [Streak 🔥] ... [Sound] [Contrast] [Lang]
```

#### 2.2 DashboardTabs

**File:** `src/shared/components/layout/DashboardTabs.tsx`

```tsx
interface DashboardTabsProps {
  activeTab: 'play' | 'stats' | 'achievements';
  onTabChange: (tab: string) => void;
  achievementCount: { unlocked: number; total: number };
}

// Tab bar with Play (default), Stats, Achievements (shows count badge)
```

#### 2.3 DailyChallengeBanner

**File:** `src/shared/components/DailyChallenge/DailyChallengeBanner.tsx`

```tsx
interface DailyChallengeBannerProps {
  challenges: DailyChallengeState;
  countdown: string;
}

// Horizontal compact bar: [Calendar Icon] Daily Challenge [dots] [countdown]
```

#### 2.4 StatsTab

**File:** `src/pages/Dashboard/tabs/StatsTab.tsx`

```tsx
// Detailed stats view:
// - Total games played (with per-game breakdown)
// - Total puzzles solved (with per-game breakdown)
// - SequenceRace win rate
// - Current rank + progress to next
// - Streak history
// - Personal bests per game
```

#### 2.5 PlayTab

**File:** `src/pages/Dashboard/tabs/PlayTab.tsx`

```tsx
// Composes:
// - Game grid (3 GameCards)
// - DailyChallengeBanner (below games)
```

#### 2.6 AchievementsTab

**File:** `src/pages/Dashboard/tabs/AchievementsTab.tsx`

```tsx
// Full-page AchievementsGallery without expand/collapse toggle
// All 4 categories visible by default
```

### Dashboard.tsx Changes

```tsx
function Dashboard() {
  const [activeTab, setActiveTab] = useState<'play' | 'stats' | 'achievements'>('play');

  return (
    <div className="dashboard">
      <CompactHeader profile={profile} streak={streak} />
      <DashboardTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        achievementCount={achievementCount}
      />
      <main className="dashboard__content">
        {activeTab === 'play' && <PlayTab />}
        {activeTab === 'stats' && <StatsTab />}
        {activeTab === 'achievements' && <AchievementsTab />}
      </main>
    </div>
  );
}
```

---

## Part 3: Repo Restructuring

### Current Pain Points

1. `shared/components/` — 34 files at varying depths, no clear categorization
2. `shared/hooks/` — Mixed concerns (game, accessibility, gestures) in flat structure
3. `shared/utils/schemas.ts` — Single large file with all Zod schemas
4. Test files — Scattered `__tests__` folders throughout

### New Structure

```
src/
├── app/                          # App shell
│   ├── App.tsx
│   ├── main.tsx
│   └── routes.tsx                # Route definitions extracted
│
├── pages/
│   └── Dashboard/
│       ├── Dashboard.tsx
│       ├── Dashboard.css
│       ├── CompactHeader.tsx
│       ├── tabs/
│       │   ├── PlayTab.tsx
│       │   ├── StatsTab.tsx
│       │   └── AchievementsTab.tsx
│       └── index.ts
│
├── games/                        # (unchanged)
│   ├── MagicGraph/
│   ├── SequenceRace/
│   └── ShapeArchitect/
│
├── shared/
│   ├── components/
│   │   ├── ui/                   # Primitive building blocks
│   │   │   ├── Button.tsx
│   │   │   ├── Timer.tsx
│   │   │   ├── ProgressRing.tsx
│   │   │   ├── DifficultySelector.tsx
│   │   │   └── index.ts
│   │   ├── layout/               # Layout components
│   │   │   ├── GameLayout.tsx
│   │   │   ├── GameCard.tsx
│   │   │   ├── DashboardTabs.tsx
│   │   │   └── index.ts
│   │   ├── gamification/         # (keep)
│   │   │   ├── StatsDisplay.tsx
│   │   │   ├── AchievementToast.tsx
│   │   │   ├── RankUpOverlay.tsx
│   │   │   ├── PlayerProfileCard.tsx
│   │   │   ├── AchievementsGallery.tsx
│   │   │   └── index.ts
│   │   ├── overlays/             # (keep)
│   │   ├── tutorial/             # (rename: lowercase)
│   │   ├── accessibility/        # (rename: lowercase)
│   │   ├── icons/                # (keep)
│   │   ├── DailyChallenge/       # (keep, add DailyChallengeBanner)
│   │   └── index.ts
│   │
│   ├── hooks/
│   │   ├── game/                 # Game-related hooks
│   │   │   ├── useGameTimer.ts
│   │   │   ├── useGameRewards.ts
│   │   │   ├── useGameMachine.ts
│   │   │   ├── useGameKeyboard.ts
│   │   │   └── index.ts
│   │   ├── accessibility/        # A11y hooks
│   │   │   ├── useFocusTrap.ts
│   │   │   ├── useAnnounce.ts
│   │   │   ├── useHighContrast.ts
│   │   │   └── index.ts
│   │   ├── gestures/             # Touch/input hooks
│   │   │   ├── useSwipe.ts
│   │   │   ├── usePinchZoom.ts
│   │   │   ├── useDragScroll.ts
│   │   │   └── index.ts
│   │   ├── useTutorial.ts        # (keep at root - cross-cutting)
│   │   └── index.ts
│   │
│   ├── schemas/                  # Split from utils/schemas.ts
│   │   ├── playerProfile.schema.ts
│   │   ├── daily.schema.ts
│   │   ├── storage.schema.ts
│   │   └── index.ts
│   │
│   ├── services/                 # (keep)
│   ├── contexts/                 # (keep)
│   ├── machines/                 # (keep)
│   ├── types/                    # (keep)
│   ├── utils/                    # (keep, minus schemas)
│   ├── constants/                # (keep)
│   └── styles/
│       └── tokens/               # (keep)
│
├── test/                         # Consolidated test utilities
│   ├── setup.ts
│   ├── utils.ts
│   └── mocks/
│
└── i18n/                         # (keep)
```

### Migration Strategy

1. **Create new folders first** — Empty structure, don't break imports
2. **Move files with barrel re-exports** — Old paths temporarily re-export from new locations
3. **Update imports incrementally** — Use IDE refactoring tools
4. **Remove re-exports** — Once all imports updated, delete temporary re-exports
5. **Verify** — Run `npm run build` and `npm test` after each phase

---

## Implementation Sequence

### Phase 1: Bug Fixes (Do First)

| Task | Est. Time |
|------|-----------|
| 1.1 Add tutorial z-index tokens to spacing.css | 30 min |
| 1.2 Update Tutorial.css to use new tokens | 15 min |
| 1.3 Fix SequenceRace sidebar positioning | 1 hr |
| 1.4 Test tutorials in all 3 games | 30 min |

### Phase 2: Repo Restructuring

| Task | Est. Time |
|------|-----------|
| 2.1 Create new folder structure (empty) | 15 min |
| 2.2 Move hooks into subcategories (game/, accessibility/, gestures/) | 1 hr |
| 2.3 Move components into subcategories (ui/, layout/) | 1 hr |
| 2.4 Extract schemas into shared/schemas/ | 45 min |
| 2.5 Update all barrel exports (index.ts files) | 30 min |
| 2.6 Run build + tests to verify | 15 min |
| 2.7 Update path aliases in tsconfig if needed | 15 min |

### Phase 3: Dashboard Redesign

| Task | Est. Time |
|------|-----------|
| 3.1 Create CompactHeader component | 2 hr |
| 3.2 Create DashboardTabs component | 2 hr |
| 3.3 Create DailyChallengeBanner (compact) | 1.5 hr |
| 3.4 Create StatsTab component | 2 hr |
| 3.5 Refactor AchievementsGallery for tab use | 1 hr |
| 3.6 Create PlayTab component | 1 hr |
| 3.7 Integrate all into Dashboard.tsx | 2 hr |
| 3.8 Update Dashboard.css for new layout | 1.5 hr |
| 3.9 Mobile responsive testing + fixes | 2 hr |

### Phase 4: Polish & Verification

| Task | Est. Time |
|------|-----------|
| 4.1 Add tab transitions/animations | 1 hr |
| 4.2 Update i18n keys for new components | 30 min |
| 4.3 Accessibility audit (keyboard nav, ARIA) | 1 hr |
| 4.4 Cross-browser testing | 1 hr |
| 4.5 Update CLAUDE.md with new conventions | 30 min |
| 4.6 Update ARCHITECTURE.md | 30 min |

### Dependency Graph

```
Phase 1 (Bugs) ─────────────────────────────────────┐
                                                    │
Phase 2 (Repo) ─────────────────────────────────────┼──► Phase 4 (Polish)
                                                    │
Phase 3 (Dashboard) ────────────────────────────────┘
        │
        ├── 3.1 CompactHeader
        ├── 3.2 DashboardTabs ◄─────────────────────┐
        ├── 3.3 DailyChallengeBanner                │
        ├── 3.4 StatsTab ───────────────────────────┤
        ├── 3.5 AchievementsGallery refactor ───────┤
        ├── 3.6 PlayTab ────────────────────────────┘
        └── 3.7-3.9 Integration & responsive
```

---

## Success Criteria

- [ ] Tutorial tooltips render above the darkening overlay in all 3 games
- [ ] SequenceRace sidebar renders correctly during tutorial
- [ ] Dashboard loads with Play tab active, games visible above fold
- [ ] All 3 tabs functional: Play, Stats, Achievements
- [ ] Daily challenge appears as compact banner in Play tab
- [ ] New folder structure in place with all imports working
- [ ] Build passes with no errors
- [ ] All existing tests pass
- [ ] Mobile responsive layout works on 360px+ widths
- [ ] CLAUDE.md and ARCHITECTURE.md updated

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Import path changes break builds | Run build after each migration step; use barrel re-exports as fallback |
| Dashboard tab state conflicts with URL routing | Keep tabs as local state initially; add URL sync in future sprint if needed |
| Mobile layout regression | Test on 360px, 480px, 768px breakpoints during Phase 3.9 |
| Tutorial z-index conflicts with other overlays | Test rank-up and achievement toasts during tutorial flow |

---

## Out of Scope

- URL-based tab routing (future enhancement)
- New games or game features
- Backend/API integration
- Performance optimization beyond existing patterns
- New achievement definitions
