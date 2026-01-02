# Math Games Testing & Storybook Revival Plan

## Summary

Comprehensive testing infrastructure setup:
1. **Revive Storybook** - Install deps, add scripts, create 20+ stories
2. **Playwright E2E** - Full game testing for all 3 games
3. **Unit Tests** - Run existing Vitest suite with coverage

---

## Phase 1: Storybook Revival

### 1.1 Install Dependencies

```bash
npm install -D storybook@latest @storybook/react-vite @storybook/addon-docs @storybook/addon-a11y @storybook/addon-vitest @storybook/addon-onboarding @chromatic-com/storybook
```

### 1.2 Add npm Scripts

**Modify: `/package.json`**
```json
"scripts": {
  "storybook": "storybook dev -p 6006",
  "build-storybook": "storybook build"
}
```

### 1.3 Create New Stories (20 files)

| Category | Component | File Path |
|----------|-----------|-----------|
| UI | ProgressRing | `src/shared/components/ui/ProgressRing.stories.tsx` |
| UI | DifficultySelector | `src/shared/components/ui/DifficultySelector.stories.tsx` |
| Layout | GameLayout | `src/shared/components/layout/GameLayout.stories.tsx` |
| Layout | DashboardTabs | `src/shared/components/layout/DashboardTabs.stories.tsx` |
| Gamification | StatsDisplay | `src/shared/components/gamification/StatsDisplay.stories.tsx` |
| Gamification | AchievementToast | `src/shared/components/gamification/AchievementToast.stories.tsx` |
| Gamification | RankUpOverlay | `src/shared/components/gamification/RankUpOverlay.stories.tsx` |
| DailyChallenge | DailyChallenge | `src/shared/components/DailyChallenge/DailyChallenge.stories.tsx` |
| DailyChallenge | DailyChallengeBanner | `src/shared/components/DailyChallenge/DailyChallengeBanner.stories.tsx` |
| Tutorial | Tutorial | `src/shared/components/Tutorial/Tutorial.stories.tsx` |
| Settings | HighContrastToggle | `src/shared/components/HighContrastToggle.stories.tsx` |
| Settings | LanguageSwitcher | `src/shared/components/LanguageSwitcher.stories.tsx` |
| Settings | SoundToggle | `src/shared/components/SoundToggle.stories.tsx` |
| Icons | MagicGraphIcon | `src/shared/components/icons/MagicGraphIcon.stories.tsx` |
| Icons | SequenceRaceIcon | `src/shared/components/icons/SequenceRaceIcon.stories.tsx` |
| Icons | ShapeArchitectIcon | `src/shared/components/icons/ShapeArchitectIcon.stories.tsx` |
| Overlays | ErrorFallback | `src/shared/components/ErrorFallback.stories.tsx` |
| A11y | ScreenReaderAnnounce | `src/shared/components/ScreenReaderAnnounce.stories.tsx` |
| PersonalBest | PersonalBestIndicator | `src/shared/components/PersonalBest/PersonalBestIndicator.stories.tsx` |
| Layout | HelpButton | `src/shared/components/HelpButton.stories.tsx` |

**Story Pattern** (following existing Button.stories.tsx):
```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { ComponentName } from './ComponentName'

const meta: Meta<typeof ComponentName> = {
  title: 'Category/ComponentName',
  component: ComponentName,
  tags: ['autodocs'],
  decorators: [/* PlayerProvider, MemoryRouter if needed */],
}
export default meta
type Story = StoryObj<typeof ComponentName>

export const Default: Story = { args: {} }
```

---

## Phase 2: Playwright E2E Setup

### 2.1 Create Configuration

**Create: `/playwright.config.ts`**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 2.2 Add npm Scripts

**Modify: `/package.json`**
```json
"scripts": {
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:report": "playwright show-report"
}
```

### 2.3 E2E Directory Structure

