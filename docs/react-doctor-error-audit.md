# React Doctor Error Audit: math-games

Generated from React Doctor `0.2.11` full scan. This file tracks **error-level** diagnostics only; warnings are intentionally out of scope for this pass.

## Summary

- Report: `/tmp/react-doctor-math-games.json`
- Total diagnostics: `199`
- Errors: `0`
- Warnings: `199`
- Affected files: `54`
- Error rule families: `react-doctor/only-export-components`

Resolved by the follow-up scan on `2026-05-29`: `0` error-level diagnostics remain.

## Error diagnostics

### `src/routes/__root.tsx`

- [x] `57:10` `react-doctor/only-export-components` — Fast refresh requires components to be exported. Move local component(s) to a separate file.
  - Fix guidance: Move non-component exports out of files that export components.
- [x] `130:10` `react-doctor/only-export-components` — Fast refresh requires components to be exported. Move local component(s) to a separate file.
  - Fix guidance: Move non-component exports out of files that export components.
- [x] `165:10` `react-doctor/only-export-components` — Fast refresh requires components to be exported. Move local component(s) to a separate file.
  - Fix guidance: Move non-component exports out of files that export components.

### `src/routes/achievements.tsx`

- [x] `35:10` `react-doctor/only-export-components` — Fast refresh requires components to be exported. Move local component(s) to a separate file.
  - Fix guidance: Move non-component exports out of files that export components.

### `src/routes/admin/analytics.tsx`

- [x] `41:10` `react-doctor/only-export-components` — Fast refresh requires components to be exported. Move local component(s) to a separate file.
  - Fix guidance: Move non-component exports out of files that export components.

### `src/routes/classroom.tsx`

- [x] `36:10` `react-doctor/only-export-components` — Fast refresh requires components to be exported. Move local component(s) to a separate file.
  - Fix guidance: Move non-component exports out of files that export components.
- [x] `223:10` `react-doctor/only-export-components` — Fast refresh requires components to be exported. Move local component(s) to a separate file.
  - Fix guidance: Move non-component exports out of files that export components.

### `src/routes/daily.tsx`

- [x] `48:10` `react-doctor/only-export-components` — Fast refresh requires components to be exported. Move local component(s) to a separate file.
  - Fix guidance: Move non-component exports out of files that export components.

### `src/routes/dev/design-canvas.tsx`

- [x] `136:10` `react-doctor/only-export-components` — Fast refresh requires components to be exported. Move local component(s) to a separate file.
  - Fix guidance: Move non-component exports out of files that export components.
- [x] `335:10` `react-doctor/only-export-components` — Fast refresh requires components to be exported. Move local component(s) to a separate file.
  - Fix guidance: Move non-component exports out of files that export components.
- [x] `364:10` `react-doctor/only-export-components` — Fast refresh requires components to be exported. Move local component(s) to a separate file.
  - Fix guidance: Move non-component exports out of files that export components.
- [x] `419:10` `react-doctor/only-export-components` — Fast refresh requires components to be exported. Move local component(s) to a separate file.
  - Fix guidance: Move non-component exports out of files that export components.

### `src/routes/games/equation-balance.tsx`

- [x] `47:10` `react-doctor/only-export-components` — Fast refresh requires components to be exported. Move local component(s) to a separate file.
  - Fix guidance: Move non-component exports out of files that export components.

### `src/routes/games/fraction-builder.tsx`

- [x] `43:10` `react-doctor/only-export-components` — Fast refresh requires components to be exported. Move local component(s) to a separate file.
  - Fix guidance: Move non-component exports out of files that export components.
- [x] `646:10` `react-doctor/only-export-components` — Fast refresh requires components to be exported. Move local component(s) to a separate file.
  - Fix guidance: Move non-component exports out of files that export components.
- [x] `681:10` `react-doctor/only-export-components` — Fast refresh requires components to be exported. Move local component(s) to a separate file.
  - Fix guidance: Move non-component exports out of files that export components.

### `src/routes/games/magic-graph.tsx`

- [x] `62:10` `react-doctor/only-export-components` — Fast refresh requires components to be exported. Move local component(s) to a separate file.
  - Fix guidance: Move non-component exports out of files that export components.

### `src/routes/games/pattern-detective.tsx`

- [x] `42:10` `react-doctor/only-export-components` — Fast refresh requires components to be exported. Move local component(s) to a separate file.
  - Fix guidance: Move non-component exports out of files that export components.
- [x] `159:10` `react-doctor/only-export-components` — Fast refresh requires components to be exported. Move local component(s) to a separate file.
  - Fix guidance: Move non-component exports out of files that export components.
- [x] `224:10` `react-doctor/only-export-components` — Fast refresh requires components to be exported. Move local component(s) to a separate file.
  - Fix guidance: Move non-component exports out of files that export components.

### `src/routes/games/sequence-race.tsx`

- [x] `65:10` `react-doctor/only-export-components` — Fast refresh requires components to be exported. Move local component(s) to a separate file.
  - Fix guidance: Move non-component exports out of files that export components.

### `src/routes/games/shape-architect.tsx`

- [x] `88:10` `react-doctor/only-export-components` — Fast refresh requires components to be exported. Move local component(s) to a separate file.
  - Fix guidance: Move non-component exports out of files that export components.

### `src/routes/profile.tsx`

- [x] `83:10` `react-doctor/only-export-components` — Fast refresh requires components to be exported. Move local component(s) to a separate file.
  - Fix guidance: Move non-component exports out of files that export components.

### `src/ui/badge.tsx`

- [x] `49:17` `react-doctor/only-export-components` — Fast refresh only works when a file only exports components. Move non-component exports to a separate file.
  - Fix guidance: Move non-component exports out of files that export components.

### `src/ui/button.tsx`

- [x] `59:18` `react-doctor/only-export-components` — Fast refresh only works when a file only exports components. Move non-component exports to a separate file.
  - Fix guidance: Move non-component exports out of files that export components.

### `src/ui/toggle.tsx`

- [x] `46:18` `react-doctor/only-export-components` — Fast refresh only works when a file only exports components. Move non-component exports to a separate file.
  - Fix guidance: Move non-component exports out of files that export components.

## Resolution workflow

1. Fix each checkbox above with the smallest safe component-boundary change.
2. Prefer extracting local helper components from route files into sibling component modules when the route file mixes TanStack route exports with React component declarations.
3. Re-run React Doctor with `--full --fail-on none --json --no-score` and update this audit until no error-level diagnostics remain.
4. Run the repo's typecheck/test command before marking the audit complete.
