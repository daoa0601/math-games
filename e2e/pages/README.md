# E2E Page Objects

Page Object Model (POM) implementations for Playwright E2E tests. Each game has a dedicated page object with clear, reusable selectors and helper methods.

## Structure

```
e2e/pages/
├── Dashboard.page.ts        # Dashboard with tabs (Play, Stats, Achievements)
├── MagicGraph.page.ts        # Graph-based number placement puzzle
├── SequenceRace.page.ts      # Turn-based strategy game vs AI
├── ShapeArchitect.page.ts    # 3D voxel-based geometry puzzle
├── index.ts                  # Barrel exports
└── README.md                 # This file
```

## Usage

Import page objects from the barrel export:

```typescript
import { SequenceRacePage, ShapeArchitectPage } from '../pages';

test('example test', async ({ page }) => {
  const sequenceRace = new SequenceRacePage(page);
  await sequenceRace.goto();
  await sequenceRace.selectStep(1);
});
```

## Page Objects

### SequenceRacePage

Turn-based strategy game where players race to reach a target number using arithmetic sequences.

**Key Features:**
- AI opponent with difficulty levels (easy, medium, hard)
- Two-player local mode
- Daily challenge support
- Move history tracking
- Hints system

**Common Methods:**

```typescript
// Navigation
await sequenceRace.goto();              // Regular mode
await sequenceRace.goto(true);          // Daily challenge mode

// Game controls
await sequenceRace.selectStep(2);       // Make a move
await sequenceRace.waitForAIMove();     // Wait for AI response
await sequenceRace.setDifficulty('hard');
await sequenceRace.switchToTwoPlayer();

// Game state
const target = await sequenceRace.getTargetNumber();
const position = await sequenceRace.getCurrentPosition();
const turn = await sequenceRace.getCurrentTurn();
const moveCount = await sequenceRace.getMoveCount();

// Helpers
await sequenceRace.toggleHints();
await sequenceRace.restart();
await sequenceRace.startRandomGame();

// Win/Lose state
const won = await sequenceRace.isGameWon();
const lost = await sequenceRace.isGameLost();
const timeUp = await sequenceRace.isTimeUp();
```

**Key Selectors:**

| Selector | Purpose |
|----------|---------|
| `stepCards` | Available move buttons |
| `historyLog` | Move history entries |
| `raceTrack` | Visual game board |
| `playerRunner` / `aiRunner` | Player positions |
| `gameOverOverlay` | Win/lose overlay |
| `difficultySelector` | Difficulty buttons |
| `modeToggle` | VS AI / Two Player toggle |

### ShapeArchitectPage

3D voxel-based geometry puzzle where players place tetromino pieces to fill a target shape.

**Key Features:**
- 2D and 3D view modes
- Piece rotation on X, Y, Z axes
- Camera presets (isometric, top, front, side)
- Layer visibility controls
- Drag-and-drop and click placement
- Keyboard shortcuts (R, T, Y for rotation, Ctrl+Z for undo)

**Common Methods:**

```typescript
// Navigation
await shapeArchitect.goto();            // Regular mode
await shapeArchitect.goto(true);        // Daily challenge mode

// Piece management
await shapeArchitect.selectPiece(0);    // By index
await shapeArchitect.selectPieceByName('L-Block');
const piecesLeft = await shapeArchitect.getPiecesLeft();

// Placement
await shapeArchitect.clickCell(x, y, z);
await shapeArchitect.undo();

// Rotation
await shapeArchitect.rotateX();
await shapeArchitect.rotateY();
await shapeArchitect.rotateZ();
const rotation = await shapeArchitect.getRotation();

// View controls
await shapeArchitect.switchTo2D();
await shapeArchitect.switchTo3D();
await shapeArchitect.setCameraPreset('isometric');
await shapeArchitect.setMaxVisibleLayer(2);

// Keyboard shortcuts
await shapeArchitect.pressRotationKey('r'); // Z-axis
await shapeArchitect.pressRotationKey('t'); // X-axis
await shapeArchitect.pressRotationKey('y'); // Y-axis
await shapeArchitect.deselectPiece();       // Escape
await shapeArchitect.undoWithKeyboard();    // Ctrl+Z

// Game state
const solved = await shapeArchitect.isPuzzleSolved();
const timeUp = await shapeArchitect.isTimeUp();
const hasError = await shapeArchitect.hasPlacementError();
```

**Key Selectors:**

