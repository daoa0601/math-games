# Documentation vs Implementation Discrepancies

## Magic Graph (English & Vietnamese)

### Logic vs Documentation
- **Difficulty Levels**:
    - **Issue**: Documentation lists Easy, Medium, Hard, Master, and Grandmaster as progressively complex levels with distinct puzzles.
    - **Found**: Code (`puzzles.ts`) only generates random puzzles for `easy`, `medium`, and `hard`.
    - **Found**: Master and Grandmaster modes reuse `hard` difficulty puzzles in the code, simply applying UI overlays (hidden target sum for Master, optimization goal for Grandmaster). This is a minor discrepancy but worth noting that they don't have unique geometric structures as implied.

- **Puzzle Shapes**:
    - **Issue**: Documentation mentions "M-shapes, stars, and diamonds" as elaborate shapes for higher levels.
    - **Found**: `mShapePuzzle` and `starPuzzle` are defined in code but explicitly excluded from active `puzzleTemplates` due to structural issues.
    - **Impact**: Players will never encounter M-shapes or Stars, contradicting the documentation.

- **Master/Grandmaster Features**:
    - **Status**: The unique gameplay mechanics (Hidden Target for Master, Optimization for Grandmaster) *are* correctly implemented in `MagicGraphGame.tsx`, even though they reuse Hard puzzle geometries.

## Shape Architect (English & Vietnamese)

### Level Count
- **Issue**: The documentation header for "Preset Levels" states "(18 Total)" (or "(Tổng 18)").
- **Found**: The documentation list actually details 21 levels (13 in 2D, 8 in 3D). The code (`presets.ts`) also contains these 21 levels.
- **Fix Required**: Update documentation header to count 21 levels.

### Random Generation Limitation
- **Issue**: Documentation implies a broad "build anything" scope and progressive difficulty.
- **Found**: The `generateRandomLevel` function in `presets.ts` *only* supports 2D Tetrominoes.
- **Impact**: There is no "infinite play" or random generation for Pentominoes (Hard 2D) or Polycubes (all 3D levels). The "Random" mode is significantly more limited than the Preset mode.

## Sequence Race
- **Status**: Verified. Documentation matches implementation perfectly.
    - 11 Presets match.
    - Formulas for all 7 sequence types are correct.
    - AI depth limits and first-mover advantage settings are consistent.

## Recommendations for Fixes

1.  **Update Magic Graph Docs**: Remove references to "M-shapes" and "stars" until they are fixed and enabled in the code. Clarify that Master/Grandmaster are "Challenge Modes" played on Hard puzzles.
2.  **Update Shape Architect Docs**: Correct the level count from 18 to 21. Explicitly note that Random Freeplay is currently limited to 2D Tetrominoes.
3.  **Future Feature**: Implement random generation for 3D Polycubes in Shape Architect to match the implied scope of the game.