```
e2e/
├── fixtures/
│   └── test-utils.ts          # localStorage helpers, player fixtures
├── pages/
│   ├── Dashboard.page.ts      # Page object for dashboard
│   ├── MagicGraph.page.ts     # Page object for MagicGraph
│   ├── SequenceRace.page.ts   # Page object for SequenceRace
│   └── ShapeArchitect.page.ts # Page object for ShapeArchitect
├── dashboard.spec.ts          # Dashboard navigation, tabs
├── magic-graph.spec.ts        # Full MagicGraph gameplay
├── sequence-race.spec.ts      # Full SequenceRace gameplay
├── shape-architect.spec.ts    # Full ShapeArchitect gameplay
├── navigation.spec.ts         # Cross-game routing
├── progression.spec.ts        # Stats, achievements, ranks
├── daily-challenge.spec.ts    # Daily challenge flow
└── accessibility.spec.ts      # Keyboard nav, ARIA, focus
```

### 2.4 Test Coverage by Game

**MagicGraph (`magic-graph.spec.ts`)**
- Game initialization with difficulty selection
- Node click to place numbers
- Number selection panel
- Win detection and overlay
- Timer in timed mode
- Practice mode (no stat tracking)
- Restart/new game
- Navigation back to dashboard

**SequenceRace (`sequence-race.spec.ts`)**
- Game initialization with AI opponent
- Turn-based move selection
- Win/lose conditions
- AI response verification
- Timer countdown
- Difficulty levels
- Game overlays

**ShapeArchitect (`shape-architect.spec.ts`)**
- 3D canvas rendering
- Voxel drag-and-drop
- Target shape matching
- Camera controls
- Win detection
- Grid toggle

---

## Phase 3: Unit Test Execution

### 3.1 Run Existing Tests

```bash
npm run test:coverage
```

**Current Test Files (10):**
- `src/shared/utils/__tests__/storage.test.ts`
- `src/shared/components/Tutorial/__tests__/Tutorial.test.tsx`
- `src/shared/machines/__tests__/tutorialMachine.test.ts`
- `src/shared/hooks/__tests__/useGameTimer.test.ts`
- `src/shared/hooks/__tests__/useTutorial.test.ts`
- `src/games/ShapeArchitect/logic/__tests__/engine.test.ts`
- `src/games/MagicGraph/logic/__tests__/solver.test.ts`
- `src/games/MagicGraph/hooks/__tests__/useHistory.test.ts`
- `src/games/SequenceRace/logic/__tests__/engine.test.ts`
- `src/games/SequenceRace/logic/__tests__/presets.test.ts`

---

## Execution Order

1. **Run unit tests first** - `npm run test:coverage` (verify baseline)
2. **Install Storybook deps** - npm install command
3. **Add package.json scripts** - storybook + e2e scripts
4. **Test Storybook** - `npm run storybook` with existing 4 stories
5. **Create new stories** - 20 files following pattern
6. **Create Playwright config** - playwright.config.ts
7. **Create e2e directory structure** - fixtures, pages, specs
8. **Write E2E tests** - Start with navigation, then per-game
9. **Run full E2E suite** - `npm run test:e2e`
10. **Verify Playwright in browser** - Visual inspection

---

## Critical Files

| Action | File |
|--------|------|
| Modify | `/package.json` - Add deps + scripts |
| Verify | `/.storybook/main.ts` - Config already exists |
| Verify | `/.storybook/preview.ts` - Config already exists |
| Create | `/playwright.config.ts` |
| Create | `/e2e/` directory (8 spec files + 5 support files) |
| Create | 20 new `*.stories.tsx` files |

---

## Risk Mitigations

| Risk | Mitigation |
|------|------------|
| React 19 + Storybook compatibility | Use `storybook@latest` (8.5+) |
| Three.js in Storybook | Wrap ShapeArchitect scenes with fixed canvas size |
| E2E flakiness from animations | Use `waitFor` conditions, consider disabling animations |
| ShapeArchitect 3D headless | Test canvas presence, not pixel rendering |
| localStorage conflicts in E2E | Clear storage in `beforeEach` |
