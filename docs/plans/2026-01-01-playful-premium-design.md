# Playful Premium Design System

**Status:** Approved
**Date:** 2026-01-01
**Author:** Design Brainstorm Session

---

## Executive Summary

This document outlines the "Playful Premium" design direction for the Math Games platform—a refined aesthetic that maintains playfulness while elevating it to feel sophisticated and crafted. Think Apple's design polish meets the delight of Monument Valley.

**Core Philosophy:** Refined vibrancy, soft depth, spring physics, and crafted moments.

---

## 1. Color System

### Refined Palette

Reduce saturation by 15-20% for everyday UI; reserve full saturation for celebration moments.

```css
:root {
  /* Core Colors (refined) */
  --color-primary: hsl(12, 70%, 58%);        /* Warm Coral */
  --color-primary-light: hsl(12, 75%, 68%);
  --color-primary-dark: hsl(12, 65%, 45%);

  --color-secondary: hsl(174, 50%, 45%);     /* Soft Teal */
  --color-secondary-light: hsl(174, 55%, 58%);
  --color-secondary-dark: hsl(174, 45%, 35%);

  /* Accent - Warm Gold (celebration only) */
  --color-accent: hsl(42, 85%, 52%);
  --color-accent-vibrant: hsl(42, 100%, 55%);

  /* Magic Purple */
  --color-magic: hsl(270, 55%, 55%);

  /* Status Colors */
  --color-success: hsl(145, 65%, 42%);
  --color-error: hsl(0, 65%, 50%);
  --color-warning: hsl(38, 90%, 45%);

  /* Surfaces */
  --surface-page: hsl(40, 25%, 98%);
  --surface-card: hsl(0, 0%, 100%);
  --surface-elevated: hsl(220, 15%, 98%);

  /* Text */
  --text-primary: hsl(220, 30%, 15%);
  --text-secondary: hsl(220, 18%, 42%);
  --text-tertiary: hsl(220, 12%, 55%);

  /* Game Theme Accents */
  --theme-magic: hsl(270, 55%, 55%);      /* MagicGraph */
  --theme-race: hsl(24, 85%, 55%);        /* SequenceRace */
  --theme-build: hsl(340, 70%, 58%);      /* ShapeArchitect */
}
```

### Usage Rules

- **Muted colors** for surfaces and resting states
- **Full saturation** only for achievements, wins, and CTAs
- **Gold accent** reserved exclusively for celebrations

---

## 2. Typography

### Font Stack

```css
:root {
  --font-display: 'Quicksand', -apple-system, sans-serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

### Type Scale

```css
:root {
  --text-sm: 0.875rem;     /* 14px - labels */
  --text-base: 1rem;       /* 16px - body */
  --text-lg: 1.25rem;      /* 20px - subheads */
  --text-xl: 1.625rem;     /* 26px - card titles */
  --text-2xl: 2.25rem;     /* 36px - section heads */
  --text-3xl: 3rem;        /* 48px - page titles */
}
```

### Typography Rules

- Headings: Quicksand, weight 600-700, letter-spacing -0.02em
- Body: Inter, weight 500, line-height 1.6
- No gradient text in gameplay (reserve for celebration overlays)

---

## 3. Shadow System

### Soft Multi-Layer Elevation

```css
:root {
  --shadow-xs: 0 1px 2px hsla(220, 25%, 10%, 0.06);

  --shadow-sm:
    0 1px 3px hsla(220, 25%, 10%, 0.08),
    0 1px 2px hsla(220, 25%, 10%, 0.04);

  --shadow-md:
    0 4px 6px -1px hsla(220, 25%, 10%, 0.08),
    0 2px 4px -1px hsla(220, 25%, 10%, 0.04);

  --shadow-lg:
    0 10px 15px -3px hsla(220, 25%, 10%, 0.08),
    0 4px 6px -2px hsla(220, 25%, 10%, 0.04);

  --shadow-xl:
    0 20px 25px -5px hsla(220, 25%, 10%, 0.08),
    0 10px 10px -5px hsla(220, 25%, 10%, 0.02);
}
```

### Button Shadow (Premium 3D)

```css
.btn--primary {
  box-shadow:
    0 1px 2px hsla(12, 70%, 35%, 0.3),
    0 2px 4px hsla(12, 70%, 35%, 0.2),
    0 4px 8px -2px hsla(12, 70%, 35%, 0.15),
    inset 0 1px 0 hsla(0, 0%, 100%, 0.2);
}
```

---

## 4. Motion System

### Spring Easing Functions

```css
:root {
  --spring-gentle: cubic-bezier(0.23, 1, 0.32, 1);
  --spring-snappy: cubic-bezier(0.5, 1.5, 0.5, 1);
  --spring-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);

  --motion-instant: 100ms;
  --motion-fast: 200ms;
  --motion-normal: 350ms;
  --motion-slow: 500ms;
}
```

### Animation Rules

| Category | When | Duration |
|----------|------|----------|
| Hover feedback | User hovers | 200ms, spring-snappy |
| Press feedback | User clicks | 100ms, ease-out |
| State transition | Page/modal change | 300-400ms, spring-gentle |
| Celebration | Win/achievement | 500-600ms, spring-bounce |
| Ambient | Never during gameplay | N/A |

### Magnetic Button Effect

```javascript
button.addEventListener('mousemove', (e) => {
  const rect = e.target.getBoundingClientRect();
  const x = (e.clientX - rect.left - rect.width / 2) * 0.1;
  const y = (e.clientY - rect.top - rect.height / 2) * 0.1;
  e.target.style.transform = `translate(${x}px, ${y}px)`;
});
```

---

## 5. Component Specifications

### Button

**Variants:** `primary`, `secondary`, `ghost`, `icon`

```css
.btn {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--text-base);
  padding: 12px 24px;
  border-radius: 12px;
  border: none;
  min-height: 44px;
  transition: all 200ms var(--spring-snappy);
}

