# Dark Mode & SkipLinks Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix dark mode game card contrast and hide skip links until keyboard focus.

**Architecture:** CSS-only fixes. Add dark mode override for `.game-card` backgrounds, remove duplicate `SkipLinks.css` to let `a11y.css` styles take effect.

**Tech Stack:** CSS, React (minor import removal)

---

## Task 1: Add Dark Mode Styles for Game Cards

**Files:**
- Modify: `src/index.css` (after line 187, near end of `.game-card` section)

**Step 1: Add dark mode override for game cards**

Add this CSS after the existing `.game-card:active` rule (around line 187):

```css
/* Dark mode game card */
[data-theme="dark"] .game-card {
  background: linear-gradient(135deg, var(--surface-card) 0%, var(--surface-elevated) 100%);
  border-color: var(--border-color);
  box-shadow: 0 4px 12px hsla(0, 0%, 0%, 0.3);
}

[data-theme="dark"] .game-card::before {
  background: linear-gradient(135deg, hsla(12, 70%, 58%, 0.5), hsla(174, 50%, 45%, 0.5));
}

[data-theme="dark"] .game-card:hover {
  box-shadow: 0 8px 24px hsla(0, 0%, 0%, 0.4);
}
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: Build completes without errors

**Step 3: Commit**

```bash
git add src/index.css
git commit -m "fix(theme): add dark mode styles for game cards"
```

---

## Task 2: Remove Duplicate SkipLinks CSS

**Files:**
- Delete: `src/shared/components/SkipLinks.css`
- Modify: `src/shared/components/SkipLinks.tsx` (line 2)

**Step 1: Remove CSS import from SkipLinks component**

In `src/shared/components/SkipLinks.tsx`, remove line 2:

```diff
 import { useTranslation } from 'react-i18next';
-import './SkipLinks.css';
```

**Step 2: Delete the duplicate CSS file**

Run: `rm "src/shared/components/SkipLinks.css"`

**Step 3: Verify build passes**

Run: `npm run build`
Expected: Build completes without errors

**Step 4: Commit**

```bash
git add -A
git commit -m "fix(a11y): remove duplicate SkipLinks CSS, use a11y.css"
```

---

## Task 3: Visual Verification

**Step 1: Start dev server**

Run: `npm run dev`

**Step 2: Verify dark mode game cards**

1. Open http://localhost:5173 in browser
2. Click the theme toggle button (sun/moon icon in header)
3. Verify:
   - Game card backgrounds change to dark (`hsl(220, 20%, 15%)`)
   - Game card titles are clearly visible (light text on dark background)
   - Hover effects work (cards lift and glow)

**Step 3: Verify skip links are hidden**

1. Navigate to any game page (e.g., /magic-graph)
2. Verify: No visible skip link pills in top-left corner
3. Press Tab key from browser address bar
4. Verify: Skip link appears when focused ("Skip to main content")
5. Press Tab again
6. Verify: Second skip link appears ("Skip to game area")
7. Press Tab again
8. Verify: Skip links disappear, focus moves to page content

**Step 4: Final commit (if any adjustments needed)**

```bash
git add -A
git commit -m "fix(ui): dark mode and skip links visual adjustments"
```

---

## Summary

| Task | Description | Files Changed |
|------|-------------|---------------|
| 1 | Dark mode game cards | `src/index.css` |
| 2 | Remove duplicate SkipLinks CSS | `src/shared/components/SkipLinks.tsx`, delete `SkipLinks.css` |
| 3 | Visual verification | N/A (testing) |

**Total estimated changes:** ~15 lines added, ~30 lines removed
