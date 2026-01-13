# Contributing to Math Gymnasium

Thank you for your interest in contributing to Math Gymnasium! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+

### Getting Started

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/math-gymnasium.git
   cd math-gymnasium
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to http://localhost:5173

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | TypeScript compilation + Vite production build |
| `npm run lint` | ESLint with TypeScript-aware rules |
| `npm test` | Run tests in watch mode (Vitest) |
| `npm run test:coverage` | Run tests with coverage report |

---

## Code Style

### TypeScript

- Use strict TypeScript configuration
- Prefer explicit types for function parameters and return values
- Use `interface` for object shapes, `type` for unions/aliases

```typescript
// Preferred
interface GameState {
  score: number;
  isPlaying: boolean;
}

function calculateScore(moves: number): number {
  return moves * 10;
}
```

### Path Aliases

Use `@/` path alias for imports from `src/`:

```typescript
// Preferred
import { GameLayout } from '@/shared/components';
import { useGameTimer } from '@/shared/hooks';

// Avoid
import { GameLayout } from '../../shared/components';
```

### CSS

The design system uses **two surface types**:

| Surface Type | Used For | Rules |
|--------------|----------|-------|
| Editorial (flat) | Buttons, inputs, labels, game boards | No gradients, no shadows, border-radius ≤2px |
| Premium (credit card) | Cards, modals, navigation, achievements | Gradients allowed, 8px radius, soft shadows |

- Use semantic class names (not BEM)
- Define component-specific styles in colocated `.css` files
- Use CSS custom properties from the design system
- See `CLAUDE.md` for full design system documentation

**Core class patterns:**
- `.slab` - Card/container surfaces (editorial style)
- `.action` - Interactive buttons (editorial style)
- `.label` - Text labels and metadata
- `.premium-surface` - Credit card aesthetic surfaces

```css
/* Editorial style (buttons, inputs) */
.action {
  font-family: var(--font-mono);
  color: var(--text);
  background: transparent;
  border: 1px solid var(--border);
  /* NO shadows, NO gradients, NO border-radius >2px */
}

/* Premium style (modals, cards) */
.premium-surface {
  background: var(--card-gradient);
  border-radius: 8px;
  box-shadow: var(--card-shadow);
}
```

**Editorial Surface Constraints:**
- NO gradients (flat colors only)
- NO box-shadow (use 1px borders)
- NO border-radius >2px
- Target <150 lines per CSS file

**shadcn/ui Components:**
- Located in `src/shared/components/ui/shadcn/`
- Use `tw:` prefix for Tailwind classes (e.g., `tw:flex`, `tw:gap-2`)
- Import with `import { Button } from '@/shared/components/ui/shadcn'`

### Component Structure

```typescript
// ComponentName.tsx
import { useState } from 'react';
import './ComponentName.css';

interface ComponentNameProps {
  title: string;
  onAction: () => void;
}

export function ComponentName({ title, onAction }: ComponentNameProps) {
  const [state, setState] = useState(false);

  return (
    <div className="slab">
      <h2 className="label">{title}</h2>
      <button className="action" onClick={onAction}>Action</button>
    </div>
  );
}
```

---

## Game Module Pattern

When adding a new game, follow this structure:

```
src/games/NewGame/
├── logic/
│   ├── types.ts        # Type definitions
│   ├── engine.ts       # Core game logic (pure TypeScript)
│   └── presets.ts      # Level configurations
├── components/
│   ├── Board.tsx       # Main game board
│   └── NewGame.css     # Game-specific styles
├── hooks/
│   └── useGameState.ts # Game-specific hooks
├── NewGameGame.tsx     # Main game container
└── index.ts            # Barrel export
```

### Key Principles

1. **Separate logic from UI**: Keep `logic/` free of React dependencies
2. **Use barrel exports**: Export from `index.ts` for clean imports
3. **Lazy load games**: Add to `App.tsx` with `React.lazy()`

---

## Pull Request Process

### Before Submitting

1. **Run linting**
   ```bash
   npm run lint
   ```

2. **Run tests**
   ```bash
   npm test
   ```

3. **Build successfully**
   ```bash
   npm run build
   ```

### PR Guidelines

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Write descriptive commit messages**
   ```
   feat(magic-graph): add hexagon puzzle shape

   - Add HexagonPreset to presets.ts
   - Create hexagon SVG layout
   - Add difficulty scaling for 6-node puzzles
   ```

3. **Keep PRs focused**: One feature or fix per PR

4. **Update documentation**: If adding new features, update relevant docs

5. **Add tests**: Include tests for new game logic

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting (no code change)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

---

## Testing Requirements

### What to Test

1. **Game logic**: Pure functions in `logic/` directories
2. **Utility functions**: Helpers in `shared/utils/`
3. **Schema validation**: Zod schemas in `shared/schemas/`

### Example Test

```typescript
// engine.test.ts
import { describe, it, expect } from 'vitest';
import { calculateSum, isValidMove } from './engine';

describe('calculateSum', () => {
  it('returns correct sum for line nodes', () => {
    const nodes = [{ value: 1 }, { value: 2 }, { value: 3 }];
    expect(calculateSum(nodes)).toBe(6);
  });
});
```

### Running Tests

```bash
# Watch mode (recommended during development)
npm test

# Single run with coverage
npm run test:coverage
```

---

## Internationalization

The app supports English and Vietnamese. When adding user-facing text:

1. Add keys to both `src/i18n/en.json` and `src/i18n/vi.json`
2. Use the `useTranslation` hook

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t('myComponent.title')}</h1>;
}
```

---

## Questions?

If you have questions about contributing, please open an issue with the "question" label.

Thank you for helping make math fun for students!