.btn--primary {
  background: linear-gradient(180deg,
    hsl(12, 70%, 62%) 0%,
    hsl(12, 70%, 55%) 100%);
  color: white;
}

.btn--primary:hover {
  transform: translateY(-2px);
}

.btn--primary:active {
  transform: translateY(0) scale(0.98);
}
```

### Card

**Variants:** `game`, `profile`, `stat`

```css
.card {
  background: linear-gradient(135deg,
    hsl(0, 0%, 100%) 0%,
    hsl(220, 20%, 99%) 100%);
  border: 1px solid hsla(220, 20%, 10%, 0.06);
  border-radius: 20px;
  padding: 24px;
  transition: all 350ms var(--spring-gentle);
}

.card--hoverable:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

/* Gradient border on hover */
.card--game::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 2px;
  background: linear-gradient(135deg,
    hsla(12, 70%, 58%, 0.4),
    hsla(174, 50%, 45%, 0.4));
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  opacity: 0;
  transition: opacity 350ms ease;
}

.card--game:hover::before {
  opacity: 1;
}
```

### Overlay (Glassmorphic)

```css
.game-overlay__backdrop {
  background: hsla(220, 25%, 10%, 0.6);
  backdrop-filter: blur(8px);
}

.game-overlay__content {
  background: white;
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 24px 48px -12px hsla(220, 25%, 10%, 0.25);
  animation: scale-in 400ms var(--spring-bounce);
}
```

### Achievement Toast

```css
.achievement-toast {
  background: hsla(0, 0%, 100%, 0.9);
  backdrop-filter: blur(16px) saturate(120%);
  border: 1px solid hsla(220, 20%, 90%, 0.8);
  border-left: 3px solid var(--rarity-color);
  border-radius: 16px;
  box-shadow:
    0 8px 32px -4px hsla(220, 25%, 10%, 0.15),
    0 4px 12px -2px hsla(220, 25%, 10%, 0.08);
  animation: toast-enter 500ms var(--spring-bounce);
}

@keyframes toast-enter {
  0% {
    opacity: 0;
    transform: translateX(100%) scale(0.95);
    filter: blur(4px);
  }
  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
    filter: blur(0);
  }
}
```

### Progress Bar

```css
.progress-bar {
  height: 8px;
  background: hsl(220, 15%, 92%);
  border-radius: 999px;
  box-shadow: inset 0 1px 2px hsla(220, 20%, 10%, 0.08);
}

.progress-fill {
  background: linear-gradient(90deg,
    hsl(174, 50%, 45%) 0%,
    hsl(12, 70%, 58%) 100%);
  border-radius: inherit;
  transition: width 600ms var(--spring-gentle);
}

/* Shimmer effect */
.progress-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg,
    transparent 0%,
    hsla(0, 0%, 100%, 0.4) 50%,
    transparent 100%);
  animation: shimmer 2s ease-in-out infinite;
}
```

### Rank Badge

```css
.rank-badge__ring {
  background: linear-gradient(135deg,
    hsl(42, 85%, 55%) 0%,
    hsl(38, 90%, 48%) 50%,
    hsl(42, 85%, 55%) 100%);
  background-size: 200% 200%;
  animation: gradient-rotate 3s linear infinite;
  border-radius: 50%;
  padding: 3px;
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
}

.rank-badge__inner {
  background: linear-gradient(135deg,
    hsl(0, 0%, 100%),
    hsl(220, 15%, 97%));
  border-radius: 50%;
  box-shadow:
    0 4px 12px hsla(42, 85%, 50%, 0.2),
    inset 0 1px 0 hsla(0, 0%, 100%, 0.8);
}
```

---

## 6. Game Themes

### MagicGraph: "Cosmic Observatory"

```css
.puzzle-board {
  background:
    /* Nebula clouds */
    radial-gradient(ellipse at 30% 20%,
      hsla(270, 40%, 25%, 0.4) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 80%,
      hsla(220, 45%, 20%, 0.3) 0%, transparent 50%),
    /* Base */
    linear-gradient(135deg,
      hsl(250, 35%, 12%) 0%,
      hsl(240, 40%, 8%) 100%);
}

