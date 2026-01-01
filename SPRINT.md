# Math Gymnasium - Sprint Planning

## Completed Sprints Summary

| Sprint | Goal | Status |
|--------|------|--------|
| 1 | Visual Foundation (Magical Classroom theme) | ✅ |
| 2 | Gamification Core (XP, levels, achievements) | ✅ |
| 3 | Practice Mode & Timer | ✅ |
| 3.5 | Bug Fixes & Achievements Gallery | ✅ |
| 4 | Game Theme Refinements | ✅ |
| 5 | 3D Mode Enhancement | ✅ |
| 6 | Daily Challenge & Leaderboard | ✅ |

---

## Sprint 4: Game Theme Refinements ✅ COMPLETE

**Goal:** Apply game-specific visual themes

### MagicGraph - "Mystical Constellation"
- [x] Dark starfield background for puzzle area
- [x] Glowing node effects
- [x] Shimmer animation on completed lines
- [x] Sparkle particles on correct placement
- [x] Constellation reveal animation on puzzle completion

### SequenceRace - "Track & Field"
- [x] Sky gradient background
- [x] Animated running character (CSS stick figures replace emoji)
- [x] AI personality with avatar and reactions
- [x] Dust cloud effects on movement (multi-particle burst)
- [x] Victory/defeat pose animations

### ShapeArchitect - "Building Workshop"
- [x] Light workbench background
- [x] Blueprint grid pattern
- [x] Construction dust effects (enhanced with ring burst)
- [x] Piece "click into place" animation (with rotation wobble)

### Accessibility
- [x] Reduced motion support for all new animations

---

## Sprint 5: 3D Mode Enhancement ✅ COMPLETE

**Goal:** Improve ShapeArchitect 3D experience

### Visual Enhancements
- [x] Responsive 3D canvas (aspect-ratio: 4/3, max-height: 70vh)
- [x] Improved lighting (key light with shadows, fill light, rim light)
- [x] Shadow-receiving ground plane
- [x] Grid floor with X/Y/Z coordinate labels and axis lines

### Camera Controls
- [x] Camera preset buttons (Isometric, Top, Front, Side, Reset)
- [x] Smooth LERP animation between presets
- [x] Keyboard shortcuts (1-5 for presets)
- [x] Workshop-themed control panel styling

### 3D Puzzles
- [x] 8 true 3D puzzles with depth 3-6 layers
- [x] 3D tetracube piece definitions (Corner, Tower, L3D, Stairs, etc.)
- [x] Layer visibility toggle (slider + quick buttons)
- [x] Layer slicing for viewing internal structure

### 3D Rotation System
- [x] `Rotation3D` type system (x, y, z Euler angles)
- [x] Full 3D rotation engine (pitch/yaw/roll transformations)
- [x] RotationControls component with workshop dial aesthetic
- [x] Color-coded axis buttons (X=red, Y=green, Z=blue)
- [x] Keyboard shortcuts: T=X-axis, Y=Y-axis, R=Z-axis
- [x] Backward compatibility with 2D puzzles

---

## Sprint 6: Daily Challenge & Leaderboard ✅ COMPLETE

**Goal:** Add engagement features

### Daily Challenge System
- [x] `DailyChallenge` component (Dashboard widget with countdown timer)
- [x] Daily puzzle rotation (Mulberry32 PRNG seeded by date + gameId)
- [x] Seeded generators for all 3 games (`seededGenerator.ts`)
- [x] Per-game streak tracking (currentStreak, longestStreak)
- [x] Daily mode via `?daily=true` URL param

### Personal Best & Leaderboard
- [x] `PersonalBestIndicator` component (new best, tied, first completion variants)
- [x] Personal best detection in `completeLevelWithPB()` utility
- [x] Best times per level stored in TypedStorage
- [x] `useGameRewards` extended to return `personalBest` data

### Game Integration
- [x] MagicGraph daily mode (hides difficulty/level selectors)
- [x] SequenceRace daily mode (forces vs-AI medium difficulty)
- [x] ShapeArchitect daily mode (medium difficulty seeded level)
- [x] All games show PersonalBestIndicator in win overlays

### Infrastructure
- [x] `seededRandom.ts` utility (Mulberry32 algorithm)
- [x] `daily.ts` service (challenge state, streak tracking)
- [x] Zod schemas for `DailyChallengeState`, `GameStreak`
- [x] i18n translations (EN/VI) for daily and personalBest

---

## Sprint 7: Accessibility & Mobile 🚧 IN PROGRESS

**Goal:** Ensure app works for all students

### Accessibility
- [x] Pattern/shape indicators alongside colors
  - CSS patterns (dots, lines, grid, diagonal) via `patterns.css`
  - SVG patterns for MagicGraph nodes (fixed/empty/filled states)
  - Border style differentiation for SequenceRace (solid player, dashed AI)
  - `colorPatterns.ts` utility for hue-based pattern assignment
- [x] Screen reader announcements (timer warnings)
  - `ScreenReaderAnnounce` component with aria-live regions
  - `useAnnounce` hook for programmatic announcements
  - Timer warnings at 30s (polite) and 10s (assertive)
  - `onTimeWarning` callback in `useGameTimer` hook
- [x] Focus trap in modals
  - `useFocusTrap` hook with Escape key handling
  - Applied to GameOverlay and RankUpOverlay
- [ ] Screen reader announcements for game state (partial)
  - ⏳ Win/completion announcements
  - ⏳ Turn change announcements (SequenceRace)
- [ ] Improved keyboard navigation (existing: basic grid nav)
- [ ] WCAG AA color contrast audit

### Mobile
- [x] Breakpoints: 1024px, 480px, 360px (standardized in index.css)
- [x] Touch-optimized controls (44px min targets, touch-action: manipulation)
- [x] Swipe gestures
  - `useSwipe`, `useSwipeNavigation`, `useSwipeBack` hooks
  - Swipe to rotate pieces (ShapeArchitect)
  - Swipe to change level (all games)
  - Mobile swipe hint on touch devices
- [x] Landscape/portrait handling (`orientation.css`)
  - Compact layouts for landscape phones
  - Safe area insets for notched devices
- [x] Gesture hooks infrastructure
  - `usePinchZoom` for 3D zoom (ready for integration)
  - `useDragScroll` for touch scrolling (ready for integration)

---

## Sprint 8: Onboarding & Polish

**Goal:** Help new users get started

- [ ] Interactive tutorial for each game
- [ ] Step-by-step overlay with highlighting
- [ ] "Skip Tutorial" option
- [ ] Help button to access tutorial anytime
- [ ] Final bug fixes and polish

---

## Priority Order

| Sprint | Priority | Status |
|--------|----------|--------|
| Sprint 4: Game Themes | MEDIUM | ✅ Complete |
| Sprint 5: 3D Enhancement | MEDIUM | ✅ Complete |
| Sprint 6: Daily Challenge | MEDIUM | ✅ Complete |
| Sprint 7: Accessibility | HIGH | 🚧 In Progress (~80%) |
| Sprint 8: Onboarding | MEDIUM | Pending |

---

## Success Metrics

- [x] 3 games with counter-based progression
- [x] 10 core achievements
- [x] Practice mode (no tracking)
- [x] Achievements gallery
- [x] Code splitting
- [x] 8 actual 3D puzzles with layer visibility
- [x] Full 3D rotation (X/Y/Z axes)
- [x] Daily challenges with seeded puzzles
- [x] Personal best tracking per level
- [x] Per-game streak tracking
- [ ] Interactive tutorials
- [ ] WCAG AA compliance
- [ ] Mobile-friendly (360px+)
