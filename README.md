# Math Gymnasium

A collection of interactive math games for primary to middle school students, built with React and TypeScript.

## Games

### Magic Graph
Fill nodes in a graph so that every line sums to the target value. Features:
- Multiple puzzle shapes (Triangle, Square, Star, H-A-N-O-I letters, M-Diamond, Hexagon)
- Four difficulty levels (Easy, Medium, Hard, Master)
- Master mode: Hidden target sum that players must deduce
- Advanced hints: Auditor, Starter, Algebraist
- 60-second timer challenge
- Undo/redo with keyboard shortcuts (Ctrl+Z/Y)
- 🎉 Confetti celebration on win

### Sequence Sprinter
A "Race to N" strategy game against an AI opponent. Features:
- **7 sequence types**: Arithmetic, Geometric, Fibonacci, Prime, Square, Triangular, Powers of 3
- Minimax AI with three difficulty levels
- Teacher mode hints showing optimal moves
- 🎉 Confetti celebration on player win

### Shape Architect
A voxel-based geometry puzzle. Fill a "ghost shape" target zone by placing inventory pieces. Features:
- **7 Tetrominoes** + **12 Pentominoes** (full sets)
- Drag-and-drop or click-to-place
- Piece rotation (90-degree increments)
- ↩️ Undo last piece placement
- 🎉 Confetti celebration on completion

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173 to play.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests with Vitest |
| `npm run test:coverage` | Run tests with coverage report |

## Tech Stack

- React 19 + TypeScript
- Vite 7
- Vitest (testing)
- react-router-dom (navigation)
- @dnd-kit (drag-and-drop)
- react-i18next (English/Vietnamese)
- canvas-confetti (win animations)
- howler.js (sound effects - placeholder ready)

## Internationalization

The app supports English and Vietnamese. Switch languages using the 🌐 button in the header.
