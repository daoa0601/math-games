# VISUAL OVERHAUL: Linear Editorial System (Mobile-First)

> **FOR CLAUDE CODE**: Use `frontend-design` skill. Query Context7 MCP for Linear App, Vercel dashboard design patterns.

---

## ⚠️ CRITICAL: DESTROY, DON'T RESTYLE

**THIS IS NOT A THEMING CHANGE. THIS IS A STRUCTURAL DEMOLITION.**

You will be tempted to:
- Keep existing component structure and just swap colors
- Preserve `border-radius`, shadows, gradients and just change values
- Keep the current layout and just retheme it

**DO NOT DO THIS.**

### What "Destroy" Means

```
❌ WRONG: Change --color-primary from coral to black
✅ RIGHT: Delete the entire color token system and rebuild from scratch

❌ WRONG: Change border-radius from 16px to 2px
✅ RIGHT: Delete all border-radius declarations entirely

❌ WRONG: Change the gradient from coral-teal to black-gray
✅ RIGHT: Delete all gradient declarations, use flat colors only

❌ WRONG: Keep .game-card structure, just restyle it
✅ RIGHT: Delete .game-card entirely, create .slab from scratch
```

### Structural Changes Required

| Current Structure | DELETE | New Structure |
|-------------------|--------|---------------|
| `.game-card` with emoji icon, rounded corners, shadow | ✗ | `.slab` with geometric glyph, hard edges, border |
| `.dashboard` with centered content, gradient bg | ✗ | `.page` full-bleed, pure black |
| `.btn--primary` with gradient, shadow, lift hover | ✗ | `.action` flat white, no shadow, opacity hover |
| `.tag` pill-shaped with gradient | ✗ | `.label` square with 1px border |
| Top navigation | ✗ | Fixed bottom nav with glass |

### Files to DELETE and REWRITE (not edit)

These files should be **completely rewritten**, not modified:

1. `src/shared/styles/tokens/colors.css` - DELETE all, write 10-line B&W palette
2. `src/shared/styles/tokens/shadows.css` - DELETE entirely, no shadows
3. `src/index.css` - DELETE lines 1-300, rebuild minimal base
4. `src/pages/Dashboard/Dashboard.css` - DELETE all, write mobile-first layout

### 📉 FILE SIZE TARGETS

**Smaller files = easier to rebuild from scratch.**

Current files are bloated with unused gradients, shadows, and theme variants. Target these line counts:

| File | Current | Target | Why |
|------|---------|--------|-----|
| `tokens/colors.css` | ~380 lines | **30 lines** | Only need 6 colors, not 50+ |
| `tokens/shadows.css` | ~50 lines | **0 lines** | DELETE. No shadows in this design |
| `tokens/typography.css` | ~80 lines | **20 lines** | 2 fonts, 7 sizes |
| `index.css` | ~800 lines | **150 lines** | Remove all legacy components |
| `Dashboard.css` | ~65 lines | **40 lines** | Simpler layout |
| Each game CSS | 200-400 lines | **100 lines** | Flat design needs less code |

**Rule: If a CSS file is longer than 150 lines, you're overcomplicating it.**

The minimal design means minimal CSS. If you find yourself writing complex selectors or many variants, you're not destroying—you're preserving complexity.

---

## 🚨 DESTRUCTION TABLE

| ❌ DELETE ENTIRELY | ✅ REBUILD AS |
|--------------------|---------------|
| `--font-display: Quicksand` | `Playfair Display` serif |
| `--font-body: Inter` | `JetBrains Mono` |
| All `border-radius` > 2px | `border-radius: 0` |
| All `box-shadow` declarations | `border: 1px solid #222` |
| All `linear-gradient()` | Flat single colors |
| All `hsla(..., 0.08)` overlays | None |
| Emoji icons | Unicode glyphs ◆ ○ □ △ |
| `animation: float, wiggle, pulse` | Delete idle animations |
| `transform: translateY()` hovers | `opacity` change only |
| `--color-primary/secondary/magic` | Single `--accent` only |

---

## MOBILE-FIRST BASE (Rebuild From Zero)

### Step 1: Delete existing tokens, use this

