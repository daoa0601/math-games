# Comprehensive Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix tutorial z-index bugs, redesign Dashboard with tabbed layout, and restructure the repository for better organization.

**Architecture:** This is a 4-phase refactor: (1) Fix tutorial overlay z-index issues by adding proper CSS tokens, (2) Reorganize shared hooks and components into categorized subdirectories, (3) Redesign Dashboard with a compact header and tabbed content (Play/Stats/Achievements), (4) Polish with animations and documentation updates.

**Tech Stack:** React 18, TypeScript, CSS Variables, Vite, react-router-dom, i18next, XState, Zod

---

## Prerequisites

Before starting, verify the development environment:

```bash
# Clone and install (if not already)
npm install

# Verify build passes
npm run build

# Verify tests pass
npm test
```

**Path Aliases:** All imports use `@/` prefix (e.g., `@/shared/components`)

---

## Phase 1: Tutorial Bug Fix

### Task 1.1: Add tutorial z-index tokens

**Goal:** Add CSS custom properties for tutorial layering to maintain consistent z-index scale.

**Files:**
- Modify: `src/shared/styles/tokens/spacing.css:26-34`

**Step 1: Read the current z-index tokens**

Open `src/shared/styles/tokens/spacing.css` and locate the z-index scale section (lines 26-34).

**Step 2: Add tutorial z-index tokens after existing scale**

Add these lines after line 34 (`--z-tooltip: 600;`):

```css
  /* ---- Tutorial Layering ---- */
  /* Tutorial sits between modal and toast in the hierarchy */

  --z-tutorial-backdrop: 450;
  --z-tutorial-spotlight: 451;
  --z-tutorial-tooltip: 452;
```

**Step 3: Verify the change**

Run: `npm run build`
Expected: Build succeeds with no CSS errors.

**Step 4: Commit**

```bash
git add src/shared/styles/tokens/spacing.css
git commit -m "$(cat <<'EOF'
feat(tokens): add tutorial z-index tokens

Add dedicated z-index tokens for tutorial system layering.
Positions tutorial between modal (400) and toast (500) layers.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 1.2: Update Tutorial.css to use z-index tokens

**Goal:** Replace hardcoded z-index values with CSS custom properties.

**Files:**
- Modify: `src/shared/components/Tutorial/Tutorial.css:13-27` and `:43`

**Step 1: Read current Tutorial.css**

Open `src/shared/components/Tutorial/Tutorial.css`. Note the hardcoded values:
- Line 17: `z-index: 1000;` (overlay)
- Line 25: `z-index: 1001;` (spotlight)
- Line 43: `z-index: var(--z-tooltip);` (tooltip - already uses token but wrong one)

**Step 2: Update .tutorial-overlay z-index**

Find line 17:
```css
  z-index: 1000;
```

Replace with:
```css
  z-index: var(--z-tutorial-backdrop);
```

**Step 3: Update .tutorial-spotlight z-index**

Find line 25:
```css
  z-index: 1001;
```

Replace with:
```css
  z-index: var(--z-tutorial-spotlight);
```

**Step 4: Update .tutorial-tooltip z-index**

Find line 43:
```css
  z-index: var(--z-tooltip);
```

Replace with:
```css
  z-index: var(--z-tutorial-tooltip);
```

**Step 5: Verify the change**

Run: `npm run build`
Expected: Build succeeds with no CSS errors.

**Step 6: Commit**

```bash
git add src/shared/components/Tutorial/Tutorial.css
git commit -m "$(cat <<'EOF'
fix(tutorial): use z-index tokens for consistent layering

Replace hardcoded z-index values with CSS custom properties:
- Overlay: 1000 → var(--z-tutorial-backdrop)
- Spotlight: 1001 → var(--z-tutorial-spotlight)
- Tooltip: var(--z-tooltip) → var(--z-tutorial-tooltip)

Fixes tooltip appearing behind overlay.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 1.3: Fix SequenceRace sidebar positioning

**Goal:** Ensure sidebar elements have proper containment during tutorial mode.

**Files:**
- Modify: `src/games/SequenceRace/SequenceRace.css`

**Step 1: Read SequenceRace.css**

Open `src/games/SequenceRace/SequenceRace.css` and search for `.game-info-panel` or sidebar-related classes.

**Step 2: Add position: relative to sequence-container**

Find the `.sequence-container` rule (around line 6-13). Verify it has:

```css
.sequence-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xl);
  width: 100%;
  max-width: 700px;
}
```

Add `position: relative;` to establish stacking context:

```css
.sequence-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xl);
  width: 100%;
  max-width: 700px;
}
```

**Step 3: Ensure game-info-panel has overflow: hidden**

Find `.game-info-panel` rule and verify or add:

```css
.game-info-panel {
  /* existing styles... */
  position: relative;
  overflow: hidden;
}
```

**Step 4: Verify the change**

Run: `npm run build`
Expected: Build succeeds.

**Step 5: Manual test**

Run: `npm run dev`
Navigate to SequenceRace, trigger tutorial, verify:
- Tutorial overlay darkens the background
- Spotlight highlights correct elements
- Tooltip appears above the overlay
- No sidebar elements escape their container

**Step 6: Commit**

```bash
git add src/games/SequenceRace/SequenceRace.css
git commit -m "$(cat <<'EOF'
fix(sequence-race): add positioning for tutorial containment

Add position: relative to sequence-container for proper stacking context.
Add overflow: hidden to game-info-panel to prevent element escape.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 1.4: Test tutorials in all games

**Goal:** Verify tutorial overlays work correctly in all three games.

**Files:**
- Read only (verification)

**Step 1: Start development server**

Run: `npm run dev`

**Step 2: Test MagicGraph tutorial**

1. Navigate to MagicGraph
2. Click Help button to start tutorial
3. Verify:
   - [ ] Overlay darkens background
   - [ ] Spotlight highlights target element
   - [ ] Tooltip appears ABOVE the overlay (not behind)
   - [ ] Next/Skip buttons work
   - [ ] Complete tutorial or skip

**Step 3: Test SequenceRace tutorial**

1. Navigate to SequenceRace
2. Click Help button to start tutorial
3. Verify:
   - [ ] Overlay darkens background
   - [ ] Spotlight highlights target element
   - [ ] Tooltip appears ABOVE the overlay
   - [ ] Sidebar elements stay contained (no escaping labels)
   - [ ] Complete tutorial or skip

**Step 4: Test ShapeArchitect tutorial**

1. Navigate to ShapeArchitect
2. Click Help button to start tutorial
3. Verify:
   - [ ] Overlay darkens background
   - [ ] Spotlight highlights target element
   - [ ] Tooltip appears ABOVE the overlay
   - [ ] Complete tutorial or skip

**Step 5: Test overlay interactions**

1. During any tutorial, trigger an achievement (if possible)
2. Verify AchievementToast (z-index: 1200) appears ABOVE tutorial
3. Verify rank-up overlay (if triggerable) appears correctly

**Step 6: Commit if fixes needed**

If any adjustments were made:
```bash
git add -A
git commit -m "$(cat <<'EOF'
fix(tutorial): address remaining overlay issues

[Describe specific fixes]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 2: Repository Restructuring

### Task 2.1: Create new folder structure

**Goal:** Create empty directory structure for reorganized code.

**Files:**
- Create: `src/app/` (new)
- Create: `src/pages/Dashboard/tabs/` (new)
- Create: `src/shared/hooks/game/` (new)
- Create: `src/shared/hooks/accessibility/` (new)
- Create: `src/shared/hooks/gestures/` (new)
- Create: `src/shared/components/ui/` (new)
- Create: `src/shared/components/layout/` (new)
- Create: `src/shared/schemas/` (new)

**Step 1: Create app directory**

```bash
mkdir -p src/app
```

**Step 2: Create Dashboard tabs directory**

```bash
mkdir -p src/pages/Dashboard/tabs
```

**Step 3: Create hooks subdirectories**

```bash
mkdir -p src/shared/hooks/game
mkdir -p src/shared/hooks/accessibility
mkdir -p src/shared/hooks/gestures
```

**Step 4: Create components subdirectories**

```bash
mkdir -p src/shared/components/ui
mkdir -p src/shared/components/layout
```

**Step 5: Create schemas directory**

```bash
mkdir -p src/shared/schemas
```

