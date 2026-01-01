# Architecting a scalable React + TypeScript educational game SPA

Applying SOLID principles to your React math games application requires a strategic combination of **component composition patterns**, **aggressive bundle optimization**, and **performance-conscious architecture**. Your 1,134 KB Three.js vendor chunk can realistically be reduced by **40-60%** using the three-minifier plugin and direct source imports, while lazy loading can cut initial load to under 400 KB. The key insight across all these domains: **separation of concerns is not just about code organization—it's about enabling tree-shaking, testing, and performance optimization**.

This report provides actionable patterns with code examples for each of your five focus areas, prioritizing approaches that balance clean architecture with educational game requirements: engagement, accessibility, and performance on lower-end devices.

---

## SOLID principles translate naturally to React's composition model

The five SOLID principles map directly to React patterns, though they require reframing from classical OOP thinking. The most impactful principle for your application is **Single Responsibility** (SRP)—large 500-700 line components almost always violate it, creating testing nightmares and defeating tree-shaking.

**Single Responsibility in practice** means separating UI rendering from business logic. A game screen component should orchestrate, not implement:

```typescript
// ❌ Monolithic: 500+ lines, untestable, no tree-shaking
const GameScreen = ({ gameId }) => {
  const [score, setScore] = useState(0);
  const [gameData, setGameData] = useState(null);
  useEffect(() => {
    fetch(`/api/games/${gameId}`).then(r => r.json()).then(setGameData);
  }, [gameId]);
  // 300+ lines of mixed concerns...
};

// ✅ Composed: each hook testable, logic tree-shakeable
const GameScreen = ({ gameId }) => {
  const { gameData, loading } = useGameData(gameId);
  const { score, incrementScore } = useGameScore();
  const { isPaused, togglePause } = useGameControls();
  
  if (loading) return <LoadingSpinner />;
  return (
    <GameContainer>
      <GameHeader score={score} />
      <ActivityArea onScore={incrementScore} isPaused={isPaused} />
      <GameControls onTogglePause={togglePause} />
    </GameContainer>
  );
};
```

**Dependency Inversion** (DIP) is critical for testability and enabling mock services. Use Context for dependency injection rather than importing services directly:

```typescript
interface GameService {
  saveProgress: (progress: GameProgress) => Promise<void>;
  loadProgress: (userId: string) => Promise<GameProgress>;
}

const GameServiceContext = createContext<GameService | null>(null);

// Inject different implementations for prod vs. test
<GameServiceProvider service={isTest ? mockService : realService}>
  <App />
</GameServiceProvider>
```

**Interface Segregation** (ISP) directly improves performance—components should receive only the props they render. A `PlayerAvatar` component needing only `{avatar, name}` should not receive a full `GameEntity` interface with achievements, history, and settings.

### Compound components enable flexible game UI composition

The **compound component pattern** is ideal for educational game menus, question cards, and progress indicators. It allows declarative composition while sharing implicit state:

```typescript
const GameMenu = ({ children }) => {
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const value = useMemo(() => ({ activeItem, setActiveItem }), [activeItem]);
  
  return (
    <GameMenuContext.Provider value={value}>
      <nav className="game-menu">{children}</nav>
    </GameMenuContext.Provider>
  );
};

GameMenu.Item = ({ id, children }) => {
  const { activeItem, setActiveItem } = useGameMenuContext();
  return <button className={activeItem === id ? 'active' : ''} onClick={() => setActiveItem(id)}>{children}</button>;
};

// Usage: flexible, declarative API
<GameMenu>
  <GameMenu.Item id="levels">Levels</GameMenu.Item>
  <GameMenu.Item id="achievements">Achievements</GameMenu.Item>
  <GameMenu.Panel id="levels"><LevelSelector /></GameMenu.Panel>
</GameMenu>
```

### XState provides predictable state management for complex game flows

For educational games with multiple states (idle → playing → feedback → level complete → game over), **XState statecharts** eliminate impossible state bugs:

