# Dependency Audit Report

**Date**: 2026-01-08
**Node**: v20+
**Total dependencies**: 568 packages (1,184 including transitive)

## Executive Summary

| Category | Status |
|----------|--------|
| Security vulnerabilities | ✅ None found |
| Outdated packages | ✅ Minor updates only |
| Bundle optimization | ✅ Well-optimized |
| node_modules bloat | ⚠️ Addressable |

---

## 1. Security Audit

```
npm audit: found 0 vulnerabilities
```

**Result**: No known security vulnerabilities in the dependency tree.

---

## 2. Outdated Packages

### Minor/Patch Updates Available

| Package | Current | Latest | Risk |
|---------|---------|--------|------|
| `@types/node` | 24.10.4 | 25.0.3 | Low (types only) |
| `globals` | 16.5.0 | 17.0.0 | Low (eslint helper) |

### Recommendation

Both are safe to update. Run:
```bash
npm update @types/node globals
```

The `globals` major bump (16→17) only affects ESLint config and is backwards-compatible.

---

## 3. Bundle Size Analysis

### Production Chunks (brotli compressed)

| Chunk | Size | Notes |
|-------|------|-------|
| `three-vendor` | 287KB | Expected for 3D |
| `firebase-vendor` | 128KB | Lazy-loaded |
| `react-vendor` | 15KB | Core framework |
| `i18n-vendor` | 16KB | Translation libs |
| Main app chunks | ~110KB | Split per game |

### Assessment

Bundle splitting is **well-optimized**:
- Firebase dynamically loaded via `loader.ts`
- Three.js minified via `@yushijinhun/three-minifier-rollup`
- Games lazy-loaded with React.lazy
- Compression enabled (gzip + brotli)

---

## 4. node_modules Bloat Analysis

### Largest Folders

| Package | Size | Source |
|---------|------|--------|
| `@firebase/` | 70MB | Direct dependency |
| `three/` | 36MB | Direct dependency |
| `firebase/` | 34MB | Direct dependency |
| `three-stdlib/` | 27MB | @react-three/drei |
| `stats-gl/` | 27MB | @react-three/drei |
| `hls.js/` | 24MB | @react-three/drei |
| `@mediapipe/` | 20MB | @react-three/drei |

### @react-three/drei Bloat

The `@react-three/drei` package pulls in heavy optional dependencies:

| Transitive Dep | Size | Used? |
|----------------|------|-------|
| `hls.js` | 24MB | ❌ Video streaming |
| `@mediapipe/tasks-vision` | 20MB | ❌ AR/ML features |
| `stats-gl` | 27MB | ❌ Debug stats |
| `three-stdlib` | 27MB | Partially (utilities) |

**Actual drei imports used**:
- `Text`, `Line` (GridFloor)
- `OrbitControls`, `PerspectiveCamera`, `Environment`

These unused dependencies don't affect bundle size (tree-shaken) but bloat CI/CD and local installs.

---

## 5. Deprecation Warnings

| Package | Warning | Source |
|---------|---------|--------|
| `sourcemap-codec` | Deprecated | `@yushijinhun/three-minifier-rollup` |

The three-minifier uses an older `magic-string` version with deprecated `sourcemap-codec`. Not a security issue, but watch for updates.

---

## 6. Recommendations

### High Priority

None - the project is in good shape.

### Medium Priority

**1. Update minor dependencies**
```bash
npm update @types/node globals
```

**2. Consider lighter drei alternative**

For the limited drei features used, consider importing directly from three.js to avoid transitive bloat:

```typescript
// Instead of @react-three/drei for simple components:
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
```

However, this requires manual setup and loses drei's React bindings. **Only worth pursuing if CI times are problematic.**

### Low Priority

**3. Monitor three-minifier updates**

The `@yushijinhun/three-minifier-rollup` package hasn't been updated recently. Watch for:
- Updated `magic-string` without deprecated deps
- Alternative: Vite 5+ has improved tree-shaking for three.js

**4. Firebase SDK alternatives**

If bundle size becomes critical, consider:
- `firebase-admin` for SSR (not applicable here)
- Individual Firebase packages instead of unified SDK (already optimized via dynamic imports)

---

## 7. Unused Dependencies Check

All direct dependencies are actively used:

| Package | Used In |
|---------|---------|
| `@dnd-kit/*` | ShapeArchitect drag-drop |
| `@react-three/*` | ShapeArchitect 3D |
| `xstate` | Game state machines |
| `canvas-confetti` | RankUpOverlay, confetti.ts |
| `firebase` | Auth + Firestore sync |
| `i18next` | Internationalization |
| `zod` | Runtime validation |

No unnecessary direct dependencies found.

---

## 8. Server Dependencies

The `/server` subdirectory has minimal dependencies:

| Package | Version | Purpose |
|---------|---------|---------|
| `better-sqlite3` | ^11.0.0 | SQLite database |
| `cors` | ^2.8.5 | CORS middleware |
| `express` | ^4.21.0 | Web framework |

**Note**: Express 4.21 is current. Express 5 is in beta but not recommended for production yet.

---

## Conclusion

This project follows dependency best practices:
- ✅ No security vulnerabilities
- ✅ Effective code splitting
- ✅ Dynamic imports for heavy deps
- ✅ Build-time optimization plugins
- ✅ No unused direct dependencies

The main area for potential improvement is the transitive dependency bloat from `@react-three/drei`, which affects install times but not runtime performance.