**Step 6: Verify structure**

```bash
tree src/app src/pages/Dashboard src/shared/hooks src/shared/components/ui src/shared/components/layout src/shared/schemas -d
```

Expected output shows new empty directories.

**Step 7: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
chore: create new folder structure for reorganization

Prepare directory structure for:
- src/app/ - App shell
- src/pages/Dashboard/tabs/ - Dashboard tab components
- src/shared/hooks/{game,accessibility,gestures}/ - Categorized hooks
- src/shared/components/{ui,layout}/ - Categorized components
- src/shared/schemas/ - Zod schemas extracted from utils

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2.2: Move hooks into subcategories

**Goal:** Organize hooks by domain (game, accessibility, gestures).

**Files:**
- Move: `src/shared/hooks/useGameTimer.ts` → `src/shared/hooks/game/`
- Move: `src/shared/hooks/useGameRewards.ts` → `src/shared/hooks/game/`
- Move: `src/shared/hooks/useGameKeyboard.ts` → `src/shared/hooks/game/`
- Move: `src/shared/hooks/useFocusTrap.ts` → `src/shared/hooks/accessibility/`
- Move: `src/shared/hooks/useAnnounce.ts` → `src/shared/hooks/accessibility/`
- Move: `src/shared/hooks/useHighContrast.ts` → `src/shared/hooks/accessibility/`
- Move: `src/shared/hooks/useSwipe.ts` → `src/shared/hooks/gestures/`
- Move: `src/shared/hooks/usePinchZoom.ts` → `src/shared/hooks/gestures/`
- Move: `src/shared/hooks/useDragScroll.ts` → `src/shared/hooks/gestures/`
- Keep: `src/shared/hooks/useTutorial.ts` (cross-cutting, stays at root)
- Create: `src/shared/hooks/game/index.ts`
- Create: `src/shared/hooks/accessibility/index.ts`
- Create: `src/shared/hooks/gestures/index.ts`
- Modify: `src/shared/hooks/index.ts`

**Step 1: Move game hooks**

```bash
mv src/shared/hooks/useGameTimer.ts src/shared/hooks/game/
mv src/shared/hooks/useGameRewards.ts src/shared/hooks/game/
mv src/shared/hooks/useGameKeyboard.ts src/shared/hooks/game/
```

**Step 2: Create game hooks barrel export**

Create `src/shared/hooks/game/index.ts`:

```typescript
export { useGameTimer, formatTime } from './useGameTimer';
export { useGameRewards } from './useGameRewards';
export { useGameKeyboard } from './useGameKeyboard';
```

**Step 3: Move accessibility hooks**

```bash
mv src/shared/hooks/useFocusTrap.ts src/shared/hooks/accessibility/
mv src/shared/hooks/useAnnounce.ts src/shared/hooks/accessibility/
mv src/shared/hooks/useHighContrast.ts src/shared/hooks/accessibility/
```

**Step 4: Create accessibility hooks barrel export**

Create `src/shared/hooks/accessibility/index.ts`:

```typescript
export { useFocusTrap } from './useFocusTrap';
export { useAnnounce } from './useAnnounce';
export { useHighContrast } from './useHighContrast';
```

**Step 5: Move gesture hooks**

```bash
mv src/shared/hooks/useSwipe.ts src/shared/hooks/gestures/
mv src/shared/hooks/usePinchZoom.ts src/shared/hooks/gestures/
mv src/shared/hooks/useDragScroll.ts src/shared/hooks/gestures/
```

**Step 6: Create gestures hooks barrel export**

Create `src/shared/hooks/gestures/index.ts`:

```typescript
export { useSwipe } from './useSwipe';
export { usePinchZoom } from './usePinchZoom';
export { useDragScroll } from './useDragScroll';
```

**Step 7: Update main hooks barrel export**

Update `src/shared/hooks/index.ts`:

```typescript
// Game hooks
export * from './game';

// Accessibility hooks
export * from './accessibility';

// Gesture hooks
export * from './gestures';

// Cross-cutting hooks (remain at root)
export { useTutorial } from './useTutorial';
```

**Step 8: Also move test files if they exist**

```bash
mv src/shared/hooks/__tests__/useGameTimer.test.ts src/shared/hooks/game/__tests__/ 2>/dev/null || true
```

**Step 9: Verify build**

Run: `npm run build`
Expected: Build succeeds (barrel re-exports maintain backward compatibility).

**Step 10: Verify tests**

Run: `npm test -- --run`
Expected: All tests pass.

**Step 11: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
refactor(hooks): organize hooks into subcategories

Move hooks into categorized subdirectories:
- game/: useGameTimer, useGameRewards, useGameKeyboard
- accessibility/: useFocusTrap, useAnnounce, useHighContrast
- gestures/: useSwipe, usePinchZoom, useDragScroll
- useTutorial remains at root (cross-cutting concern)

All exports maintained via barrel re-exports for backward compatibility.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2.3: Move components into ui/ and layout/ subdirectories

**Goal:** Categorize primitive UI components and layout components.

**Files:**
- Move: `src/shared/components/Button.tsx` → `src/shared/components/ui/`
- Move: `src/shared/components/Timer.tsx` → `src/shared/components/ui/`
- Move: `src/shared/components/ProgressRing.tsx` → `src/shared/components/ui/`
- Move: `src/shared/components/DifficultySelector.tsx` → `src/shared/components/ui/`
- Move: `src/shared/components/GameLayout.tsx` → `src/shared/components/layout/`
- Move: `src/shared/components/GameCard.tsx` → `src/shared/components/layout/`
- Create: `src/shared/components/ui/index.ts`
- Create: `src/shared/components/layout/index.ts`
- Modify: `src/shared/components/index.ts`

**Step 1: Move UI components**

```bash
mv src/shared/components/Button.tsx src/shared/components/ui/
mv src/shared/components/Button.stories.tsx src/shared/components/ui/ 2>/dev/null || true
mv src/shared/components/Timer.tsx src/shared/components/ui/
mv src/shared/components/Timer.stories.tsx src/shared/components/ui/ 2>/dev/null || true
mv src/shared/components/ProgressRing.tsx src/shared/components/ui/
mv src/shared/components/DifficultySelector.tsx src/shared/components/ui/
```

**Step 2: Create UI components barrel export**

Create `src/shared/components/ui/index.ts`:

```typescript
export { Button } from './Button';
export type { ButtonProps } from './Button';
export { Timer } from './Timer';
export { ProgressRing, CompactProgressRing } from './ProgressRing';
export { DifficultySelector } from './DifficultySelector';
```

**Step 3: Move layout components**

```bash
mv src/shared/components/GameLayout.tsx src/shared/components/layout/
mv src/shared/components/GameCard.tsx src/shared/components/layout/
mv src/shared/components/GameCard.stories.tsx src/shared/components/layout/ 2>/dev/null || true
```

**Step 4: Create layout components barrel export**

Create `src/shared/components/layout/index.ts`:

```typescript
export { GameLayout } from './GameLayout';
export { GameCard } from './GameCard';
export type { GameCardProps } from './GameCard';
```

**Step 5: Update main components barrel export**

Update `src/shared/components/index.ts` to re-export from new locations:

```typescript
// UI primitives
export * from './ui';

// Layout components
export * from './layout';

// Gamification components
export * from './gamification';

// Icons
export * from './icons';

// Tutorial
export * from './Tutorial';

// Overlays
export * from './overlays';

// Daily Challenge
export * from './DailyChallenge';

// Personal Best
export * from './PersonalBest';

// Remaining top-level components
export { ErrorBoundary } from './ErrorBoundary';
export { ErrorFallback } from './ErrorFallback';
export { HelpButton } from './HelpButton';
export { HighContrastToggle } from './HighContrastToggle';
export { LanguageSwitcher } from './LanguageSwitcher';
export { ScreenReaderAnnounce } from './ScreenReaderAnnounce';
export { SkipLinks } from './SkipLinks';
export { SoundToggle } from './SoundToggle';
```

**Step 6: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 7: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
refactor(components): organize into ui/ and layout/ subdirectories

Categorize shared components:
- ui/: Button, Timer, ProgressRing, DifficultySelector
- layout/: GameLayout, GameCard

Barrel exports maintain backward compatibility.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2.4: Extract schemas into shared/schemas/