```typescript
const gameMachine = createMachine({
  id: 'educationalGame',
  initial: 'idle',
  context: { score: 0, lives: 3, currentLevel: 1 },
  states: {
    idle: { on: { START: 'playing' } },
    playing: {
      initial: 'showingQuestion',
      states: {
        showingQuestion: {
          on: {
            ANSWER_CORRECT: { target: 'feedback', actions: assign({ score: (ctx, e) => ctx.score + e.points }) },
            ANSWER_WRONG: { target: 'feedback', actions: assign({ lives: ctx => ctx.lives - 1 }) },
          },
        },
        feedback: {
          after: { 2000: [
            { target: '#educationalGame.levelComplete', guard: 'allQuestionsAnswered' },
            { target: '#educationalGame.gameOver', guard: 'noLivesLeft' },
            { target: 'showingQuestion' },
          ]},
        },
      },
    },
    paused: { on: { RESUME: 'playing.hist' }, states: { hist: { type: 'history', history: 'deep' } } },
    gameOver: { on: { RESTART: { target: 'idle', actions: 'resetContext' } } },
  },
});
```

---

## Your Three.js bundle can shrink by 40-60% with proper optimization

Three.js is **not fully tree-shakeable** due to side effects in its codebase, but the **three-minifier plugin** achieves ~39% reduction (576KB → 354KB in benchmarks). Combined with lazy loading, your **1,134 KB chunk can realistically become 400-500 KB** loaded only when 3D games are accessed.

### Install and configure three-minifier immediately

```bash
npm install --save-dev @yushijinhun/three-minifier-rollup
```

```typescript
// vite.config.ts
import { threeMinifier } from "@yushijinhun/three-minifier-rollup";

export default defineConfig({
  plugins: [
    { ...threeMinifier(), enforce: "pre" }, // MUST be first
    react(),
  ],
});
```

The plugin resolves `three` → `three/src/Three.js` for better tree-shaking, marks Three.js as side-effect free, and minifies GLSL shaders.

### Use direct source imports, not barrel imports

```typescript
// ❌ AVOID: pulls in entire library
import * as THREE from "three";
import { Scene, Camera, Mesh } from "three";

// ✅ BEST: direct source imports for tree-shaking
import { WebGLRenderer } from "three/src/renderers/WebGLRenderer.js";
import { Scene } from "three/src/scenes/Scene.js";
import { Mesh } from "three/src/objects/Mesh.js";
import { BoxGeometry } from "three/src/geometries/BoxGeometry.js";

// ✅ Addons from three/addons/ (modern pattern)
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
```

### Configure Vite for optimal chunk splitting

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) return "react-vendor";
          if (id.includes("node_modules/three/src/")) return "three-core";
          if (id.includes("three/examples/jsm/") || id.includes("three/addons/")) return "three-addons";
          if (id.includes("react-router")) return "router";
          if (id.includes("node_modules")) return "vendor";
        },
      },
      treeshake: {
        preset: "recommended",
        moduleSideEffects: (id) => !id.includes("three"), // Mark Three.js side-effect free
      },
    },
  },
});
```

### Lazy load game modules containing Three.js

```typescript
const MathGame3D = lazy(() => import("./games/MathGame3D"));

function App() {
  return (
    <Suspense fallback={<GameLoader />}>
      <Routes>
        <Route path="/math-game" element={<MathGame3D />} />
      </Routes>
    </Suspense>
  );
}
```

**Expected results after optimization:**

| Metric | Before | After |
|--------|--------|-------|
| Three.js chunk | 1,134 KB | ~400-500 KB |
| Initial JS load | ~1.5 MB | ~300-400 KB |
| Time to Interactive | Slow | Significantly faster |

---

## Feature-based architecture scales better than layer-based

For growing teams, **feature-based (vertical slice) architecture** groups all related files by domain rather than by file type. This reduces mental overhead, enables parallel team work, and makes features independently maintainable.

```
src/
├── app/                    # Application layer (routes, providers)
├── components/             # Shared UI components only
├── features/               # Feature modules (vertical slices)
│   ├── game-engine/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── stores/
│   │   └── index.ts        # Public API barrel
│   ├── player-progress/
│   ├── achievements/
│   └── leaderboard/
├── hooks/                  # Shared hooks
├── types/                  # Shared TypeScript types
└── utils/                  # Shared utilities
```

**Enforce module boundaries** with ESLint to prevent import violations:

```javascript
// .eslintrc.js
rules: {
  'import/no-restricted-paths': ['error', {
    zones: [
      { target: './src/features', from: './src/app' },
      { target: './src/features/game-engine', from: './src/features', except: ['./game-engine'] },
    ]
  }]
}
```

### Prevent Context re-renders by splitting state and API

When Context value changes, **all consumers re-render**—even if they don't use the changed part. Split frequently-changing state from stable action functions:

```typescript
const GameStateContext = createContext<GameState>({} as GameState);
const GameAPIContext = createContext<GameAPI>({} as GameAPI);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // API is stable - empty deps means never recreated
  const api = useMemo<GameAPI>(() => ({
    incrementScore: (points) => dispatch({ type: 'INCREMENT_SCORE', points }),
    nextLevel: () => dispatch({ type: 'NEXT_LEVEL' }),
  }), []);

  return (
    <GameAPIContext.Provider value={api}>
      <GameStateContext.Provider value={state}>
        {children}
      </GameStateContext.Provider>
    </GameAPIContext.Provider>
  );
};