| Selector | Purpose |
|----------|---------|
| `gridBoard` | 2D grid display |
| `canvas3D` | Three.js 3D canvas |
| `pieceInventory` | Available pieces |
| `rotationControls` | X/Y/Z rotation buttons |
| `viewModeToggle` | 2D/3D switch |
| `cameraPresetButtons` | Camera angle controls |
| `layerControls` | Layer visibility slider |
| `winOverlay` | Puzzle solved overlay |
| `placementError` | Error feedback message |

## Common Patterns

### Timer Controls

Both games share timer functionality:

```typescript
// Practice mode (no timer)
await page.togglePracticeMode();

// Pause/Resume
await page.pauseTimer();
await page.resumeTimer();
```

### Daily Challenges

Both games support daily challenges:

```typescript
await page.goto(true); // daily=true parameter
await expect(page.dailyBadge).toBeVisible();
await expect(page.dailyCheckmark).toBeVisible(); // If completed
```

### Difficulty Levels

Both games have difficulty selectors:

```typescript
await page.setDifficulty('easy');
await page.setDifficulty('medium');
await page.setDifficulty('hard');
```

### Game Overlays

Both games use overlays for win/lose/timeup states:

```typescript
// SequenceRace
if (await sequenceRace.isGameWon()) {
  const time = await sequenceRace.getElapsedTime();
  await sequenceRace.playAgain();
}

// ShapeArchitect
if (await shapeArchitect.isPuzzleSolved()) {
  const time = await shapeArchitect.getElapsedTime();
  await shapeArchitect.clickNextLevelInOverlay();
}
```

## Best Practices

### 1. Use Semantic Locators

Page objects use Playwright's recommended locators:

```typescript
// Good: Role-based (accessible)
this.playAgainButton = page.getByRole('button', { name: /play again/i });

// Good: Data attributes or CSS classes
this.stepCards = page.locator('.step-cards');

// Avoid: XPath or brittle selectors
```

### 2. Return Typed Values

Helper methods return properly typed values:

```typescript
async getTargetNumber(): Promise<number> {
  const text = await this.targetValue.textContent();
  return text ? parseInt(text, 10) : 0;
}
```

### 3. Encapsulate Complex Interactions

Complex interactions are wrapped in methods:

```typescript
// Instead of:
await page.locator('.step-card', { hasText: '+2' }).click();

// Use:
await sequenceRace.selectStep(2);
```

### 4. Wait for State Changes

Async operations include appropriate waits:

```typescript
async waitForAIMove() {
  await this.page.waitForTimeout(1000); // AI thinking
  await this.currentTurnText.waitFor({ state: 'visible' });
}
```

### 5. Boolean Checks

State checks return booleans:

```typescript
async isGameWon(): Promise<boolean> {
  return await this.winOverlay.isVisible();
}
```

## Testing Strategy

### Unit-level Tests

Test individual interactions:

```typescript
test('can select a step', async ({ page }) => {
  const sequenceRace = new SequenceRacePage(page);
  await sequenceRace.goto();
  await sequenceRace.selectStep(1);
  const position = await sequenceRace.getCurrentPosition();
  expect(position).toBe(1);
});
```

### Integration Tests

Test complete game flows:

```typescript
test('can complete a game', async ({ page }) => {
  const sequenceRace = new SequenceRacePage(page);
  await sequenceRace.goto();

  // Play until win or lose
  while (!(await sequenceRace.isGameWon()) &&
         !(await sequenceRace.isGameLost())) {
    await sequenceRace.selectStep(1);
    await sequenceRace.waitForAIMove();
  }

  expect(await sequenceRace.isGameWon()).toBe(true);
});
```

### Cross-browser Tests

Page objects work across all browsers:

```typescript
test.describe('SequenceRace on all browsers', () => {
  test.use({ browserName: 'chromium' });
  test.use({ browserName: 'firefox' });
  test.use({ browserName: 'webkit' });

  test('plays correctly', async ({ page }) => {
    // Test implementation
  });
});
```

## Maintenance

### Adding New Selectors

When game UI changes, update the corresponding page object:

1. Add the new locator as a class property
2. Initialize it in the constructor
3. Add helper methods if needed
4. Update this README with the new functionality

### Updating Selectors

If CSS classes or structure changes:

1. Update the locator in the constructor
2. Run tests to verify nothing breaks
3. Update tests that depend on the selector

### Adding New Games

To add a new game page object:

1. Create `GameName.page.ts` in this directory
2. Follow the existing pattern (see SequenceRacePage as template)
3. Export from `index.ts`
4. Add documentation to this README
5. Create example usage in `e2e/examples/`

## Related Files

- `/e2e/examples/` - Example usage of page objects
- `/playwright.config.ts` - Playwright configuration
- `/src/games/` - Game implementation (source of selectors)
