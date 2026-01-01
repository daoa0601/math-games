# ADR-0001: Path Aliases

## Status

Accepted

## Date

2026-01-01

## Context

The project uses relative imports like `../../shared/components` which are:
- Difficult to read and maintain
- Error-prone when moving files
- Inconsistent across the codebase

As the project grows with more games and shared components, relative imports become increasingly unwieldy.

## Decision

Configure path aliases using TypeScript `paths` and Vite `resolve.alias`:

```typescript
// tsconfig.app.json
"paths": {
  "@/*": ["./src/*"],
  "@/shared/*": ["./src/shared/*"],
  "@/games/*": ["./src/games/*"],
  "@/i18n/*": ["./src/i18n/*"],
  "@/pages/*": ["./src/pages/*"]
}
```

```typescript
// vite.config.ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
    '@/shared': path.resolve(__dirname, './src/shared'),
    // ... etc
  },
}
```

## Consequences

### Positive

- **Cleaner imports**: `@/shared/components` instead of `../../shared/components`
- **Refactor-safe**: Moving files doesn't break import paths
- **IDE support**: TypeScript paths enable autocomplete for aliased imports
- **Consistent pattern**: All imports from src use `@/` prefix

### Negative

- **Configuration overhead**: Must maintain aliases in both tsconfig and vite config
- **Learning curve**: New developers need to understand the alias pattern

### Neutral

- Existing relative imports still work during gradual migration

## Implementation

Files modified:
- `tsconfig.app.json` - Added baseUrl and paths
- `vite.config.ts` - Added resolve.alias

Migration strategy: Gradual adoption. New code uses aliases, existing code migrated as touched.