// Components using only API won't re-render on state changes
const GameControls = () => {
  const { incrementScore } = useGameAPI(); // Stable reference
  return <button onClick={() => incrementScore(10)}>Add Points</button>;
};
```

### Implement type-safe localStorage with schema migrations

For game progress persistence, create a typed storage abstraction that handles versioning and migrations:

```typescript
interface StorageSchema {
  playerProgress: PlayerProgress;
  gameSettings: GameSettings;
  achievements: Achievement[];
}

class TypedStorage {
  private version = 1;
  
  get<K extends keyof StorageSchema>(key: K): StorageSchema[K] | null {
    try {
      const item = localStorage.getItem(`edu-game:v${this.version}:${key}`);
      return item ? JSON.parse(item) : null;
    } catch { return null; }
  }

  set<K extends keyof StorageSchema>(key: K, value: StorageSchema[K]): void {
    try {
      localStorage.setItem(`edu-game:v${this.version}:${key}`, JSON.stringify(value));
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        this.cleanup();
      }
    }
  }
}
```

For complex game state, **Zustand with persistence middleware** is recommended over raw localStorage:

```typescript
export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      score: 0,
      unlockedAchievements: [],
      incrementScore: (points) => set((s) => ({ score: s.score + points })),
    }),
    {
      name: 'game-storage',
      partialize: (state) => ({ score: state.score, unlockedAchievements: state.unlockedAchievements }),
    }
  )
);
```

---

## Performance optimization requires targeting the right metrics

For educational games, prioritize **INP (Interaction to Next Paint)** over other Web Vitals—game responsiveness is critical for engagement. Target thresholds: **LCP ≤2.5s**, **INP ≤200ms**, **CLS ≤0.1**.

### Animate only transform and opacity for 60fps

Only these CSS properties trigger GPU compositing without layout/paint:

```css
/* ✅ GPU-accelerated - only triggers composite */
.animated-element {
  transform: translateX(100px) scale(1.1);
  opacity: 0.8;
}

/* ❌ Triggers layout + paint + composite */
.slow-animation {
  left: 100px;
  width: 200px;
}
```

**`will-change` is a last resort**, not a performance silver bullet. It creates GPU layers that consume memory—Firefox specifically warns about memory issues. Apply it dynamically before animations, remove after:

```javascript
element.addEventListener('mouseenter', () => {
  element.style.willChange = 'transform';
});
element.addEventListener('animationend', () => {
  element.style.willChange = 'auto'; // Release GPU memory
});
```

### Use object pooling for frequently created game entities

Creating/destroying objects causes garbage collection pauses. Pool reusable entities:

```typescript
class ObjectPool<T> {
  private pool: T[] = [];
  private active: T[] = [];
  
  constructor(private createFn: () => T, initialSize = 20) {
    for (let i = 0; i < initialSize; i++) this.pool.push(this.createFn());
  }
  
  acquire(): T {
    const obj = this.pool.pop() ?? this.createFn();
    this.active.push(obj);
    return obj;
  }
  
  release(obj: T): void {
    const idx = this.active.indexOf(obj);
    if (idx !== -1) {
      this.active.splice(idx, 1);
      this.pool.push(obj);
    }
  }
}