.puzzle-node--fixed {
  fill: url(#starGradient);
  filter: drop-shadow(0 0 6px hsla(42, 80%, 55%, 0.5));
}
```

**Changes:**
- Reduce twinkling stars to 4-5 with randomized timing
- Softer node glows (less saturated)
- Win state: Aurora shimmer across board

### SequenceRace: "Championship Stadium"

```css
.race-background {
  background:
    /* Clouds */
    radial-gradient(ellipse at 20% 30%,
      hsla(0, 0%, 100%, 0.6) 0%, transparent 25%),
    /* Sky gradient (slightly muted) */
    linear-gradient(180deg,
      hsl(210, 70%, 65%) 0%,
      hsl(200, 60%, 75%) 60%,
      hsl(140, 40%, 70%) 100%);
}

.race-track {
  background: linear-gradient(90deg,
    hsl(15, 55%, 45%) 0%,
    hsl(18, 60%, 48%) 50%,
    hsl(15, 55%, 45%) 100%);
  box-shadow: inset 0 4px 12px hsla(0, 0%, 0%, 0.2);
}
```

**Changes:**
- Subtle shadows beneath runner feet
- More realistic dust particle fade-out
- Victory: Podium with depth, spotlight effect

### ShapeArchitect: "Artisan Workshop"

```css
.grid-board {
  background:
    /* Wood grain */
    repeating-linear-gradient(90deg,
      transparent 0px,
      hsla(30, 20%, 40%, 0.03) 1px,
      transparent 2px,
      transparent 20px),
    /* Base wood */
    linear-gradient(180deg,
      hsl(32, 35%, 82%) 0%,
      hsl(28, 30%, 75%) 100%);
  box-shadow:
    inset 0 2px 4px hsla(0, 0%, 100%, 0.5),
    inset 0 -2px 4px hsla(30, 40%, 30%, 0.1);
}

.voxel-block {
  border-radius: 4px;
  box-shadow:
    inset 0 1px 0 hsla(0, 0%, 100%, 0.4),
    inset 0 -2px 0 hsla(0, 0%, 0%, 0.15),
    0 2px 4px hsla(0, 0%, 0%, 0.1);
}
```

**Changes:**
- Richer wood texture
- Subtle blueprint grid pulse on target cells only
- Completion: "Stamp of approval" animation

---

## 7. Accessibility

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }

  .progress-fill::after { display: none; }
  .confetti-canvas { display: none; }
}
```

### Focus States

```css
:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 3px var(--surface-page),
    0 0 0 5px var(--color-primary);
}
```

### Touch Targets

- Minimum 44px height/width on all interactive elements
- 48px+ on touch devices (`@media (pointer: coarse)`)

---

## 8. Implementation Phases

### Phase 1: Design Tokens (Days 1-3)
- [ ] Create `src/shared/styles/tokens/` structure
- [ ] Define colors, typography, shadows, motion
- [ ] Replace 72 hardcoded color values

### Phase 2: Core Components (Days 4-8)
- [ ] Update Button component with variants
- [ ] Create unified Card component
- [ ] Consolidate overlays to GameOverlay
- [ ] Migrate inline buttons to component

### Phase 3: Game Themes (Days 9-14)
- [ ] MagicGraph: Cosmic Observatory
- [ ] SequenceRace: Championship Stadium
- [ ] ShapeArchitect: Artisan Workshop

### Phase 4: Gamification Polish (Days 15-18)
- [ ] Achievement toast with blur-in
- [ ] Progress bar shimmer
- [ ] Rank badge animated border
- [ ] Rank-up confetti (canvas)

### Phase 5: Dark Mode (Days 19-21) — Optional
- [ ] Dark mode token variants
- [ ] Game theme adaptations
- [ ] Theme toggle UI

---

## 9. Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Lighthouse Performance | ~85 | 90+ |
| CSS bundle size | ~45KB | ~35KB |
| Font load time | ~60KB | ~25KB |
| Component consistency | 60% | 100% |

---

## 10. Design Principles

1. **Refined Vibrancy** — Muted bases, vibrant moments
2. **Soft Depth** — Multi-layer shadows, no hard edges
3. **Spring Physics** — Natural, bouncy motion
4. **Selective Glass** — Glassmorphism for floating elements only
5. **Crafted Moments** — Extra polish on reward interactions
6. **Consistent Quality** — Unified component library
7. **Accessible Premium** — Beautiful for everyone

---

*Document generated from design brainstorm session.*
