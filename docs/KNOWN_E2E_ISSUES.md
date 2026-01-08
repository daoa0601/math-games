# Known E2E Test Issues

> Last updated: 2025-01-07

This document tracks known E2E test failures that are pre-existing issues, not caused by recent changes. These should be addressed in future maintenance work.

## Summary

| Spec File | Failing Tests | Root Cause |
|-----------|---------------|------------|
| `dashboard.spec.ts` | 2 | Wrong panel ID selector |
| `progression.spec.ts` | 6 | i18n + streak logic mismatch |
| `daily-challenge.spec.ts` | 3 | CSS class + keyboard nav issues |
| `magic-graph.spec.ts` | 4 | Mobile Chrome UI overlap |

---

## dashboard.spec.ts

### `should switch tabs when clicked` (Mobile Chrome & Safari)

**Error:**
```
Error: expect(locator).toBeVisible() failed
Locator: locator('#panel-learn')
Expected: visible
```

**Root Cause:** Test looks for `#panel-learn` but the actual element ID is `#tabpanel-learn`.

**Location:** `e2e/dashboard.spec.ts:185`

**Fix:** Update the test selector:
```typescript
// Before
await expect(page.locator('#panel-learn')).toBeVisible();

// After
await expect(page.locator('#tabpanel-learn')).toBeVisible();
```

**Related:** Panel IDs are inconsistent across tabs:
- PlayTab: `id="panel-home"`
- StatsTab: `id="tabpanel-stats"`
- LearnTab: `id="tabpanel-learn"`
- AchievementsTab: `id="tabpanel-achievements"`

Consider standardizing all to `panel-{tabId}` or `tabpanel-{tabId}`.

---

## progression.spec.ts

### `should display intermediate rank with correct stats` (Mobile Chrome & Safari)

**Error:**
```
Expected substring: "Intermediate"
Received string:    "Trung cấp"
```

**Root Cause:** Test expects English rank name but app defaults to Vietnamese.

**Location:** `e2e/progression.spec.ts:163`

**Fix Options:**
1. Set locale to English in test setup
2. Use translation key comparison instead of hardcoded string
3. Accept either language: `expect(playerInfo.rank).toMatch(/Intermediate|Trung cấp/)`

---

### `should start with zero streak` (Mobile Chrome & Safari)

**Error:**
```
Expected: 0
Received: 1
```

**Root Cause:** When the app first loads, `updateStreak()` is called which sets streak to 1 (first play). The test expects a fresh profile to have streak 0, but the app immediately starts tracking.

**Location:** `e2e/progression.spec.ts:404`

**Fix:** Either:
1. Update test expectation to match actual behavior (streak starts at 1 on first visit)
2. Check streak before any navigation/interaction triggers `updateStreak()`

---

### `should increment streak on consecutive days` (Mobile Chrome & Safari)

**Error:**
```
Expected: 5
Received: 1
```

**Root Cause:** Test simulates consecutive days by manipulating `lastPlayedDate` in localStorage, but the app's streak logic may be resetting due to how dates are compared or when `updateStreak()` is called.

**Location:** `e2e/progression.spec.ts:422`

**Investigation Needed:** Review how the test manipulates dates and whether the streak update logic is being triggered correctly after localStorage changes.

---

## daily-challenge.spec.ts

### `should load completion state from localStorage on page load` (Mobile Chrome & Safari)

**Error:**
```
Locator: locator('.daily-challenge-banner__dot--completed')
Expected: visible
Error: element(s) not found
```

**Root Cause:** Test pre-populates localStorage with completion data, but the UI doesn't reflect the completed state. Possible issues:
1. CSS class name mismatch (actual class may differ)
2. Component doesn't read from localStorage on initial render
3. Date mismatch between test data and `getTodaySeed()`

**Location:** `e2e/daily-challenge.spec.ts:476`

**Investigation:** Check the actual CSS class used for completed dots in `DailyChallengeBanner.tsx`.

---

### `should be keyboard navigable` (Mobile Safari only)

**Error:**
```
Expected: true
Received: false
```

**Root Cause:** Keyboard navigation (Tab key) doesn't move focus to challenge dots on Mobile Safari. This is a known limitation of mobile browsers with virtual keyboards.

**Location:** `e2e/daily-challenge.spec.ts:608`

**Fix:** Skip this test on mobile browsers or adjust the keyboard navigation test approach for touch devices.

```typescript
test.skip(({ browserName }) => browserName === 'webkit', 'Mobile Safari keyboard nav differs');
```

---

## magic-graph.spec.ts

### Gameplay Interaction Tests (Mobile Chrome only)

**Affected Tests:**
- `should allow clicking a node to open number picker`
- `should close number picker when clicking close button`
- `should close number picker when pressing Escape`
- `should enable undo after placing a number`

**Error:**
```
TimeoutError: locator.click: Timeout 8000ms exceeded.
<button aria-label="How to play" class="action action--ghost learn-button">?</button>
from <header class="game-header">...</header> subtree intercepts pointer events
```

**Root Cause:** On Mobile Chrome viewport, the "?" (How to play) button in the header overlaps with the graph nodes, intercepting click events.

**Location:** `e2e/magic-graph.spec.ts:82-157`

**Fix Options:**
1. Adjust the game layout CSS to prevent overlap on small viewports
2. Close/dismiss the learn button before interacting with nodes in tests
3. Use `{ force: true }` click option (not recommended - masks real issues)
4. Scroll or reposition before clicking

**Note:** These tests pass on Mobile Safari, indicating a Chrome-specific rendering or viewport issue.

---

## Running Tests

Due to system resource constraints, run E2E tests individually:

```bash
# Run specific spec file
npx playwright test e2e/dashboard.spec.ts
npx playwright test e2e/magic-graph.spec.ts
npx playwright test e2e/progression.spec.ts
npx playwright test e2e/daily-challenge.spec.ts

# Run with UI for debugging
npx playwright test e2e/dashboard.spec.ts --ui

# Run single test by line number
npx playwright test e2e/dashboard.spec.ts:176
```

---

## Priority for Fixes

| Priority | Issue | Effort |
|----------|-------|--------|
| High | Panel ID inconsistency | Low - simple rename |
| High | MagicGraph Mobile Chrome overlap | Medium - CSS/layout fix |
| Medium | i18n in progression tests | Low - use locale or regex |
| Medium | Streak logic expectations | Medium - review app behavior |
| Low | Daily challenge completion state | Medium - investigate localStorage |
| Low | Mobile Safari keyboard nav | Low - skip test on mobile |
