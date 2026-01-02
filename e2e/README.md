# E2E Testing with Playwright

End-to-end tests for the Math Games educational app using Playwright.

## Quick Start

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# View test report
npm run test:e2e:report
```

## Project Structure

```
e2e/
├── fixtures/
│   └── test-utils.ts          # localStorage helpers, test data fixtures
├── pages/
│   ├── Dashboard.page.ts      # Dashboard page object
│   └── MagicGraph.page.ts     # MagicGraph game page object
├── example.spec.ts            # Example tests demonstrating usage
└── README.md                  # This file
```

## Writing Tests

### Using Page Objects

Page objects encapsulate page structure and provide reusable methods:

```typescript
import { test, expect } from '@playwright/test';
import { DashboardPage } from './pages/Dashboard.page';
import { setupFreshTestState } from './fixtures/test-utils';

test('navigate to game', async ({ page }) => {
  await setupFreshTestState(page); // Clean state

  const dashboard = new DashboardPage(page);
  await dashboard.goto();
  await dashboard.waitForLoad();

  await dashboard.playGame('magic-graph');
  await expect(page).toHaveURL(/\/magic-graph/);
});
```

### Using Test Fixtures

Test utilities provide helpers for localStorage manipulation:

```typescript
import {
  setupFreshTestState,
  DEFAULT_TEST_PLAYER,
  INTERMEDIATE_TEST_PLAYER,
  clearLocalStorage,
  seedPlayerProfile,
  completeTutorial
} from './fixtures/test-utils';

test.beforeEach(async ({ page }) => {
  // Option 1: Fresh state with default player
  await setupFreshTestState(page, DEFAULT_TEST_PLAYER);

  // Option 2: Test with progressed player
  await setupFreshTestState(page, INTERMEDIATE_TEST_PLAYER);

  // Option 3: Manual setup
  await clearLocalStorage(page);
  await seedPlayerProfile(page, customProfile);
  await completeTutorial(page, 'magic-graph');
});
```

### Available Fixtures

#### Player Profiles

- `DEFAULT_TEST_PLAYER` - Beginner with no progress
- `INTERMEDIATE_TEST_PLAYER` - Intermediate rank with some achievements

#### Helper Functions

- `clearLocalStorage(page)` - Clear all storage
- `seedPlayerProfile(page, profile)` - Seed player data
- `getPlayerProfile(page)` - Get current profile
- `updatePlayerProfile(page, updates)` - Update profile fields
- `completeTutorial(page, gameId)` - Mark tutorial as done
- `completeDailyChallenge(page, gameId, date)` - Mark daily complete
- `setupFreshTestState(page, profile)` - Complete test setup

## Page Objects

### DashboardPage

Methods for interacting with the dashboard:

```typescript
const dashboard = new DashboardPage(page);

// Navigation
await dashboard.goto();
await dashboard.waitForLoad();

// Tab switching
await dashboard.switchTab('play');
await dashboard.switchTab('stats');
await dashboard.switchTab('achievements');

// Game navigation
await dashboard.playGame('magic-graph');
await dashboard.startDailyChallenge('sequence-race');

// Get info
const playerInfo = await dashboard.getPlayerInfo();
const achievements = await dashboard.getAchievementCount();
const isVisible = await dashboard.isGameCardVisible('magic-graph');

// Controls
await dashboard.toggleSound();
await dashboard.switchLanguage();
```

### MagicGraphPage

Methods for interacting with MagicGraph game:

```typescript
const magicGraph = new MagicGraphPage(page);

// Navigation
await magicGraph.goto();
await magicGraph.goto({ daily: true, difficulty: 'hard' });
await magicGraph.waitForLoad();

// Game interaction
await magicGraph.clickEmptyNode(0);
await magicGraph.selectNumber(5);
await magicGraph.placeNumber('node-1', 3);

// Get game state
const nodes = await magicGraph.getAllNodes();
const targetSum = await magicGraph.getTargetSum();
const availableNumbers = await magicGraph.getAvailableNumbers();
const lineStatuses = await magicGraph.getLineStatuses();

// Controls
await magicGraph.restart();
await magicGraph.getHint();
await magicGraph.changeDifficulty('hard');
await magicGraph.togglePracticeMode();

// Win state
const isSolved = await magicGraph.isPuzzleSolved();
const winMessage = await magicGraph.getWinMessage();
await magicGraph.playAgain();

