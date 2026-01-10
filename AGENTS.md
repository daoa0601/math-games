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
- `@/*` → `./src/*`
- `@/shared/*` → `./src/shared/*`
- `@/games/*` → `./src/games/*`
- `@/i18n/*` → `./src/i18n/*`
- `@/pages/*` → `./src/pages/*`

**Import order:** React → external libs → internal modules (type-only first)
```typescript
import type { ButtonHTMLAttributes } from 'react';
import { forwardRef, useState } from 'react';
import { Button } from '@/shared/components';
```

### Formatting

- **NO comments** unless explicitly requested
- 2 spaces indentation, single quotes, semicolons, trailing commas

### Types

- Strict mode enabled (noImplicitAny, strictNullChecks)
- Interface for component props, type for primitives/objects
- Export types used by other modules

```typescript
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}
export type Difficulty = 'easy' | 'medium' | 'hard' | 'master' | 'grandmaster';
```

Use Zod schemas for runtime validation in `src/shared/schemas/`.

### Naming Conventions

- Components: PascalCase (`Button`, `GameLayout`)
- Hooks: camelCase with `use` prefix (`useGameTimer`)
- Constants: UPPER_SNAKE_CASE (`DEFAULT_TIMER_DURATION`)
- Functions: camelCase (`formatTime`)
- CSS: BEM-like flat names (`.action`, `.slab`, `.timer--critical`)

### Error Handling

- localStorage: catch and return defaults, log error
- Component-level: use TypeScript, no try-catch at render level
- Async: try/catch with user feedback

```typescript
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

```typescript
import { describe, it, expect } from 'vitest';
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

**Constraints:** NO gradients, NO box-shadow (use 1px borders), NO border-radius >2px, NO idle animations, NO emojis unless requested, Target: <150 lines per CSS file

**Typography:** `Playfair Display` (display), `JetBrains Mono` (UI/data)