```css
/* DELETE ALL EXISTING :root VARIABLES */
/* Replace with this minimal set */

:root {
  /* Typography */
  --font-display: 'Playfair Display', serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  --text-xs: 10px;
  --text-sm: 11px;
  --text-base: 13px;
  --text-lg: 16px;
  --text-xl: 24px;
  --text-2xl: 32px;
  --text-hero: 48px;
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 24px;
  
  /* Colors: Deep Navy palette (6 only) */
  --bg: #0a0f1a;        /* Deep navy base */
  --surface: #111827;   /* Card backgrounds */
  --border: #1e3a5f;    /* Subtle blue-tinted borders */
  --text: #f8fafc;      /* Warm white */
  --muted: #64748b;     /* Slate gray */
  --accent: #60a5fa;    /* Sky blue for feedback */
  --success: #4ade80;   /* Green for correct answers */
  
  /* Touch */
  --touch-min: 44px;
}

@media (min-width: 768px) {
  :root {
    --text-xl: 32px;
    --text-2xl: 48px;
    --text-hero: 72px;
  }
}
```

### Step 2: Delete existing layout, use this

```css
/* DELETE: .dashboard with gradients, centered, padding */
/* REBUILD: Full-bleed black page */

html, body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-mono);
}

.page {
  min-height: 100dvh;
  padding-bottom: 72px; /* Fixed nav space */
}

/* Fixed bottom nav */
.nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: rgba(0,0,0,0.85);
  backdrop-filter: blur(12px);
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 100;
}
```

### Step 3: Delete .game-card, create .slab

```css
/* DELETE ENTIRELY: */
/* .game-card { border-radius, shadow, gradient, emoji icon... } */

/* REBUILD: */
.grid {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: var(--border);
}

.slab {
  aspect-ratio: 3/4;
  background: var(--surface);
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  position: relative;
  /* NO border-radius. NO shadow. NO gradient. */
}

.slab__number {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  font-family: var(--font-display);
  font-size: var(--text-hero);
  font-weight: 300;
  color: #1a1a1a;
}

.slab__title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 400;
  margin-top: auto;
}

.slab__footer {
  border-top: 1px solid var(--border);
  margin-top: var(--space-md);
  padding-top: var(--space-md);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--muted);
}

.slab:active {
  background: #111;
}

@media (min-width: 768px) {
  .grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }
}
```

### Step 4: Delete .btn, create .action

```css
/* DELETE: .btn with gradients, shadows, translateY hovers */

.action {
  min-height: var(--touch-min);
  padding: var(--space-md) var(--space-lg);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  border: none;
  border-radius: 0;
  cursor: pointer;
  /* NO shadow. NO gradient. */
}

.action--primary {
  background: var(--text);
  color: var(--bg);
}

.action--primary:active {
  opacity: 0.8;
}

.action--secondary {
  background: transparent;
  color: var(--muted);
  border: 1px solid var(--border);
}
```

---

## COMPONENT RENAME MAP

When rebuilding, use new class names to force fresh structure:

| Old (DELETE) | New (CREATE) |
|--------------|--------------|
| `.dashboard` | `.page` |
| `.game-grid` | `.grid` |
| `.game-card` | `.slab` |
| `.game-card__icon` | `.slab__glyph` |
| `.game-card__title` | `.slab__title` |
| `.btn` | `.action` |
| `.btn--primary` | `.action--primary` |
| `.tag` | `.label` |

---

## VERIFICATION CHECKLIST

After rebuild, grep for these. **All should return 0 results:**

```bash
grep -r "border-radius: [0-9]*px" src/  # Should find nothing > 2px
grep -r "box-shadow" src/               # Should find nothing
grep -r "linear-gradient" src/          # Should find nothing
grep -r "Quicksand\|Inter" src/         # Should find nothing
grep -r "translateY" src/               # Should find nothing (except transforms for real animation)
grep -r "--color-primary" src/          # Should find nothing
grep -r "--color-magic" src/            # Should find nothing
```

---

## REFERENCE AESTHETIC

**Linear** + **Vercel** + **Bloomberg Terminal**

- Full-bleed black
- Typography as design
- Borders not shadows
- Monospace for data
- Serif for headlines
- No gradients
- No rounded corners