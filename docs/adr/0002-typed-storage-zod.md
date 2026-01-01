# ADR-0002: TypedStorage with Zod Validation

## Status

Accepted

## Date

2026-01-01

## Context

The application stores player data and game progress in localStorage. The existing approach uses raw `JSON.parse()` which:

1. Returns `any` type, losing TypeScript safety
2. Can crash on corrupted data
3. Has no schema validation
4. Makes migration between versions error-prone

Example of unsafe pattern:

```typescript
// Current: No validation, can crash
const profile = JSON.parse(localStorage.getItem('player'));
profile.stats.totalGamesPlayed++; // TypeError if stats is undefined
```

## Decision

Add Zod for runtime schema validation and create a `TypedStorage<T>` class that:

1. Validates data on read using Zod schemas
2. Returns default values for invalid data (graceful degradation)
3. Validates on write to catch developer errors
4. Supports version-based migrations

### Schemas

Define schemas in `src/shared/utils/schemas.ts`:

```typescript
export const PlayerProfileSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  stats: PlayerStatsSchema,
  rank: PlayerRankSchema,
  // ...
});
```

### TypedStorage Class

```typescript
const profileStorage = new TypedStorage(
  'player-profile',
  PlayerProfileSchema,
  createDefaultProfile(),
  {
    version: 2,
    migrate: (old, fromVersion) => migrateProfile(old, fromVersion),
  }
);

// Always returns valid PlayerProfile
const profile = profileStorage.get();
```

## Alternatives Considered

### 1. io-ts

**Pros**: Functional approach, bidirectional types
**Cons**: Steeper learning curve, more verbose

### 2. Superstruct

**Pros**: Similar API to Zod, slightly smaller
**Cons**: Less ecosystem support, fewer integrations

### 3. Manual validation

**Pros**: No dependency
**Cons**: Tedious, error-prone, no type inference

### Decision: Zod

Chosen for:
- Excellent TypeScript integration (infers types from schemas)
- Clean, readable API
- Wide ecosystem adoption
- Good error messages
- ~12KB gzipped (acceptable)

## Consequences

### Positive

- **Type safety at runtime**: Invalid data returns defaults instead of crashing
- **Self-documenting**: Schemas serve as documentation
- **Migration support**: Version-based migrations with clear upgrade path
- **Developer errors caught**: Invalid writes throw immediately
- **Type inference**: `z.infer<typeof Schema>` eliminates duplicate type definitions

### Negative

- **Bundle size increase**: ~12KB gzipped for Zod
- **Parse overhead**: Validation on every read (negligible for localStorage)

### Neutral

- Existing code continues to work; TypedStorage is opt-in
- Gradual migration: services can adopt TypedStorage incrementally

## Implementation

Files created:
- `src/shared/utils/schemas.ts` - Zod schemas for all stored data
- `src/shared/utils/TypedStorage.ts` - TypedStorage class

Files to update (future):
- `src/shared/services/player.ts` - Use TypedStorage for player profile
- `src/shared/utils/storage.ts` - Use TypedStorage for game progress

## Usage Example

```typescript
import { TypedStorage, PlayerProfileSchema } from '@/shared/utils';

const storage = new TypedStorage(
  'player-profile',
  PlayerProfileSchema,
  createDefaultProfile()
);

// Read (validates, returns default on failure)
const profile = storage.get();

// Write (validates, throws on invalid)
storage.set({ ...profile, streak: 5 });

// Update with transform
storage.update(p => ({ ...p, streak: p.streak + 1 }));
```