**Goal:** Split large schemas.ts file into domain-specific schema files.

**Files:**
- Read: `src/shared/utils/schemas.ts`
- Create: `src/shared/schemas/playerProfile.schema.ts`
- Create: `src/shared/schemas/daily.schema.ts`
- Create: `src/shared/schemas/storage.schema.ts`
- Create: `src/shared/schemas/index.ts`
- Modify: `src/shared/utils/schemas.ts` (re-export from new location)
- Modify: `src/shared/utils/index.ts`

**Step 1: Read current schemas.ts**

Open `src/shared/utils/schemas.ts` to understand the structure.

**Step 2: Create playerProfile.schema.ts**

Create `src/shared/schemas/playerProfile.schema.ts`:

```typescript
import { z } from 'zod';

// Player preferences
export const PlayerPreferencesSchema = z.object({
  soundEnabled: z.boolean(),
  practiceMode: z.boolean(),
  language: z.enum(['en', 'vi']),
});
export type PlayerPreferences = z.infer<typeof PlayerPreferencesSchema>;

// Best times for each game
export const BestTimesSchema = z.object({
  magicGraphFastest: z.record(z.string(), z.number()).optional(),
  sequenceRaceFastest: z.record(z.string(), z.number()).optional(),
  shapeArchitectFastest: z.record(z.string(), z.number()).optional(),
});
export type BestTimes = z.infer<typeof BestTimesSchema>;

// Player statistics
export const PlayerStatsSchema = z.object({
  totalGamesPlayed: z.number(),
  totalPuzzlesSolved: z.number(),
  totalWins: z.number(),
  magicGraphGames: z.number(),
  magicGraphSolves: z.number(),
  sequenceRaceGames: z.number(),
  sequenceRaceWins: z.number(),
  shapeArchitectGames: z.number(),
  shapeArchitectSolves: z.number(),
  bestTimes: BestTimesSchema.optional(),
});
export type PlayerStats = z.infer<typeof PlayerStatsSchema>;

// Player rank enum
export const PlayerRankSchema = z.enum([
  'beginner',
  'learner',
  'apprentice',
  'intermediate',
  'advanced',
  'expert',
  'master',
  'grandmaster',
]);
export type PlayerRank = z.infer<typeof PlayerRankSchema>;

// Full player profile
export const PlayerProfileSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  stats: PlayerStatsSchema,
  rank: PlayerRankSchema,
  streak: z.number(),
  achievements: z.array(z.string()),
  preferences: PlayerPreferencesSchema,
  createdAt: z.string(),
  version: z.number(),
});
export type PlayerProfile = z.infer<typeof PlayerProfileSchema>;
```

**Step 3: Create daily.schema.ts**

Create `src/shared/schemas/daily.schema.ts`:

```typescript
import { z } from 'zod';

// Storage game ID enum
export const StorageGameIdSchema = z.enum([
  'magic-graph',
  'sequence-race',
  'shape-architect',
]);
export type StorageGameId = z.infer<typeof StorageGameIdSchema>;

// Game streak tracking
export const GameStreakSchema = z.object({
  currentStreak: z.number(),
  longestStreak: z.number(),
  lastCompletedDate: z.string().nullable(),
});
export type GameStreak = z.infer<typeof GameStreakSchema>;

// Daily challenge completion
export const DailyChallengeCompletionSchema = z.object({
  gameId: StorageGameIdSchema,
  date: z.string(),
  timeMs: z.number(),
  completedAt: z.string(),
});
export type DailyChallengeCompletion = z.infer<typeof DailyChallengeCompletionSchema>;

// Daily challenge state
export const DailyChallengeStateSchema = z.object({
  completions: z.array(DailyChallengeCompletionSchema),
  streaks: z.record(StorageGameIdSchema, GameStreakSchema),
  version: z.number(),
});
export type DailyChallengeState = z.infer<typeof DailyChallengeStateSchema>;
```

**Step 4: Create storage.schema.ts**

Create `src/shared/schemas/storage.schema.ts`:

```typescript
import { z } from 'zod';
import { StorageGameIdSchema } from './daily.schema';

// Game progress
export const GameProgressSchema = z.object({
  highestLevel: z.number(),
  completedLevels: z.array(z.string()),
  lastPlayed: z.string().nullable(),
});
export type GameProgress = z.infer<typeof GameProgressSchema>;

// Leaderboard entry
export const LeaderboardEntrySchema = z.object({
  levelId: z.string(),
  gameId: StorageGameIdSchema,
  bestTime: z.number(),
  achievedAt: z.string(),
  difficulty: z.string().optional(),
});
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;

// Leaderboard state
export const LeaderboardStateSchema = z.object({
  entries: z.array(LeaderboardEntrySchema),
  version: z.number(),
});
export type LeaderboardState = z.infer<typeof LeaderboardStateSchema>;
```

**Step 5: Create schemas barrel export**

Create `src/shared/schemas/index.ts`:

```typescript
// Player profile schemas
export {
  PlayerPreferencesSchema,
  BestTimesSchema,
  PlayerStatsSchema,
  PlayerRankSchema,
  PlayerProfileSchema,
} from './playerProfile.schema';
export type {
  PlayerPreferences,
  BestTimes,
  PlayerStats,
  PlayerRank,
  PlayerProfile,
} from './playerProfile.schema';

// Daily challenge schemas
export {
  StorageGameIdSchema,
  GameStreakSchema,
  DailyChallengeCompletionSchema,
  DailyChallengeStateSchema,
} from './daily.schema';
export type {
  StorageGameId,
  GameStreak,
  DailyChallengeCompletion,
  DailyChallengeState,
} from './daily.schema';

// Storage schemas
export {
  GameProgressSchema,
  LeaderboardEntrySchema,
  LeaderboardStateSchema,
} from './storage.schema';
export type {
  GameProgress,
  LeaderboardEntry,
  LeaderboardState,
} from './storage.schema';
```

**Step 6: Update utils/schemas.ts to re-export**

Replace `src/shared/utils/schemas.ts` content with:

```typescript
// Re-export from new location for backward compatibility
export * from '../schemas';
```

**Step 7: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 8: Verify tests**

Run: `npm test -- --run`
Expected: All tests pass.

**Step 9: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
refactor(schemas): extract into dedicated schemas/ directory

Split large schemas.ts into domain-specific files:
- playerProfile.schema.ts: Player profile, stats, rank, preferences
- daily.schema.ts: Daily challenge, streaks, completions
- storage.schema.ts: Game progress, leaderboard

Old utils/schemas.ts re-exports for backward compatibility.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2.5: Run full verification

**Goal:** Ensure all restructuring is complete and working.

**Step 1: Run lint**

Run: `npm run lint`
Expected: No errors (warnings acceptable).

**Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds with no errors.

**Step 3: Run tests**

Run: `npm test -- --run`
Expected: All tests pass.

**Step 4: Manual smoke test**

Run: `npm run dev`
- Navigate to Dashboard
- Click each game
- Verify games load correctly
- Test tutorial in one game

**Step 5: Commit if fixes needed**

```bash
git add -A
git commit -m "$(cat <<'EOF'
fix: address remaining restructuring issues

[Describe specific fixes]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 3: Dashboard Redesign

### Task 3.1: Create CompactHeader component

**Goal:** Create a compact header replacing the large PlayerProfileCard.

**Files:**
- Create: `src/pages/Dashboard/CompactHeader.tsx`
- Create: `src/pages/Dashboard/CompactHeader.css`

**Step 1: Create CompactHeader.tsx**

Create `src/pages/Dashboard/CompactHeader.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import type { PlayerProfile } from '@/shared/schemas';
import type { RankThreshold } from '@/shared/services/rank';
import { LanguageSwitcher, SoundToggle, HighContrastToggle } from '@/shared/components';
import './CompactHeader.css';

interface CompactHeaderProps {
  profile: PlayerProfile;
  rankInfo: RankThreshold;
  streak: number;
}

