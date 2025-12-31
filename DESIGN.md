# Math Gymnasium - Game Design

This document contains the game designs, rules, and mathematical foundations for all games in the Math Gymnasium.

---

## 1. Magic Graph

**Concept:** Fill nodes in a graph with numbers so that every line sums to a target value $S$.

**Target Audience:** Primary to Middle school students

**Math Focus:** Addition, constraint satisfaction, algebraic deduction

### Rules
1. Each node must contain exactly one number
2. Numbers cannot be reused (each number used once)
3. Every line (sequence of connected nodes) must sum to the target $S$
4. Some nodes are pre-filled as hints

### Data Structure

```typescript
interface GraphNode {
  id: string;
  position: { x: number; y: number };
  value: number | null;
  isFixed: boolean;  // pre-filled hint nodes
}

interface Line {
  id: string;
  nodeIds: string[];  // nodes that must sum to target
}

interface PuzzleConfig {
  id: string;
  name: string;
  nodes: GraphNode[];
  lines: Line[];
  targetSum: number;
  availableNumbers: number[];
  difficulty: 'easy' | 'medium' | 'hard';
}
```

### Solver Algorithm (Recursive Backtracking)

**Input:** Topology (Lines), Available Numbers (Set $D$), Target Sum ($S$)

**Logic:**
1. Select next empty node
2. Try number $x \in D$
3. **Constraint Check:**
   - Are all placed numbers unique?
   - Does any complete line $\neq S$?
   - Does any partial line already exceed $S$?
4. If valid, recurse to next node
5. Backtrack if stuck

### Puzzle Generator

1. **Solve:** Run solver on empty shape to get valid "Answer Key"
2. **Mask:** Randomly hide $N$ numbers based on difficulty
3. **Validate:** Run solver on masked puzzle
   - If Solutions = 1 → Valid puzzle
   - If Solutions > 1 → Ambiguous, retry with different mask

### Visual Feedback (Traffic Light System)

| State | Color | Meaning |
|-------|-------|---------|
| Incomplete | Grey | Line not fully filled |
| Correct | Green | Line complete, Sum = $S$ |
| Incorrect | Red | Line complete, Sum ≠ $S$ |
| Overflow | Yellow | Partial line already > $S$ |

### Hint System Design

**Type 1: The Auditor (Syntax Checker)**
- Check current board against constraints
- Highlight specific line where math is impossible

**Type 2: The Starter (Logical Deduction)**
- Find empty node with lowest entropy (fewest valid possibilities)
- Output: "Look at this circle. Only one number fits here."

**Type 3: The Algebraist (Advanced)**
- For hidden-$S$ puzzles, derive hints from topology equations
- Formula: $N \times S = \sum(\text{All Numbers}) + \sum(\text{Intersection Values})$

### Difficulty Tiers

| Level | Shapes | Target Sum | Logic Required |
|-------|--------|------------|----------------|
| Novice | Triangles, Lines | Visible | Simple addition |
| Apprentice | Squares, Stars | Visible | Look-ahead |
| Master | Complex shapes | Hidden | Algebraic deduction |
| Grandmaster | Arbitrary graphs | Minimize/Maximize | Optimization |

---

## 2. Sequence Sprinter

**Concept:** A "Race to N" strategy game against an AI opponent.

**Target Audience:** Primary to Middle school students

**Math Focus:** Mental arithmetic, game theory (Minimax), combinatorial logic

### Rules
1. Players take turns choosing a step size from a shared pool
2. Each number can only be used once (removed after use)
3. Add chosen step to current position
4. **Win conditions:**
   - Reach target exactly, OR
   - Opponent has no valid moves (would overshoot)

### Data Structure

```typescript
interface SequenceState {
  target: number;              // e.g., 20
  currentPosition: number;     // e.g., 12
  availableSteps: number[];    // e.g., [1, 4, 5] (2,3 used)
  turn: 'player' | 'ai';
  history: Array<{ actor: string; step: number; position: number }>;
  winner: 'player' | 'ai' | null;
  gameOver: boolean;
}
```

### Move Validation
1. Is `step` in `availableSteps`?
2. Does `currentPosition + step <= target`?
3. If valid: update position, remove step from pool, switch turn

### AI Algorithm (Minimax with Memoization)

