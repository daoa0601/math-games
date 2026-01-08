# ADR 0002: TypedStorage with Zod Validation

## Status
Accepted

## Date
2024-12-01

## Context

The Math Gymnasium application stores player profiles, game progress, daily challenge data, and preferences in localStorage. This data persists across sessions and is critical for the user experience.

**Problems with raw localStorage:**
1. **No type safety**: `JSON.parse()` returns `any`, requiring manual type assertions
2. **No validation**: Corrupted or manually-edited data crashes the app
3. **No migration path**: Schema changes break existing user data
4. **Silent failures**: Invalid data causes subtle bugs rather than clear errors

**Requirements:**
- Guarantee valid data shapes at runtime
- Gracefully handle corrupted or outdated data
- Support schema evolution without data loss
- Provide clear error messages for debugging

## Decision

Implement a `TypedStorage<T>` class wrapper around localStorage that uses Zod schemas for runtime validation.

**Key features:**
- **Constructor**: Takes storage key, Zod schema, and default value
- **get()**: Validates stored data, returns default if invalid
- **set()**: Validates before storing, throws on invalid data (developer error)
- **update()**: Atomic read-modify-write pattern
- **Migration**: Optional version-based migration with custom transform function

**Example usage:**
```typescript
import { z } from 'zod';
import { TypedStorage } from '@/shared/utils';

const ProfileSchema = z.object({
  name: z.string(),
  totalGamesPlayed: z.number().int().min(0),
  streak: z.number().int().min(0),
  version: z.number().optional(),
});

const profileStorage = new TypedStorage(
  'player-profile',
  ProfileSchema,
  { name: 'Player', totalGamesPlayed: 0, streak: 0 }
);

// Always returns valid data (or default)
const profile = profileStorage.get();

// Validates before storing - throws if invalid
profileStorage.set({ ...profile, streak: 5 });
```

## Alternatives Considered

### 1. Manual try-catch with type guards
- **Pro**: No dependency on Zod
- **Con**: Verbose, error-prone, duplicates validation logic

### 2. io-ts or Yup
- **Pro**: Similar validation capabilities
- **Con**: Zod already used elsewhere, better TypeScript inference

### 3. IndexedDB with schema
- **Pro**: Better for large datasets
- **Con**: Overkill for simple key-value storage, more complex API

## Consequences

### Positive
- **Type safety**: Compile-time types + runtime validation
- **Resilience**: App never crashes from bad localStorage data
- **Migration**: Schema evolution handled gracefully
- **DX**: Clear error messages point to exact validation failures
- **Testability**: Schemas are unit-testable

### Negative
- **Bundle size**: Zod adds ~12KB gzipped (acceptable for this app)
- **Learning curve**: Developers must understand Zod schema syntax
- **Boilerplate**: Each storage key needs schema definition

### Neutral
- Validation errors log to console (helpful for debugging, visible in prod)
- Invalid data silently resets to default (safe but may surprise users)

## Implementation

**Files created:**
- `src/shared/utils/TypedStorage.ts` - Main class implementation
- `src/shared/schemas/playerProfile.schema.ts` - Player profile schema
- `src/shared/schemas/daily.schema.ts` - Daily challenge schema
- `src/shared/schemas/storage.schema.ts` - Generic storage schemas

**Usage locations:**
- `src/shared/services/player.ts` - Player profile storage
- `src/shared/services/daily.ts` - Daily challenge tracking
- `src/shared/services/tutorialProgress.ts` - Tutorial completion state

## References

- [Zod Documentation](https://zod.dev/)
- [TypedStorage Implementation](../src/shared/utils/TypedStorage.ts)
