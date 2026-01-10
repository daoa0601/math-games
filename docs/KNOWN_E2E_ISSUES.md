# Known E2E Test Issues

> **Last Updated:** 2026-01-10

This document tracks known E2E test failures that are pre-existing issues, not caused by recent changes.

## Summary

| Spec File | Failing Tests | Root Cause | Status |
|-----------|---------------|------------|--------|
| `dashboard.spec.ts` | 2 | Panel ID inconsistency | ⚠️ Open |
| `progression.spec.ts` | 6 | i18n + streak logic mismatch | ⚠️ Open |
| `daily-challenge.spec.ts` | 3 | CSS class + keyboard nav | ⚠️ Open |
| `magic-graph.spec.ts` | 4 | Mobile Chrome UI overlap | ⚠️ Open |

---

## dashboard.spec.ts

### `should switch tabs when clicked` (Mobile Chrome & Safari)

**Error:** Test looks for `#panel-learn` but actual element ID is inconsistent across tabs.

**Current State:**
- LearnTab: `id="panel-learn"` (inconsistent)
- AchievementsTab: `id="tabpanel-achievements"`
- DashboardTabs uses: `aria-controls="tabpanel-${tab.id}"`

**Fix Options:**
1. Standardize all panel IDs to `panel-{tabId}` format
2. Update tests to match actual IDs

---

## progression.spec.ts

### i18n Mismatch
**Error:** Tests expect English (`"Intermediate"`) but app uses Vietnamese (`"Trung cấp"`).

**Fix:** Set locale to English in test setup or use regex matching.

### Streak Logic
**Error:** Streak starts at 1 on first visit (not 0).

**Root Cause:** `updateStreak()` is called on first load, which correctly sets streak to 1.

**Fix:** Update test expectations to match actual (correct) app behavior.

---

## daily-challenge.spec.ts

### Completion State Not Loading
**Error:** `.daily-challenge-banner__dot--completed` not found.

**Investigation Needed:** Verify the actual CSS class name in `DailyChallengeBanner.tsx`.

### Mobile Safari Keyboard Navigation
**Error:** Tab key navigation fails on mobile.

**Fix:** Skip test on mobile browsers:
```typescript
test.skip(({ browserName }) => browserName === 'webkit', 'Mobile Safari keyboard nav differs');
```

---

## magic-graph.spec.ts

### Mobile Chrome Click Interception

**Affected Tests:** Node interactions on Mobile Chrome viewport.

**Error:** "?" help button intercepts pointer events.

**Fix Options:**
1. Adjust game layout CSS to prevent overlap
2. Dismiss help button before interactions in tests
3. Scroll/reposition before clicking

---

## Running Tests

```bash
# Run specific spec
npx playwright test e2e/dashboard.spec.ts

# Debug with UI
npx playwright test e2e/dashboard.spec.ts --ui

# Single test by line
npx playwright test e2e/dashboard.spec.ts:176
```

---

## Priority

| Priority | Issue | Effort |
|----------|-------|--------|
| High | Panel ID standardization | Low |
| High | MagicGraph Mobile overlap | Medium |
| Medium | i18n in progression tests | Low |
| Medium | Streak test expectations | Low |
| Low | Daily challenge CSS class | Medium |
| Low | Mobile keyboard nav | Low (skip) |