Since the game state is finite (limited step pool), we can solve perfectly.

```
function minimax(state, isMaximizing):
  if terminal: return score (+100 AI win, -100 player win)

  for each valid move:
    nextState = applyMove(state, move)
    score = minimax(nextState, !isMaximizing)
    track best score

  return best score with corresponding move
```

**Difficulty Levels:**
- Easy: Random valid moves
- Medium: 50% optimal, 50% random
- Hard: Always optimal (pure Minimax)

### Sequence Types

The step pool can be generated from various mathematical sequences:

| Type | Formula | Example |
|------|---------|---------|
| Arithmetic | $a_n = a_1 + (n-1)d$ | 1, 2, 3, 4, 5 |
| Geometric | $a_n = a_1 \cdot r^{n-1}$ | 1, 2, 4, 8, 16 |
| Fibonacci | $F_n = F_{n-1} + F_{n-2}$ | 1, 1, 2, 3, 5, 8 |
| Prime | Prime numbers | 2, 3, 5, 7, 11 |
| Square | $n^2$ | 1, 4, 9, 16, 25 |
| Triangular | $\frac{n(n+1)}{2}$ | 1, 3, 6, 10, 15 |
| Powers of 3 | $3^{n-1}$ | 1, 3, 9, 27, 81 |

### Teacher Mode ✅

When enabled, provides educational feedback on player moves:

```typescript
interface MoveAnalysis {
  wasOptimal: boolean;      // Was this the best move?
  optimalMove: number;      // What should have been played
  aiCounterMove: number;    // AI's response
  explanation: string;      // Educational feedback
}
```

Example feedback: "Be careful! If you take 5, I can take 2 and win."

---

## 3. Shape Architect

**Concept:** A voxel-based packing puzzle. Fill a "ghost shape" target zone with inventory pieces.

**Target Audience:** Primary to Middle school students

**Math Focus:** Spatial reasoning, area/volume conservation, geometric transformation

### Rules
1. Place pieces from inventory onto the target zone
2. Pieces can be rotated 90° increments
3. Pieces cannot overlap
4. Pieces must fit entirely within target zone
5. **Win condition:** All target cells filled

### Data Structure

**Grid System (3D matrix):**
- `0`: Empty space (outside target)
- `1`: Target zone (must be filled)
- `2`: Occupied (piece placed)

```typescript
interface Position3D {
  x: number;
  y: number;
  z: number;
}

interface Piece {
  id: string;
  shape: string;  // e.g., "L-tetromino"
  layout: Position3D[];  // local coordinates
  color: string;
}

interface LevelConfig {
  id: string;
  name: string;
  gridSize: [number, number, number];
  targetVoxels: Position3D[];
  pieces: Piece[];
}
```

### Collision Algorithm

When placing a piece at position $(px, py, pz)$ with rotation $r$:

1. **Rotate** piece layout by $r$ degrees (around Z-axis for 2D)
2. **Translate** to world coordinates: `worldPos = pieceLocal + dropPosition`
3. **Validate** each cube:
   - Is it within grid bounds?
   - Is grid cell = 1 (target zone)?
   - If cell = 0 or 2 → Invalid placement
4. **If valid:** Set all cells to 2, remove piece from inventory

### Rotation Formula (2D, 90° increments)

```
rotate90(x, y) → (-y, x)
```

Normalize result to positive coordinates after rotation.

### Level Config Example

```json
{
  "id": "level_01",
  "gridSize": [5, 5, 1],
  "targetVoxels": [
    {"x": 0, "y": 0, "z": 0},
    {"x": 1, "y": 0, "z": 0},
    {"x": 0, "y": 1, "z": 0}
  ],
  "pieces": [
    { "id": "p1", "shape": "domino", "layout": [{"x":0,"y":0,"z":0}, {"x":1,"y":0,"z":0}] },
    { "id": "p2", "shape": "single", "layout": [{"x":0,"y":0,"z":0}] }
  ]
}
```

### Standard Pieces

**Tetrominoes (4 cells each):**
- I, O, T, S, Z, J, L (7 pieces)

**Pentominoes (5 cells each):**
- I, L, N, T, V, X, Y, Z, F, P, U, W (12 pieces, used in hard/expert levels)
