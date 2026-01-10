# AGENTS.md

This file provides guidance for agentic coding agents working in this repository.

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
npm run test:e2e     # Run Playwright E2E tests
npm run test:e2e:ui  # Run E2E tests with interactive UI

# Component Development
npm run storybook       # Launch Storybook component explorer
npm run build-storybook # Build static Storybook site
```

### Running a Single Test

```bash
# Unit test: specific file
npm test -- src/shared/hooks/__tests__/useGameTimer.test.ts

# E2E test: specific file
npm run test:e2e -- e2e/dashboard.spec.ts

# E2E test: specific test name
npm run test:e2e -- --grep "navigates to games"
```

---

## Code Style Guidelines

### Imports

Use path aliases for all imports from `src/`:

```typescript
import { Button } from '@/shared/components/ui/Button';
import { useGameTimer } from '@/shared/hooks/game/useGameTimer';
import { PlayerProfileSchema } from '@/shared/schemas/playerProfile.schema';
```

Available aliases:
- `@/*` → `./src/*`
- `@/shared/*` → `./src/shared/*`
- `@/games/*` → `./src/games/*`
- `@/i18n/*` → `./src/i18n/*`
- `@/pages/*` → `./src/pages/*`

**Import order:** React → external libs → internal modules (type-only first)

```typescript
import type { ButtonHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components';
import { useGameTimer } from '@/shared/hooks';
```

### Formatting

- **NO comments** unless explicitly requested
- 2 spaces indentation
- Single quotes for strings, double quotes in JSX attributes
- Semicolons required
- Trailing commas where valid

### Types

- **Strict mode** enabled (noImplicitAny, strictNullChecks)
- Interface for component props, type for primitives/objects
- Export types used by other modules

```typescript
// Component props
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
}

// Regular types
export type Difficulty = 'easy' | 'medium' | 'hard' | 'master' | 'grandmaster';
```

Use Zod schemas for runtime validation in `src/shared/schemas/`.

### Naming Conventions

```typescript
// Components: PascalCase
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(...)  // OK
const GameLayout = () => { ... }  // OK

// Hooks: camelCase with 'use' prefix
export function useGameTimer() { ... }  // OK
const useFocusTrap = () => { ... }  // OK

// Constants: UPPER_SNAKE_CASE
export const DEFAULT_TIMER_DURATION = 120;  // OK
const TIME_WARNING_THRESHOLDS = [30, 10];  // OK

// Functions: camelCase
export function formatTime(seconds: number): string { ... }  // OK
const checkPersonalBest = (gameId, levelId, time) => { ... }  // OK

// CSS classes: BEM-like flat names
.button           // OK
.action--primary   // OK
.slab__title       // OK
.timer--critical   // OK
```

### Error Handling

- localStorage operations: catch and return defaults, log error
- Component-level: use TypeScript, no try-catch at render level
- Async operations: try/catch with user feedback

```typescript
// Storage pattern (see storage.ts)
export function getProgress(gameId: StorageGameId): GameProgress {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultProgress;
  } catch (error) {
    console.error(`Failed to load progress for ${gameId}:`, error);
    return defaultProgress;
  }
}
```

### Module Patterns

**Game modules:** `logic/`, `components/`, `hooks/`, `[GameName]Game.tsx`, `index.ts`

**Shared hooks:** Categorized in `src/shared/hooks/game/`, `accessibility/`, `gestures/`

**Lazy state:** `useState(() => getInitialState())` for localStorage

**Performance:** `React.memo`, `useMemo`, `useCallback` on hot paths

### Testing

- Unit: Vitest + Testing Library (`@testing-library/react`)
- Component: Storybook (visual regression)
- E2E: Playwright (user flows)
- Test files: `__tests__/` or `*.test.ts`
- Setup: `src/test/setup.ts` mocks localStorage
- Assertions: `.toEqual()`, `.toBe()`, `.toContain()`, `.toHaveBeenCalled()`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

describe('useGameTimer', () => {
  it('returns default progress when no data exists', () => {
    const { result } = renderHook(() => useGameTimer({ isGameOver: false }));
    expect(result.current.timeLeft).toBe(120);
  });
});
```

### Design System (Linear Editorial)

**Colors:** `--bg`, `--surface`, `--border`, `--text`, `--muted`, `--accent`, `--success`

**Constraints:**
- NO gradients (flat colors only)
- NO box-shadow (use 1px borders)
- NO border-radius >2px
- NO idle animations
- NO emojis unless requested
- Target: <150 lines per CSS file

**Typography:** `Playfair Display` (display), `JetBrains Mono` (UI/data)

---

## ESLint Rules

### Module Boundaries

**Cross-game imports forbidden:**
- MagicGraph → SequenceRace/ShapeArchitect
- SequenceRace → MagicGraph/ShapeArchitect
- ShapeArchitect → MagicGraph/SequenceRace
- shared/ → games/

Move shared code to `src/shared/`.

---

## TypeScript Config

- Target: ES2022
- Module: ESNext
- JSX: react-jsx
- Strict mode enabled
- No unused locals/parameters
- `verbatimModuleSyntax` for clean imports
