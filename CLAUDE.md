# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

This is a React + TypeScript SPA for educational math games targeting primary to middle school students. It uses Vite for bundling and react-router-dom for navigation.

### Project Structure

```
src/
├── games/              # Each game is a self-contained module
│   ├── MagicGraph/     # Graph-based number placement puzzle
│   │   ├── logic/      # Solver, puzzles, types
│   │   ├── components/ # UI components
│   │   └── hooks/      # useHistory (undo/redo)
│   ├── SequenceRace/   # Turn-based strategy game vs AI
│   └── ShapeArchitect/ # Voxel-based geometry puzzle
├── shared/
│   ├── components/     # GameLayout, GameCard, LanguageSwitcher
│   └── utils/          # storage.ts, audio.ts
├── i18n/               # Internationalization (EN/VI)
│   └── locales/        # Translation JSON files
└── pages/              # Dashboard (game selector)
```

### Game Module Pattern

Each game follows this structure:
- `logic/` - Pure TypeScript game engine (types, solver/engine, presets)
- `components/` - React UI components specific to the game
- `[GameName]Game.tsx` - Main game component with state management
- `index.ts` - Barrel export

### Game Engines

**MagicGraph** (`logic/solver.ts`):
- Recursive backtracking constraint solver for graph puzzles
- `solve()` finds valid number assignments where each line sums to target
- `generatePuzzle()` creates unique-solution puzzles by solve→mask→validate

**SequenceRace** (`logic/engine.ts`):
- Minimax AI with memoization for "Race to N" game
- `getAIMove()` returns optimal/random moves based on difficulty
- `analyzePosition()` determines if current player has winning strategy

**ShapeArchitect** (`logic/engine.ts`):
- 3D voxel grid system (0=empty, 1=target, 2=filled)
- `canPlacePiece()` validates piece placement with collision detection
- `rotatePieceLayout()` handles 90° rotations around Z axis

### Key Patterns

- Game state is managed with React hooks (useState, useMemo, useCallback)
- Logic modules are pure functions - no React dependencies
- Visual feedback uses "traffic light" status system (incomplete/correct/incorrect/overflow)
- Drag-and-drop via @dnd-kit/core and @dnd-kit/sortable

### Storage Service (`shared/utils/storage.ts`)

Cross-game persistence using localStorage with a shared namespace:

```typescript
import { completeLevel, isLevelUnlocked, isLevelCompleted, getBestTime, getTotalScore, getGlobalStats, resetProgress } from '@/shared/utils';

// Mark level complete and unlock next
completeLevel('magic-graph', 'level_1', 45, 'level_2');

// Check level status
isLevelUnlocked('magic-graph', 'level_2', 'level_1'); // true if first level or unlocked
isLevelCompleted('magic-graph', 'level_1'); // true if completed

// Get stats
getBestTime('magic-graph', 'level_1'); // 45 or null
getTotalScore('magic-graph'); // cumulative score for one game
getGlobalStats(); // { totalScore, gamesPlayed, levelsCompleted } across all games

// Reset
resetProgress('magic-graph'); // clear all progress for a game
```

Storage key format: `math-games-{game-id}` (e.g., `math-games-magic-graph`)

### Audio Service (`shared/utils/audio.ts`)

Sound effects using Howler.js with lazy loading and localStorage persistence:

```typescript
import { playSound, toggleSound, isSoundEnabled } from '@/shared/utils';

// Play sound effects
playSound('place');   // Piece/number placement
playSound('error');   // Invalid action
playSound('win');     // Victory fanfare
playSound('click');   // UI interaction

// Toggle sounds on/off (persisted to localStorage)
toggleSound(false);   // Disable sounds
isSoundEnabled();     // Check if sounds enabled
```

Sound files location: `public/sounds/` (see `SOUNDS.md` for specifications)

### Internationalization (`src/i18n/`)

Bilingual support using react-i18next:

```typescript
import { useTranslation } from 'react-i18next';

const { t } = useTranslation('magicGraph');
t('hints.auditor'); // Get translated string
```

- **Languages:** English (en), Vietnamese (vi)
- **Default:** Vietnamese
- **Persistence:** Language preference saved to `localStorage` (`math-games-lang`)
- **Namespaces:** `common`, `magicGraph`, `sequenceRace`, `shapeArchitect`
- **UI Toggle:** `LanguageSwitcher` component in header

### Undo/Redo Hook (`games/MagicGraph/hooks/useHistory.ts`)

Generic history management hook with keyboard shortcuts:

```typescript
import { useHistory } from './hooks/useHistory';

const { current, set, undo, redo, canUndo, canRedo, reset } = useHistory(initialState);

// Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Y or Ctrl+Shift+Z (redo)
```

- Max history depth: 50 entries
- Used by MagicGraph for tracking number placements

## Implementation Status

See `TASKS.md` for current progress.

**Completed:** Core engines, puzzle generation, hint systems (Auditor/Starter/Algebraist), storage service, audio infrastructure, i18n (EN/VI), undo/redo, win animations, 74 unit tests.

**Remaining:** Web Worker for solver, 3D mode, custom editors, two-player mode, mobile optimization, accessibility.