export function CompactHeader({ profile, rankInfo, streak }: CompactHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="compact-header">
      <div className="compact-header__profile">
        <div
          className="compact-header__rank-badge"
          style={{ background: `linear-gradient(135deg, ${rankInfo.color}, ${rankInfo.color}dd)` }}
        >
          <span className="compact-header__rank-icon">{rankInfo.icon}</span>
        </div>
        <div className="compact-header__info">
          <span className="compact-header__name">{profile.displayName}</span>
          <span className="compact-header__rank">{t(`ranks.${rankInfo.id}`)}</span>
        </div>
        {streak > 0 && (
          <div className="compact-header__streak" title={t('profile.streak')}>
            <span className="compact-header__streak-icon">🔥</span>
            <span className="compact-header__streak-count">{streak}</span>
          </div>
        )}
      </div>
      <div className="compact-header__controls">
        <SoundToggle />
        <HighContrastToggle />
        <LanguageSwitcher />
      </div>
    </header>
  );
}
```

**Step 2: Create CompactHeader.css**

Create `src/pages/Dashboard/CompactHeader.css`:

```css
/* ========================================
   Compact Header
   ======================================== */

.compact-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--space-md);
}

.compact-header__profile {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.compact-header__rank-badge {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
}

.compact-header__rank-icon {
  font-size: 1.5rem;
}

.compact-header__info {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.compact-header__name {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--text-primary);
}

.compact-header__rank {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.compact-header__streak {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  background: var(--color-accent-bg);
  border-radius: var(--radius-full);
  margin-left: var(--space-sm);
}

.compact-header__streak-icon {
  font-size: 1rem;
}

.compact-header__streak-count {
  font-weight: 700;
  color: var(--color-accent-dark);
}

.compact-header__controls {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

/* ---- Responsive ---- */

@media (max-width: 600px) {
  .compact-header {
    flex-direction: column;
    align-items: stretch;
  }

  .compact-header__profile {
    justify-content: center;
  }

  .compact-header__controls {
    justify-content: center;
  }
}
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/pages/Dashboard/CompactHeader.tsx src/pages/Dashboard/CompactHeader.css
git commit -m "$(cat <<'EOF'
feat(dashboard): add CompactHeader component

Create compact header with:
- Rank badge with icon and gradient
- Player name and rank title
- Streak indicator (when > 0)
- Sound, contrast, and language controls

Replaces large PlayerProfileCard in new Dashboard layout.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3.2: Create DashboardTabs component

**Goal:** Create tab bar for switching between Play, Stats, and Achievements views.

**Files:**
- Create: `src/shared/components/layout/DashboardTabs.tsx`
- Create: `src/shared/components/layout/DashboardTabs.css`
- Modify: `src/shared/components/layout/index.ts`

**Step 1: Create DashboardTabs.tsx**

Create `src/shared/components/layout/DashboardTabs.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import './DashboardTabs.css';

export type DashboardTabId = 'play' | 'stats' | 'achievements';

interface DashboardTabsProps {
  activeTab: DashboardTabId;
  onTabChange: (tab: DashboardTabId) => void;
  achievementCount: { unlocked: number; total: number };
}

interface TabConfig {
  id: DashboardTabId;
  icon: string;
  labelKey: string;
}

const TABS: TabConfig[] = [
  { id: 'play', icon: '🎮', labelKey: 'dashboard.tabs.play' },
  { id: 'stats', icon: '📊', labelKey: 'dashboard.tabs.stats' },
  { id: 'achievements', icon: '🏆', labelKey: 'dashboard.tabs.achievements' },
];

export function DashboardTabs({ activeTab, onTabChange, achievementCount }: DashboardTabsProps) {
  const { t } = useTranslation();

  return (
    <nav className="dashboard-tabs" role="tablist" aria-label={t('dashboard.tabsLabel')}>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`tabpanel-${tab.id}`}
          className={`dashboard-tabs__tab ${activeTab === tab.id ? 'dashboard-tabs__tab--active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="dashboard-tabs__icon">{tab.icon}</span>
          <span className="dashboard-tabs__label">{t(tab.labelKey)}</span>
          {tab.id === 'achievements' && (
            <span className="dashboard-tabs__badge">
              {achievementCount.unlocked}/{achievementCount.total}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}
```

**Step 2: Create DashboardTabs.css**

Create `src/shared/components/layout/DashboardTabs.css`:

```css
/* ========================================
   Dashboard Tabs
   ======================================== */

.dashboard-tabs {
  display: flex;
  gap: var(--space-sm);
  padding: var(--space-xs);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--space-lg);
}

.dashboard-tabs__tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s var(--ease-out);
  color: var(--text-secondary);
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: 600;
}

.dashboard-tabs__tab:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.dashboard-tabs__tab--active {
  background: var(--color-primary);
  color: white;
  box-shadow: var(--shadow-sm);
}

.dashboard-tabs__tab--active:hover {
  background: var(--color-primary-dark);
  color: white;
}

.dashboard-tabs__icon {
  font-size: 1.25rem;
}

.dashboard-tabs__label {
  white-space: nowrap;
}

.dashboard-tabs__badge {
  padding: var(--space-xs) var(--space-sm);
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 700;
}

.dashboard-tabs__tab:not(.dashboard-tabs__tab--active) .dashboard-tabs__badge {
  background: var(--bg-subtle);
  color: var(--text-muted);
}

/* ---- Responsive ---- */

@media (max-width: 600px) {
  .dashboard-tabs {
    flex-direction: row;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .dashboard-tabs::-webkit-scrollbar {
    display: none;
  }

  .dashboard-tabs__tab {
    flex: 0 0 auto;
    padding: var(--space-sm) var(--space-md);
  }

  .dashboard-tabs__label {
    display: none;
  }

  .dashboard-tabs__icon {
    font-size: 1.5rem;
  }
}

@media (max-width: 400px) {
  .dashboard-tabs__badge {
    display: none;
  }
}
```

**Step 3: Update layout barrel export**

Add to `src/shared/components/layout/index.ts`:

```typescript
export { DashboardTabs } from './DashboardTabs';
export type { DashboardTabId } from './DashboardTabs';
```

**Step 4: Add i18n keys**

Add to `src/i18n/en.json` under appropriate section:

```json
"dashboard": {
  "tabs": {
    "play": "Play",
    "stats": "Stats",
    "achievements": "Achievements"
  },
  "tabsLabel": "Dashboard navigation"
}
```

Add to `src/i18n/vi.json`:

```json
"dashboard": {
  "tabs": {
    "play": "Chơi",
    "stats": "Thống kê",
    "achievements": "Thành tựu"
  },
  "tabsLabel": "Điều hướng bảng điều khiển"
}
```

**Step 5: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 6: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat(dashboard): add DashboardTabs component

Create tab bar with:
- Play, Stats, Achievements tabs
- Active state styling
- Achievement count badge
- Responsive design (icons only on mobile)
- Full accessibility (role=tablist, aria-selected)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3.3: Create DailyChallengeBanner component

**Goal:** Create compact horizontal banner for daily challenge (used in Play tab).

**Files:**
- Create: `src/shared/components/DailyChallenge/DailyChallengeBanner.tsx`
- Create: `src/shared/components/DailyChallenge/DailyChallengeBanner.css`
- Modify: `src/shared/components/DailyChallenge/index.ts`

**Step 1: Create DailyChallengeBanner.tsx**

Create `src/shared/components/DailyChallenge/DailyChallengeBanner.tsx`:

```tsx
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getTodayCompletions, isAllGamesCompletedToday } from '@/shared/services/daily';
import type { StorageGameId } from '@/shared/schemas';
import './DailyChallengeBanner.css';

interface GameInfo {
  id: StorageGameId;
  path: string;
}

const GAMES: GameInfo[] = [
  { id: 'magic-graph', path: '/magic-graph' },
  { id: 'sequence-race', path: '/sequence-race' },
  { id: 'shape-architect', path: '/shape-architect' },
];

interface DailyChallengeBannerProps {
  countdown: string;
  className?: string;
}

export function DailyChallengeBanner({ countdown, className = '' }: DailyChallengeBannerProps) {
  const { t } = useTranslation();

  const completions = useMemo(() => getTodayCompletions(), []);
  const allCompleted = useMemo(() => isAllGamesCompletedToday(), []);

  const completedGames = new Set(completions.map(c => c.gameId));

  return (
    <div className={`daily-challenge-banner ${allCompleted ? 'daily-challenge-banner--completed' : ''} ${className}`}>
      <div className="daily-challenge-banner__header">
        <span className="daily-challenge-banner__icon">📅</span>
        <span className="daily-challenge-banner__title">{t('dailyChallenge.title')}</span>
        {allCompleted && (
          <span className="daily-challenge-banner__done-badge">{t('dailyChallenge.allDone')}</span>
        )}
      </div>
      <div className="daily-challenge-banner__games">
        {GAMES.map((game) => {
          const isCompleted = completedGames.has(game.id);
          return (
            <Link
              key={game.id}
              to={game.path}
              className={`daily-challenge-banner__dot ${isCompleted ? 'daily-challenge-banner__dot--completed' : ''}`}
              aria-label={`${t(`games.${game.id}.name`)} - ${isCompleted ? t('dailyChallenge.completed') : t('dailyChallenge.notStarted')}`}
            >
              <span className="daily-challenge-banner__dot-indicator" />
            </Link>
          );
        })}
      </div>
      <div className="daily-challenge-banner__countdown">
        <span className="daily-challenge-banner__countdown-label">{t('dailyChallenge.resetsIn')}</span>
        <span className="daily-challenge-banner__countdown-time">{countdown}</span>
      </div>
    </div>
  );
}
```

**Step 2: Create DailyChallengeBanner.css**

Create `src/shared/components/DailyChallenge/DailyChallengeBanner.css`:

```css
/* ========================================
   Daily Challenge Banner (Compact)
   ======================================== */

.daily-challenge-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 2px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.daily-challenge-banner--completed {
  border-color: var(--color-success);
  background: linear-gradient(135deg, var(--color-success-bg), var(--bg-card));
}

.daily-challenge-banner__header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.daily-challenge-banner__icon {
  font-size: 1.25rem;
}

.daily-challenge-banner__title {
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--text-primary);
}

.daily-challenge-banner__done-badge {
  padding: var(--space-xs) var(--space-sm);
  background: var(--color-success);
  color: white;
  font-size: var(--text-xs);
  font-weight: 700;
  border-radius: var(--radius-full);
}

.daily-challenge-banner__games {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.daily-challenge-banner__dot {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  border: 2px solid var(--border-color);
  background: var(--bg-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s var(--ease-out);
}

.daily-challenge-banner__dot:hover {
  transform: scale(1.1);
  border-color: var(--color-primary);
}

.daily-challenge-banner__dot--completed {
  background: var(--color-success);
  border-color: var(--color-success);
}

.daily-challenge-banner__dot-indicator {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: var(--text-muted);
}

.daily-challenge-banner__dot--completed .daily-challenge-banner__dot-indicator {
  background: white;
}

.daily-challenge-banner__countdown {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-xs);
}

.daily-challenge-banner__countdown-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.daily-challenge-banner__countdown-time {
  font-family: var(--font-mono);
  font-weight: 700;
  color: var(--text-primary);
}

/* ---- Responsive ---- */

@media (max-width: 600px) {
  .daily-challenge-banner {
    flex-wrap: wrap;
    justify-content: center;
  }

  .daily-challenge-banner__countdown {
    width: 100%;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: var(--space-sm);
  }
}
```

**Step 3: Update DailyChallenge barrel export**

Add to `src/shared/components/DailyChallenge/index.ts`:

```typescript
export { DailyChallengeBanner } from './DailyChallengeBanner';
```

**Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat(daily-challenge): add DailyChallengeBanner component

Create compact horizontal banner with:
- Calendar icon and title
- Three clickable dot indicators for game completion
- Countdown timer
- "All Done" badge when complete
- Responsive design

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3.4: Create PlayTab component

**Goal:** Create Play tab content with game grid and daily challenge banner.

**Files:**
- Create: `src/pages/Dashboard/tabs/PlayTab.tsx`

**Step 1: Create PlayTab.tsx**

Create `src/pages/Dashboard/tabs/PlayTab.tsx`:

```tsx
import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GameCard, DailyChallengeBanner } from '@/shared/components';
import { getProgress } from '@/shared/utils/storage';
import type { ComponentGameId } from '@/shared/types';

interface GameConfig {
  id: ComponentGameId;
  titleKey: string;
  descriptionKey: string;
  to: string;
  tags: string[];
  levelCount: number;
}

const GAMES: GameConfig[] = [
  {
    id: 'magicGraph',
    titleKey: 'games.magic-graph.name',
    descriptionKey: 'games.magic-graph.description',
    to: '/magic-graph',
    tags: ['puzzle', 'logic'],
    levelCount: 15,
  },
  {
    id: 'sequenceRace',
    titleKey: 'games.sequence-race.name',
    descriptionKey: 'games.sequence-race.description',
    to: '/sequence-race',
    tags: ['strategy', 'competitive'],
    levelCount: 12,
  },
  {
    id: 'shapeArchitect',
    titleKey: 'games.shape-architect.name',
    descriptionKey: 'games.shape-architect.description',
    to: '/shape-architect',
    tags: ['3D', 'spatial'],
    levelCount: 10,
  },
];

export function PlayTab() {
  const { t } = useTranslation();
  const [countdown, setCountdown] = useState('');

  // Calculate countdown to midnight
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const gameProgress = useMemo(() => {
    return GAMES.map((game) => {
      const progress = getProgress(game.id);
      return {
        ...game,
        completed: progress?.completedLevels?.length ?? 0,
      };
    });
  }, []);

  return (
    <div className="play-tab" role="tabpanel" id="tabpanel-play" aria-labelledby="tab-play">
      <div className="game-grid">
        {gameProgress.map((game) => (
          <GameCard
            key={game.id}
            id={game.id}
            title={t(game.titleKey)}
            description={t(game.descriptionKey)}
            icon=""
            tags={game.tags.map((tag) => t(`tags.${tag}`))}
            to={game.to}
            progress={{ completed: game.completed, total: game.levelCount }}
          />
        ))}
      </div>
      <DailyChallengeBanner countdown={countdown} className="play-tab__daily" />
    </div>
  );
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/pages/Dashboard/tabs/PlayTab.tsx
git commit -m "$(cat <<'EOF'
feat(dashboard): add PlayTab component

Create Play tab content with:
- Game grid (3 GameCards with progress)
- DailyChallengeBanner below games
- Countdown timer logic for daily reset

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3.5: Create StatsTab component

**Goal:** Create Stats tab with detailed player statistics.

**Files:**
- Create: `src/pages/Dashboard/tabs/StatsTab.tsx`
- Create: `src/pages/Dashboard/tabs/StatsTab.css`

**Step 1: Create StatsTab.tsx**

Create `src/pages/Dashboard/tabs/StatsTab.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import { usePlayer } from '@/shared/contexts';
import { ProgressRing } from '@/shared/components';
import './StatsTab.css';

export function StatsTab() {
  const { t } = useTranslation();
  const { profile, currentRankInfo, nextRank, rankProgress } = usePlayer();
  const { stats } = profile;

  return (
    <div className="stats-tab" role="tabpanel" id="tabpanel-stats" aria-labelledby="tab-stats">
      {/* Overall Stats */}
      <section className="stats-tab__section">
        <h2 className="stats-tab__heading">{t('stats.overall')}</h2>
        <div className="stats-tab__grid">
          <div className="stats-tab__card">
            <span className="stats-tab__card-icon">🎮</span>
            <span className="stats-tab__card-value">{stats.totalGamesPlayed}</span>
            <span className="stats-tab__card-label">{t('stats.gamesPlayed')}</span>
          </div>
          <div className="stats-tab__card">
            <span className="stats-tab__card-icon">✓</span>
            <span className="stats-tab__card-value">{stats.totalPuzzlesSolved}</span>
            <span className="stats-tab__card-label">{t('stats.puzzlesSolved')}</span>
          </div>
          <div className="stats-tab__card">
            <span className="stats-tab__card-icon">🏆</span>
            <span className="stats-tab__card-value">{stats.totalWins}</span>
            <span className="stats-tab__card-label">{t('stats.wins')}</span>
          </div>
          <div className="stats-tab__card">
            <span className="stats-tab__card-icon">🔥</span>
            <span className="stats-tab__card-value">{profile.streak}</span>
            <span className="stats-tab__card-label">{t('stats.streak')}</span>
          </div>
        </div>
      </section>

      {/* Rank Progress */}
      <section className="stats-tab__section">
        <h2 className="stats-tab__heading">{t('stats.rankProgress')}</h2>
        <div className="stats-tab__rank-card">
          <div className="stats-tab__rank-current">
            <span
              className="stats-tab__rank-badge"
              style={{ background: currentRankInfo.color }}
            >
              {currentRankInfo.icon}
            </span>
            <div className="stats-tab__rank-info">
              <span className="stats-tab__rank-name">{t(`ranks.${currentRankInfo.id}`)}</span>
              {nextRank && rankProgress && (
                <span className="stats-tab__rank-next">
                  {t('stats.nextRank', { rank: t(`ranks.${nextRank.id}`) })}
                </span>
              )}
            </div>
          </div>
          {nextRank && rankProgress && (
            <div className="stats-tab__rank-progress">
              <ProgressRing
                completed={rankProgress.progressPercent}
                total={100}
                size={80}
              />
              <div className="stats-tab__rank-requirements">
                {rankProgress.gamesNeeded > 0 && (
                  <span>{t('stats.gamesNeeded', { count: rankProgress.gamesNeeded })}</span>
                )}
                {rankProgress.solvesNeeded > 0 && (
                  <span>{t('stats.solvesNeeded', { count: rankProgress.solvesNeeded })}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Per-Game Breakdown */}
      <section className="stats-tab__section">
        <h2 className="stats-tab__heading">{t('stats.breakdown')}</h2>
        <div className="stats-tab__breakdown">
          <div className="stats-tab__game-row">
            <span className="stats-tab__game-name">{t('games.magic-graph.name')}</span>
            <span className="stats-tab__game-stat">{stats.magicGraphGames} {t('stats.games')}</span>
            <span className="stats-tab__game-stat">{stats.magicGraphSolves} {t('stats.solves')}</span>
          </div>
          <div className="stats-tab__game-row">
            <span className="stats-tab__game-name">{t('games.sequence-race.name')}</span>
            <span className="stats-tab__game-stat">{stats.sequenceRaceGames} {t('stats.games')}</span>
            <span className="stats-tab__game-stat">{stats.sequenceRaceWins} {t('stats.winsShort')}</span>
          </div>
          <div className="stats-tab__game-row">
            <span className="stats-tab__game-name">{t('games.shape-architect.name')}</span>
            <span className="stats-tab__game-stat">{stats.shapeArchitectGames} {t('stats.games')}</span>
            <span className="stats-tab__game-stat">{stats.shapeArchitectSolves} {t('stats.solves')}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
```

**Step 2: Create StatsTab.css**

Create `src/pages/Dashboard/tabs/StatsTab.css`:

```css
/* ========================================
   Stats Tab
   ======================================== */

.stats-tab {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  max-width: 800px;
  margin: 0 auto;
}

.stats-tab__section {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  box-shadow: var(--shadow-sm);
}

.stats-tab__heading {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 var(--space-md) 0;
  padding-bottom: var(--space-sm);
  border-bottom: 2px solid var(--border-color);
}

/* ---- Overall Stats Grid ---- */

.stats-tab__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--space-md);
}

.stats-tab__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-md);
  background: var(--bg-subtle);
  border-radius: var(--radius-md);
  text-align: center;
}

.stats-tab__card-icon {
  font-size: 1.5rem;
}

.stats-tab__card-value {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--text-primary);
}

.stats-tab__card-label {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

/* ---- Rank Progress ---- */

.stats-tab__rank-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-lg);
  flex-wrap: wrap;
}

.stats-tab__rank-current {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.stats-tab__rank-badge {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  box-shadow: var(--shadow-md);
}

.stats-tab__rank-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.stats-tab__rank-name {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--text-primary);
}

.stats-tab__rank-next {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.stats-tab__rank-progress {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.stats-tab__rank-requirements {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

/* ---- Game Breakdown ---- */

.stats-tab__breakdown {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.stats-tab__game-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-subtle);
  border-radius: var(--radius-md);
  align-items: center;
}

.stats-tab__game-name {
  font-weight: 600;
  color: var(--text-primary);
}

.stats-tab__game-stat {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  text-align: right;
  min-width: 80px;
}

/* ---- Responsive ---- */

@media (max-width: 600px) {
  .stats-tab__rank-card {
    flex-direction: column;
    align-items: stretch;
  }

  .stats-tab__rank-progress {
    justify-content: center;
  }

  .stats-tab__game-row {
    grid-template-columns: 1fr;
    gap: var(--space-xs);
    text-align: center;
  }

  .stats-tab__game-stat {
    text-align: center;
  }
}
```

**Step 3: Add i18n keys**

Add to both `en.json` and `vi.json` under `"stats"` section (create if needed).

**en.json:**
```json
"stats": {
  "overall": "Overall Progress",
  "gamesPlayed": "Games Played",
  "puzzlesSolved": "Puzzles Solved",
  "wins": "Wins",
  "streak": "Day Streak",
  "rankProgress": "Rank Progress",
  "nextRank": "Next: {{rank}}",
  "gamesNeeded": "{{count}} more games",
  "solvesNeeded": "{{count}} more solves",
  "breakdown": "Per-Game Breakdown",
  "games": "games",
  "solves": "solves",
  "winsShort": "wins"
}
```

**vi.json:**
```json
"stats": {
  "overall": "Tiến độ tổng thể",
  "gamesPlayed": "Ván đã chơi",
  "puzzlesSolved": "Câu đố đã giải",
  "wins": "Chiến thắng",
  "streak": "Chuỗi ngày",
  "rankProgress": "Tiến độ cấp bậc",
  "nextRank": "Tiếp theo: {{rank}}",
  "gamesNeeded": "Cần thêm {{count}} ván",
  "solvesNeeded": "Cần giải thêm {{count}} câu",
  "breakdown": "Chi tiết từng game",
  "games": "ván",
  "solves": "giải",
  "winsShort": "thắng"
}
```

**Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat(dashboard): add StatsTab component

Create Stats tab with:
- Overall stats grid (games, puzzles, wins, streak)
- Rank progress card with badge and requirements
- Per-game breakdown table
- Responsive design
- Full i18n support

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3.6: Create AchievementsTab component

**Goal:** Create Achievements tab with full gallery (no expand/collapse).

**Files:**
- Create: `src/pages/Dashboard/tabs/AchievementsTab.tsx`
- Create: `src/pages/Dashboard/tabs/AchievementsTab.css`

**Step 1: Create AchievementsTab.tsx**

Create `src/pages/Dashboard/tabs/AchievementsTab.tsx`:

```tsx
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { usePlayer } from '@/shared/contexts';
import { ACHIEVEMENTS, type AchievementCategory } from '@/shared/services/achievements';
import './AchievementsTab.css';

const CATEGORY_ORDER: AchievementCategory[] = ['global', 'magic-graph', 'sequence-race', 'shape-architect'];
const CATEGORY_ICONS: Record<AchievementCategory, string> = {
  'global': '🌍',
  'magic-graph': '✨',
  'sequence-race': '🏃',
  'shape-architect': '🏗️',
};

const RARITY_COLORS: Record<string, string> = {
  common: 'var(--text-muted)',
  rare: 'var(--color-secondary)',
  epic: 'var(--color-magic)',
  legendary: 'var(--color-accent)',
};

export function AchievementsTab() {
  const { t } = useTranslation();
  const { profile } = usePlayer();

  const unlockedSet = useMemo(() => new Set(profile.achievements), [profile.achievements]);

  const categorizedAchievements = useMemo(() => {
    const grouped: Record<AchievementCategory, typeof ACHIEVEMENTS> = {
      'global': [],
      'magic-graph': [],
      'sequence-race': [],
      'shape-architect': [],
    };

    for (const achievement of ACHIEVEMENTS) {
      grouped[achievement.category].push(achievement);
    }

    return grouped;
  }, []);

  const stats = useMemo(() => ({
    unlocked: profile.achievements.length,
    total: ACHIEVEMENTS.length,
  }), [profile.achievements]);

  return (
    <div className="achievements-tab" role="tabpanel" id="tabpanel-achievements" aria-labelledby="tab-achievements">
      <div className="achievements-tab__header">
        <h2 className="achievements-tab__title">{t('achievements.title')}</h2>
        <span className="achievements-tab__count">
          {stats.unlocked} / {stats.total}
        </span>
      </div>

      {CATEGORY_ORDER.map((category) => (
        <section key={category} className="achievements-tab__category">
          <h3 className="achievements-tab__category-title">
            <span className="achievements-tab__category-icon">{CATEGORY_ICONS[category]}</span>
            {t(`achievements.categories.${category}`)}
          </h3>
          <div className="achievements-tab__grid">
            {categorizedAchievements[category].map((achievement) => {
              const isUnlocked = unlockedSet.has(achievement.id);
              return (
                <div
                  key={achievement.id}
                  className={`achievements-tab__card ${isUnlocked ? 'achievements-tab__card--unlocked' : 'achievements-tab__card--locked'}`}
                >
                  <span className="achievements-tab__card-icon">
                    {isUnlocked ? achievement.icon : '🔒'}
                  </span>
                  <div className="achievements-tab__card-content">
                    <span className="achievements-tab__card-name">
                      {t(`achievements.${achievement.id}.name`)}
                    </span>
                    <span
                      className="achievements-tab__card-rarity"
                      style={{ color: RARITY_COLORS[achievement.rarity] }}
                    >
                      {t(`achievements.rarity.${achievement.rarity}`)}
                    </span>
                    <span className="achievements-tab__card-description">
                      {isUnlocked
                        ? t(`achievements.${achievement.id}.description`)
                        : '???'
                      }
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
```

**Step 2: Create AchievementsTab.css**

Create `src/pages/Dashboard/tabs/AchievementsTab.css`:

```css
/* ========================================
   Achievements Tab
   ======================================== */

.achievements-tab {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  max-width: 900px;
  margin: 0 auto;
}

.achievements-tab__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.achievements-tab__title {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.achievements-tab__count {
  padding: var(--space-sm) var(--space-md);
  background: var(--color-primary);
  color: white;
  font-weight: 700;
  border-radius: var(--radius-full);
}

/* ---- Category Sections ---- */

.achievements-tab__category {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  box-shadow: var(--shadow-sm);
}

.achievements-tab__category-title {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 var(--space-md) 0;
  padding-bottom: var(--space-sm);
  border-bottom: 2px solid var(--border-color);
}

.achievements-tab__category-icon {
  font-size: 1.25rem;
}

/* ---- Achievement Grid ---- */

.achievements-tab__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-md);
}

.achievements-tab__card {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--bg-subtle);
  border-radius: var(--radius-md);
  border-left: 4px solid transparent;
  transition: all 0.2s var(--ease-out);
}

.achievements-tab__card--unlocked {
  border-left-color: var(--color-success);
  background: linear-gradient(135deg, var(--color-success-bg), var(--bg-subtle));
}

.achievements-tab__card--locked {
  opacity: 0.6;
}

.achievements-tab__card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.achievements-tab__card-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.achievements-tab__card-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  min-width: 0;
}

.achievements-tab__card-name {
  font-weight: 700;
  color: var(--text-primary);
}

.achievements-tab__card-rarity {
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
}

.achievements-tab__card-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.4;
}

/* ---- Responsive ---- */

@media (max-width: 600px) {
  .achievements-tab__grid {
    grid-template-columns: 1fr;
  }
}
```

**Step 3: Add i18n keys for categories**

Add to both `en.json` and `vi.json`:

**en.json:**
```json
"achievements": {
  "title": "Achievements",
  "categories": {
    "global": "Global",
    "magic-graph": "Magic Graph",
    "sequence-race": "Sequence Race",
    "shape-architect": "Shape Architect"
  },
  "rarity": {
    "common": "Common",
    "rare": "Rare",
    "epic": "Epic",
    "legendary": "Legendary"
  }
}
```

**vi.json:**
```json
"achievements": {
  "title": "Thành tựu",
  "categories": {
    "global": "Toàn cầu",
    "magic-graph": "Magic Graph",
    "sequence-race": "Sequence Race",
    "shape-architect": "Shape Architect"
  },
  "rarity": {
    "common": "Phổ thông",
    "rare": "Hiếm",
    "epic": "Sử thi",
    "legendary": "Huyền thoại"
  }
}
```

**Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat(dashboard): add AchievementsTab component

Create Achievements tab with:
- Header showing unlock progress (X/Y)
- Four category sections (global, per-game)
- Achievement cards with icon, name, rarity, description
- Locked achievements show ??? for description
- Rarity color coding
- Responsive grid layout

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3.7: Create tabs barrel export

**Goal:** Create index.ts for tabs directory.

**Files:**
- Create: `src/pages/Dashboard/tabs/index.ts`

**Step 1: Create barrel export**

Create `src/pages/Dashboard/tabs/index.ts`:

```typescript
export { PlayTab } from './PlayTab';
export { StatsTab } from './StatsTab';
export { AchievementsTab } from './AchievementsTab';
```

**Step 2: Commit**

```bash
git add src/pages/Dashboard/tabs/index.ts
git commit -m "$(cat <<'EOF'
chore(dashboard): add tabs barrel export

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3.8: Integrate new layout into Dashboard.tsx

**Goal:** Replace current Dashboard layout with new tabbed design.

**Files:**
- Modify: `src/pages/Dashboard.tsx`

**Step 1: Read current Dashboard.tsx**

Open `src/pages/Dashboard.tsx` to understand current structure.

**Step 2: Replace Dashboard implementation**

Update `src/pages/Dashboard.tsx`:

```tsx
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { usePlayer } from '@/shared/contexts';
import { DashboardTabs, type DashboardTabId } from '@/shared/components/layout';
import { ACHIEVEMENTS } from '@/shared/services/achievements';
import { CompactHeader } from './Dashboard/CompactHeader';
import { PlayTab, StatsTab, AchievementsTab } from './Dashboard/tabs';
import './Dashboard/Dashboard.css';

export function Dashboard() {
  const { t } = useTranslation();
  const { profile, currentRankInfo, checkStreak } = usePlayer();
  const [activeTab, setActiveTab] = useState<DashboardTabId>('play');

  // Check streak on mount
  useMemo(() => {
    checkStreak();
  }, [checkStreak]);

  const achievementCount = useMemo(() => ({
    unlocked: profile.achievements.length,
    total: ACHIEVEMENTS.length,
  }), [profile.achievements]);

  return (
    <div className="dashboard">
      <CompactHeader
        profile={profile}
        rankInfo={currentRankInfo}
        streak={profile.streak}
      />
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

**Step 3: Move Dashboard.tsx to Dashboard folder**

```bash
mv src/pages/Dashboard.tsx src/pages/Dashboard/Dashboard.tsx
```

**Step 4: Create Dashboard folder index**

Create `src/pages/Dashboard/index.ts`:

```typescript
export { Dashboard } from './Dashboard';
```

**Step 5: Update App.tsx import**

Update import in `src/App.tsx` from:
```typescript
import { Dashboard } from './pages/Dashboard';
```
to:
```typescript
import { Dashboard } from './pages/Dashboard';
```
(Should work with index.ts barrel export)

**Step 6: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 7: Manual test**

Run: `npm run dev`
- Dashboard loads with compact header
- Tab bar shows Play (active), Stats, Achievements
- Clicking tabs switches content
- Play tab shows game grid + daily challenge banner
- Stats tab shows detailed statistics
- Achievements tab shows full gallery

**Step 8: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat(dashboard): integrate tabbed layout redesign

Replace vertical scrolling layout with:
- Compact header (rank badge, name, streak, controls)
- Tab bar (Play, Stats, Achievements)
- Tab content panels

Games now appear above the fold in Play tab.
Stats and Achievements have dedicated tabs.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3.9: Update Dashboard.css for new layout

**Goal:** Update Dashboard styles for new tabbed layout.

**Files:**
- Create/Modify: `src/pages/Dashboard/Dashboard.css`

**Step 1: Create Dashboard.css**

Create `src/pages/Dashboard/Dashboard.css`:

```css
/* ========================================
   Dashboard Layout
   ======================================== */

.dashboard {
  min-height: 100vh;
  padding: var(--space-lg);
  background: var(--bg-base);
}

.dashboard__content {
  max-width: 1000px;
  margin: 0 auto;
}

/* ---- Play Tab Specific ---- */

.play-tab {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.play-tab__daily {
  margin-top: var(--space-md);
}

/* ---- Responsive ---- */

@media (max-width: 768px) {
  .dashboard {
    padding: var(--space-md);
  }
}

@media (max-width: 480px) {
  .dashboard {
    padding: var(--space-sm);
  }
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/pages/Dashboard/Dashboard.css
git commit -m "$(cat <<'EOF'
style(dashboard): add CSS for tabbed layout

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3.10: Mobile responsive testing and fixes

**Goal:** Ensure responsive design works on mobile viewports.

**Step 1: Start dev server**

Run: `npm run dev`

**Step 2: Test 360px viewport**

Using browser DevTools, set viewport to 360px width.
Check:
- [ ] Compact header stacks vertically
- [ ] Tab bar shows icons only (labels hidden)
- [ ] Game cards stack in single column
- [ ] Stats cards wrap properly
- [ ] Achievement cards stack in single column

**Step 3: Test 480px viewport**

Set viewport to 480px width.
Check:
- [ ] All components readable
- [ ] No horizontal overflow
- [ ] Touch targets >= 44px

**Step 4: Test 768px viewport**

Set viewport to 768px width.
Check:
- [ ] Layout transitions smoothly
- [ ] Game grid shows 2 columns
- [ ] Stats grid shows 2 columns

**Step 5: Apply fixes as needed**

If any issues found, update relevant CSS files.

**Step 6: Commit fixes**

```bash
git add -A
git commit -m "$(cat <<'EOF'
fix(dashboard): mobile responsive adjustments

[Describe specific fixes]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 4: Polish & Verification

### Task 4.1: Add tab transition animations

**Goal:** Add smooth transitions when switching tabs.

**Files:**
- Modify: `src/pages/Dashboard/Dashboard.css`

**Step 1: Add tab panel animations**

Add to `src/pages/Dashboard/Dashboard.css`:

```css
/* ---- Tab Panel Animations ---- */

.dashboard__content > * {
  animation: tabFadeIn 0.2s var(--ease-out);
}

@keyframes tabFadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .dashboard__content > * {
    animation: none;
  }
}
```

**Step 2: Verify animation**

Run: `npm run dev`
Switch between tabs - verify smooth fade-in animation.

**Step 3: Commit**

```bash
git add src/pages/Dashboard/Dashboard.css
git commit -m "$(cat <<'EOF'
style(dashboard): add tab transition animations

Add fade-in animation when switching tabs.
Respects prefers-reduced-motion.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4.2: Accessibility audit

**Goal:** Verify keyboard navigation and ARIA attributes.

**Step 1: Start dev server**

Run: `npm run dev`

**Step 2: Keyboard navigation test**

Navigate with Tab key only:
- [ ] Can reach all interactive elements
- [ ] Focus visible on all elements
- [ ] Tab order makes sense
- [ ] Tab bar responds to arrow keys
- [ ] Enter/Space activates buttons

**Step 3: Screen reader test**

Use VoiceOver (Mac) or NVDA (Windows):
- [ ] Tab bar announces as tablist
- [ ] Active tab announced as selected
- [ ] Tab panels have proper role
- [ ] Achievement count announced

**Step 4: Fix issues**

Apply fixes as needed.

**Step 5: Commit fixes**

```bash
git add -A
git commit -m "$(cat <<'EOF'
fix(a11y): address accessibility issues

[Describe specific fixes]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4.3: Run full test suite

**Goal:** Ensure all tests pass after refactoring.

**Step 1: Run tests**

Run: `npm test -- --run`

**Step 2: Fix failing tests**

If any tests fail, investigate and fix.

**Step 3: Run lint**

Run: `npm run lint`

**Step 4: Run build**

Run: `npm run build`

**Step 5: Commit if needed**

```bash
git add -A
git commit -m "$(cat <<'EOF'
fix: address test failures

[Describe fixes]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4.4: Update CLAUDE.md

**Goal:** Document new folder structure and conventions.

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update Project Structure section**

Update the project structure in CLAUDE.md to reflect:
- New `src/app/` directory
- New `src/pages/Dashboard/` structure with tabs
- New hooks subdirectories (game/, accessibility/, gestures/)
- New components subdirectories (ui/, layout/)
- New `src/shared/schemas/` directory

**Step 2: Add Dashboard Tabs section**

Add documentation about the new tabbed dashboard layout.

**Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "$(cat <<'EOF'
docs: update CLAUDE.md with new structure

Document:
- New folder organization (hooks/*, components/*, schemas/)
- Dashboard tabs architecture
- New component conventions

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4.5: Final verification

**Goal:** Complete end-to-end verification.

**Step 1: Clean install**

```bash
rm -rf node_modules
npm install
```

**Step 2: Build**

```bash
npm run build
```
Expected: No errors.

**Step 3: Preview**

```bash
npm run preview
```

Test all functionality:
- [ ] Dashboard loads with tabs
- [ ] All tabs work
- [ ] All games load
- [ ] Tutorials work correctly (z-index fixed)
- [ ] Mobile responsive

**Step 4: Final commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
chore: complete refactor sprint

Comprehensive refactor including:
- Tutorial z-index bug fix
- Repository restructuring
- Dashboard tabbed redesign

All tests pass. Build verified.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Success Criteria Checklist

- [ ] Tutorial tooltips render above the darkening overlay in all 3 games
- [ ] SequenceRace sidebar renders correctly during tutorial
- [ ] Dashboard loads with Play tab active, games visible above fold
- [ ] All 3 tabs functional: Play, Stats, Achievements
- [ ] Daily challenge appears as compact banner in Play tab
- [ ] New folder structure in place with all imports working
- [ ] Build passes with no errors
- [ ] All existing tests pass
- [ ] Mobile responsive layout works on 360px+ widths
- [ ] CLAUDE.md updated

---

## Appendix: File Change Summary

### Phase 1: Tutorial Bug Fix
| Action | File |
|--------|------|
| Modify | `src/shared/styles/tokens/spacing.css` |
| Modify | `src/shared/components/Tutorial/Tutorial.css` |
| Modify | `src/games/SequenceRace/SequenceRace.css` |

### Phase 2: Repo Restructuring
| Action | File |
|--------|------|
| Create | `src/app/` (directory) |
| Create | `src/shared/hooks/game/` + `index.ts` |
| Create | `src/shared/hooks/accessibility/` + `index.ts` |
| Create | `src/shared/hooks/gestures/` + `index.ts` |
| Create | `src/shared/components/ui/` + `index.ts` |
| Create | `src/shared/components/layout/` + `index.ts` |
| Create | `src/shared/schemas/playerProfile.schema.ts` |
| Create | `src/shared/schemas/daily.schema.ts` |
| Create | `src/shared/schemas/storage.schema.ts` |
| Create | `src/shared/schemas/index.ts` |
| Move | hooks → subcategories |
| Move | components → subcategories |
| Modify | `src/shared/hooks/index.ts` |
| Modify | `src/shared/components/index.ts` |
| Modify | `src/shared/utils/schemas.ts` (re-export) |

### Phase 3: Dashboard Redesign
| Action | File |
|--------|------|
| Create | `src/pages/Dashboard/CompactHeader.tsx` |
| Create | `src/pages/Dashboard/CompactHeader.css` |
| Create | `src/shared/components/layout/DashboardTabs.tsx` |
| Create | `src/shared/components/layout/DashboardTabs.css` |
| Create | `src/shared/components/DailyChallenge/DailyChallengeBanner.tsx` |
| Create | `src/shared/components/DailyChallenge/DailyChallengeBanner.css` |
| Create | `src/pages/Dashboard/tabs/PlayTab.tsx` |
| Create | `src/pages/Dashboard/tabs/StatsTab.tsx` |
| Create | `src/pages/Dashboard/tabs/StatsTab.css` |
| Create | `src/pages/Dashboard/tabs/AchievementsTab.tsx` |
| Create | `src/pages/Dashboard/tabs/AchievementsTab.css` |
| Create | `src/pages/Dashboard/tabs/index.ts` |
| Create | `src/pages/Dashboard/Dashboard.css` |
| Create | `src/pages/Dashboard/index.ts` |
| Move | `src/pages/Dashboard.tsx` → `src/pages/Dashboard/Dashboard.tsx` |
| Modify | i18n files (en.json, vi.json) |

### Phase 4: Polish
| Action | File |
|--------|------|
| Modify | `src/pages/Dashboard/Dashboard.css` |
| Modify | `CLAUDE.md` |
