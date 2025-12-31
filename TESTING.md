# Testing Guide

## Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm test -- run

# Run with coverage report
npm run test:coverage

# Open Vitest UI
npm run test:ui
```

## Test Structure

```
src/
├── shared/utils/__tests__/
│   └── storage.test.ts        # Storage service tests
├── games/
│   ├── MagicGraph/hooks/__tests__/
│   │   └── useHistory.test.ts # Undo/redo hook tests
│   └── SequenceRace/logic/__tests__/
│       ├── engine.test.ts     # Game engine tests
│       └── presets.test.ts    # Sequence generator tests
```

## Coverage

Current coverage: **74 tests** across 4 test files

| Module | Tests |
|--------|-------|
| Storage Service | 18 |
| useHistory Hook | 18 |
| SequenceRace Engine | 20 |
| SequenceRace Presets | 18 |

## Writing New Tests

Tests use Vitest with React Testing Library. Example:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { myFunction } from '../myModule';

describe('myFunction', () => {
    it('should do something', () => {
        const result = myFunction(input);
        expect(result).toBe(expected);
    });
});
```

## Mocks

- `localStorage` is mocked in `src/test/setup.ts`
- `import.meta.env` is mocked for consistent test environment
