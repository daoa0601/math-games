# ADR-0002: Use Zod for Runtime Type Validation in TypedStorage

## Status

**Accepted** - December 2024

## Context

The Math Gymnasium application stores player data in `localStorage`, including:
- Player profile (name, stats, rank)
- Achievement progress
- Best times per game
- User preferences (sound, language)

### Problem

`localStorage` only stores strings. When reading data:
1. JSON.parse returns `unknown` or `any`
2. TypeScript types are erased at runtime
3. Corrupted or malformed data causes runtime errors
4. Schema changes between versions cause silent failures

### Example Failure Scenario

```typescript
// Version 1: streak is a number
interface PlayerProfile {
  streak: number;
}

// Version 2: streak becomes an object
interface PlayerProfile {
  streak: { current: number; best: number };
}

// Old data in localStorage causes:
profile.streak.current // TypeError: Cannot read property 'current' of number
```

### Requirements

1. **Runtime validation**: Catch invalid data before it causes errors
2. **Type safety**: Inferred types match validated structure
3. **Graceful degradation**: Return defaults for invalid data
4. **Migration support**: Transform old data to new schema
5. **Developer experience**: Catch schema violations during development

## Decision

Use **Zod** as the runtime validation library wrapped in a **TypedStorage** class.

### Why Zod?

| Criteria | Zod | io-ts | Yup | ajv |
|----------|-----|-------|-----|-----|
| TypeScript-first | Yes | Yes | No | No |
| Runtime validation | Yes | Yes | Yes | Yes |
| Bundle size | ~12 KB | ~15 KB | ~40 KB | ~100 KB |
| Learning curve | Low | High | Medium | Medium |
| Type inference | Excellent | Good | Manual | Manual |

Zod was chosen for:
- **Zero-config TypeScript integration**: Types are inferred from schemas
- **Small bundle size**: ~12 KB gzipped
- **Familiar API**: Similar to PropTypes/Yup but type-safe
- **Active maintenance**: Regular updates, large community

### Implementation

```typescript
// Schema definition
const PlayerProfileSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  stats: PlayerStatsSchema,
  rank: PlayerRankSchema,
  streak: z.number().int().nonnegative(),
  achievements: z.array(z.string()),
  preferences: PlayerPreferencesSchema,
  version: z.number().int(),
});

// Type is inferred automatically
type PlayerProfile = z.infer<typeof PlayerProfileSchema>;

// TypedStorage usage
const storage = new TypedStorage(
  'player-profile',
  PlayerProfileSchema,
  createDefaultProfile()
);

const profile = storage.get(); // Always returns valid PlayerProfile
storage.set({ ...profile, streak: 5 }); // Validates before storing
```

### TypedStorage Features

1. **Read validation**: Returns default if stored data fails validation
2. **Write validation**: Throws if attempting to store invalid data
3. **Migration hooks**: `onMigration` callback for version upgrades
4. **Error callbacks**: `onValidationError` for logging/analytics
5. **Update helper**: Atomic read-modify-write operations

```typescript
const storage = new TypedStorage(
  'player-profile',
  PlayerProfileSchema,
  createDefaultProfile(),
  {
    version: 2,
    migrate: (rawData, fromVersion) => {
      if (fromVersion === 1) {
        // Transform v1 data to v2 format
        return migrateV1ToV2(rawData);
      }
      return rawData as PlayerProfile;
    },
    onValidationError: (error, rawData) => {
      analytics.track('storage_validation_failed', { error });
    },
  }
);
```

## Consequences

### Positive

1. **Runtime safety**: Invalid data is caught before causing UI errors
2. **Developer confidence**: Schema violations throw during development
3. **Type inference**: No manual type synchronization required
4. **Migration path**: Structured way to evolve data schema
5. **Debugging**: Clear error messages identify validation failures

### Negative

1. **Bundle size**: Adds ~12 KB to the core bundle
2. **Runtime overhead**: Validation runs on every read/write
3. **Schema duplication**: Some overlap with TypeScript interfaces
4. **Learning curve**: Team must learn Zod API

### Mitigations

- Bundle size is acceptable given the safety benefits
- Validation overhead is negligible for localStorage operations
- Schema is the source of truth; interfaces are inferred
- Zod's API is intuitive and well-documented

## Alternatives Considered

### 1. Manual JSON validation

```typescript
function validateProfile(data: unknown): PlayerProfile | null {
  if (typeof data !== 'object' || data === null) return null;
  if (typeof data.displayName !== 'string') return null;
  // ... 50 more lines
}
```

**Rejected**: Verbose, error-prone, no type inference.

### 2. TypeScript type guards

```typescript
function isPlayerProfile(data: unknown): data is PlayerProfile {
  return /* complex checks */;
}
```

**Rejected**: Requires manual maintenance, no descriptive errors.

### 3. io-ts

**Rejected**: Steeper learning curve with functional programming concepts (Either, fold). Zod provides similar benefits with simpler API.

### 4. No validation (trust localStorage)

**Rejected**: Unacceptable risk of runtime errors from corrupted data.

## References

- [Zod Documentation](https://zod.dev/)
- [TypedStorage implementation](/src/shared/utils/TypedStorage.ts)
- [Player Profile Schema](/src/shared/schemas/playerProfile.schema.ts)
