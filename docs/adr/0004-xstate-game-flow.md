# ADR-0004: XState for Game Flow Management

## Status

Accepted

## Date

2026-01-01

## Context

Each game has a common flow: idle → playing → {won, lost, timeUp} → restart. Currently, this is managed with multiple useState calls and conditional logic:

```typescript
const [isPlaying, setIsPlaying] = useState(false);
const [isPaused, setIsPaused] = useState(false);
const [hasWon, setHasWon] = useState(false);
const [hasLost, setHasLost] = useState(false);

// Bug-prone: can accidentally have isPlaying && hasWon both true
```

**Problems**:
1. **Impossible states**: Nothing prevents `isPlaying && hasWon` being both true
2. **Scattered logic**: State transitions spread across multiple handlers
3. **Hard to visualize**: The complete flow is implicit, not explicit
4. **Inconsistent**: Each game reimplements the same patterns differently

## Decision

Use XState v5 to define a finite state machine for game flow:

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  ┌─────┐    START    ┌─────────┐                 │
│  │idle │────────────▶│ playing │                 │
│  └─────┘             └────┬────┘                 │
│     ▲                     │                      │
│     │                     ├──── WIN ────▶ won    │
│     │                     ├──── LOSE ───▶ lost   │
│     │                     ├──── TIMEOUT ▶ timeUp │
│     │                     └──── PAUSE ──▶ paused │
│     │                                      │     │
│     │◀────────────── RESTART ──────────────┘     │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Machine Definition

```typescript
const gameMachine = setup({
  types: {
    context: {} as GameContext,
    events: {} as GameEvent,
  },
}).createMachine({
  id: 'game',
  initial: 'idle',
  context: { attempts: 0, timeElapsed: 0, score: 0 },
  states: {
    idle: { on: { START: 'playing' } },
    playing: {
      on: {
        PAUSE: 'paused',
        WIN: 'won',
        LOSE: 'lost',
        TIMEOUT: 'timeUp',
      },
    },
    paused: { on: { RESUME: 'playing', RESTART: 'idle' } },
    won: { on: { RESTART: 'idle', NEXT_LEVEL: 'idle' } },
    lost: { on: { RESTART: 'idle' } },
    timeUp: { on: { RESTART: 'idle' } },
  },
});
```

### Hook Wrapper

The `useGameMachine()` hook provides a clean API:

```typescript
const {
  isPlaying,
  isPaused,
  isComplete,  // won || lost || timeUp
  context,
  start,
  pause,
  win,
  restart,
} = useGameMachine();
```

## Consequences

### Positive

- **Impossible states prevented**: Can't be in multiple states at once
- **Explicit transitions**: All valid state changes are visible in one place
- **Easy visualization**: Can use XState visualizer for debugging
- **Type-safe events**: TypeScript enforces valid event types
- **Reusable**: Same machine works for all three games
- **Testable**: Pure state logic is easy to unit test

### Negative

- **New dependency**: XState adds ~15KB gzipped to bundle
- **Learning curve**: Developers need to understand finite state machines
- **Migration effort**: Existing games need refactoring to adopt

### Neutral

- Machine is generic; games can extend or customize as needed
- Can coexist with useState for game-specific state (board, pieces, etc.)

## Implementation

Files created:
- `src/shared/machines/gameMachine.ts` - The state machine
- `src/shared/machines/useGameMachine.ts` - React hook wrapper
- `src/shared/machines/index.ts` - Barrel export

## Usage

```typescript
function MyGame() {
  const game = useGameMachine();
  const [board, setBoard] = useState(createBoard());

  // Start game on mount
  useEffect(() => {
    game.start();
  }, []);

  // Handle timer
  useEffect(() => {
    if (game.isPlaying && timeLeft <= 0) {
      game.timeout();
    }
  }, [timeLeft, game.isPlaying]);

  // Check win condition
  const handleMove = (move: Move) => {
    game.incrementAttempts();
    const newBoard = applyMove(board, move);
    setBoard(newBoard);

    if (checkWin(newBoard)) {
      game.win({ score: calculateScore() });
    }
  };

  if (game.isComplete) {
    return <GameOverOverlay won={game.isWon} onRestart={game.restart} />;
  }

  return <GameBoard board={board} onMove={handleMove} />;
}
```

## Future Work

- Create game-specific machine extensions (e.g., SequenceRaceMachine with turn management)
- Add XState DevTools integration for debugging
- Consider replacing game-specific useState with machine context