// Navigation
await magicGraph.goBack();
```

## Test Patterns

### Setup and Teardown

```typescript
test.describe('Feature Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Fresh state before each test
    await setupFreshTestState(page, DEFAULT_TEST_PLAYER);
  });

  test('test case', async ({ page }) => {
    // Test implementation
  });
});
```

### Testing User Flows

```typescript
test('complete game flow', async ({ page }) => {
  // 1. Start from dashboard
  const dashboard = new DashboardPage(page);
  await dashboard.goto();
  await dashboard.waitForLoad();

  // 2. Navigate to game
  await dashboard.playGame('magic-graph');

  // 3. Play game
  const magicGraph = new MagicGraphPage(page);
  await magicGraph.waitForLoad();
  await magicGraph.placeNumber('node-1', 3);

  // 4. Return to dashboard
  await magicGraph.goBack();
  await expect(page).toHaveURL('/');
});
```

### Testing Achievements

```typescript
test('unlock achievement', async ({ page }) => {
  await setupFreshTestState(page, DEFAULT_TEST_PLAYER);

  const dashboard = new DashboardPage(page);
  await dashboard.goto();

  // Check initial count
  const before = await dashboard.getAchievementCount();
  expect(before.unlocked).toBe(0);

  // Complete action that unlocks achievement
  await dashboard.playGame('magic-graph');
  const magicGraph = new MagicGraphPage(page);
  await magicGraph.waitForLoad();
  // ... solve puzzle ...

  // Return and verify
  await magicGraph.goBack();
  const after = await dashboard.getAchievementCount();
  expect(after.unlocked).toBeGreaterThan(before.unlocked);
});
```

## Configuration

See `playwright.config.ts` for full configuration.

### Key Settings

- **Test Directory**: `./e2e`
- **Base URL**: `http://localhost:5173`
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Screenshots**: On failure
- **Traces**: On first retry
- **Dev Server**: Auto-starts Vite before tests

### Running Specific Tests

```bash
# Run specific file
npx playwright test e2e/example.spec.ts

# Run specific test by name
npx playwright test -g "should display dashboard"

# Run in headed mode (see browser)
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# Run on specific browser
npx playwright test --project=chromium
npx playwright test --project="Mobile Chrome"
```

## Debugging

### UI Mode (Recommended)

```bash
npm run test:e2e:ui
```

Interactive mode with:
- Time travel debugging
- Watch mode
- Network tab
- Console logs
- Screenshots

### Debug Mode

```bash
npx playwright test --debug
```

Opens Playwright Inspector for step-by-step debugging.

### Screenshots on Failure

Failed tests automatically capture screenshots in `test-results/`.

### Traces on Retry

When tests retry, traces are captured. View with:

```bash
npx playwright show-trace test-results/.../trace.zip
```

## Best Practices

### 1. Use Page Objects

Encapsulate page structure and interactions in page objects.

### 2. Setup Fresh State

Always start tests with clean localStorage state.

### 3. Wait for Load

Use `waitForLoad()` methods to ensure pages are ready.

### 4. Avoid Hard Timeouts

Use Playwright's auto-waiting instead of `waitForTimeout()` when possible.

### 5. Use Data Attributes

Prefer `data-*` attributes and ARIA roles over CSS selectors:

```typescript
// Good
page.getByRole('button', { name: 'Play' })
page.locator('[data-testid="game-card"]')

// Avoid
page.locator('.button.primary')
```

### 6. Skip Tutorials

Use `completeTutorial()` fixture to avoid tutorial overlays:

```typescript
await completeTutorial(page, 'magic-graph');
```

### 7. Disable Sound in Tests

Use `DEFAULT_TEST_PLAYER` which has `soundEnabled: false`.

## CI/CD Integration

Tests run automatically in CI with:
- Retry on failure (2 retries)
- Serial execution (1 worker)
- HTML report artifacts

## Troubleshooting

### Test Timeout

Increase timeout in test:

```typescript
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // ...
});
```

### Flaky Tests

1. Use `waitForLoad()` methods
2. Avoid race conditions with proper waiting
3. Check for animations completing
4. Use `test.retry(2)` for inherently flaky tests

### Browser Not Installed

```bash
npx playwright install chromium
# Or install all browsers
npx playwright install
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Best Practices](https://playwright.dev/docs/best-practices)
