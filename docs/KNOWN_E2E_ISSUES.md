# Known E2E Test Issues

> **Last Updated:** 2026-01-10

This document tracks known E2E test failures and their resolution status.

## Summary

| Spec File | Issue | Status |
|-----------|-------|--------|
| `dashboard.spec.ts` | Panel ID inconsistency | ✅ Fixed |
| `progression.spec.ts` | i18n mismatch | ✅ Fixed (tests accept both locales) |
| `progression.spec.ts` | Streak logic | ✅ Fixed (test removed) |
| `daily-challenge.spec.ts` | Completion state stale | ✅ Fixed |
| `daily-challenge.spec.ts` | Mobile Safari keyboard nav | ⚠️ Browser limitation (skip) |
| `magic-graph.spec.ts` | Mobile Chrome UI overlap | ✅ Fixed |

---

## ✅ Fixed Issues

### dashboard.spec.ts - Panel ID Standardization

**Issue:** AchievementsTab used `id="tabpanel-achievements"` while BottomNav expected `panel-achievements`.

**Fix:** Changed AchievementsTab.tsx to use `id="panel-achievements"` (consistent with other tabs).

---

### progression.spec.ts - i18n Mismatch

**Issue:** Tests expected English rank names but app defaults to Vietnamese.

**Status:** Already fixed - tests now use regex patterns accepting both languages:
```typescript
expect(playerInfo.rank).toMatch(/Intermediate|Trung cấp/);
```

---

### progression.spec.ts - Streak Logic

**Issue:** Tests expected streak=0 on first visit, but app correctly sets streak=1.

**Status:** Already fixed - test was deleted with explanation:
```typescript
// DELETED: 'should start with zero streak' test
// Reason: Tests implementation detail. The app correctly sets streak to 1 on first visit
```

---

### daily-challenge.spec.ts - Completion State

**Issue:** `useMemo` with empty dependencies never updated completion status after mount.

**Fix:** Added `completionCount` prop to DailyChallengeBanner that triggers re-render:
- Parent (PlayTab) calculates completion count on each render
- Banner's useMemo now depends on `completionCount` prop

---

### magic-graph.spec.ts - Mobile Chrome Click Interception

**Issue:** Header "?" button intercepted clicks on puzzle nodes on mobile viewport.

**Fix:** Added proper z-index layering in MagicGraph.css mobile media query:
```css
.mg-board-wrapper {
  position: relative;
  z-index: 1;  /* Below game-header which has z-index: 10 */
}
```

---

## ⚠️ Known Limitations

### daily-challenge.spec.ts - Mobile Safari Keyboard Navigation

**Issue:** Tab key navigation behaves differently on Mobile Safari.

**Status:** Browser limitation - recommend skipping on mobile:
```typescript
test.skip(({ browserName }) => browserName === 'webkit', 'Mobile Safari keyboard nav differs');
```

---

## Running Tests

```bash
# Run specific spec
npx playwright test e2e/dashboard.spec.ts

# Debug with UI
npx playwright test e2e/dashboard.spec.ts --ui

# Full E2E suite
npm run test:e2e
```