// Usage
const bulletPool = useMemo(() => new ObjectPool(() => ({ x: 0, y: 0, active: false }), 50), []);
```

### Three.js requires explicit resource disposal

Memory leaks in long-running game sessions come from undisposed geometries, materials, and textures:

```typescript
function cleanupThreeJSObject(object: Object3D) {
  if (object.geometry) object.geometry.dispose();
  
  if (object.material) {
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach(mat => {
      Object.keys(mat).forEach(key => {
        if (mat[key]?.isTexture) mat[key].dispose();
      });
      mat.dispose();
    });
  }
  
  object.traverse(child => cleanupThreeJSObject(child));
}

// In useEffect cleanup
useEffect(() => {
  return () => {
    while (scene.children.length > 0) {
      const obj = scene.children[0];
      scene.remove(obj);
      cleanupThreeJSObject(obj);
    }
    renderer.dispose();
  };
}, []);
```

### Mobile optimization checklist for lower-end devices

- **Limit pixel ratio**: `Math.min(window.devicePixelRatio, 2)` prevents 3x rendering
- **Reduce DOM elements**: Target <2,500 (Google recommends ≤1,400)
- **Test with CPU throttling**: Chrome DevTools 6x slowdown simulates low-end Android
- **Target 30fps fallback**: Many mobile games don't hit 60fps
- **Pause when hidden**: `document.hidden` should pause render loops and animations
- **Respect reduced motion**: `window.matchMedia('(prefers-reduced-motion: reduce)')`

---

## Technical standards prevent debt accumulation in growing teams

### Enable TypeScript strict mode with additional strictness flags

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Testing strategy: unit for logic, integration for hooks, E2E for flows

**Unit tests** for pure game logic (damage calculations, collision detection):

```typescript
describe('calculateDamage', () => {
  it('reduces damage based on armor', () => {
    expect(calculateDamage({ baseDamage: 100, armor: 50 })).toBe(50);
  });
});
```

**Integration tests** for custom hooks with `@testing-library/react`:

```typescript
describe('useGameState', () => {
  it('updates score correctly', () => {
    const { result } = renderHook(() => useGameState());
    act(() => { result.current.addScore(100); });
    expect(result.current.score).toBe(100);
  });
});
```

**E2E tests** for complete game flows with Playwright:

```typescript
test('complete game session', async ({ page }) => {
  await page.goto('/game');
  await page.click('button:text("Start Game")');
  await page.keyboard.press('ArrowRight');
  const score = page.locator('[data-testid="score"]');
  await expect(score).not.toHaveText('0');
});
```

### Track technical debt with prioritization

Use the **CD3 framework** (Cost of Delay ÷ Duration):

```
Priority = (Business Impact + Technical Risk + Team Friction) / Estimated Days
```

Allocate **15-20% of sprint capacity** to debt reduction. Track metrics:
- **Cyclomatic Complexity**: Target <10 per function
- **Code Duplication**: Target <3%
- **Test Coverage**: Target >80%

### Document architectural decisions with ADRs

```markdown
# ADR-001: Use Zustand for Game State Management

## Status
Accepted

## Decision Outcome
Chosen option: **Zustand**, because:
- Minimal boilerplate compared to Redux
- ~1KB bundle size
- Works outside React components (useful for game loops)
- Excellent TypeScript support
```

---

## Conclusion: key implementation priorities

For immediate impact on your educational math games application:

1. **Install three-minifier today**—it's a single configuration change that can cut your Three.js bundle by 39%
2. **Refactor Three.js imports** to use `three/src/` direct imports, enabling further tree-shaking
3. **Lazy load all game modules** containing Three.js with React.lazy() and proper Suspense boundaries
4. **Split large components** (500+ lines) using the hook extraction pattern—one hook per concern
5. **Implement Context splitting** if you're seeing unnecessary re-renders in game UI

The patterns in this report balance clean architecture with game-specific requirements. SOLID principles enable testability and tree-shaking; bundle optimization reduces initial load times; feature-based architecture supports team scaling; and performance patterns ensure smooth gameplay on lower-end devices. Start with bundle optimization (highest immediate ROI), then progressively adopt architectural patterns as you refactor existing code.