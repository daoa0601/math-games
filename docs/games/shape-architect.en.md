# ShapeArchitect: Building Workshop

**Tagline:** Build 3D shapes with blocks on a craftsman's workbench

**Target Age:** Grades 1-8 / Ages 6-14

**Session Time:** 5-20 minutes per puzzle

---

## Game Overview

ShapeArchitect is an educational puzzle game that challenges students to fill target shapes using geometric pieces in both 2D and 3D space. Players drag colorful blocks onto a wooden workbench grid, rotating them to find the perfect fit. The game develops spatial reasoning, geometric intuition, and problem-solving skills through progressively challenging levels.

### Core Learning Goals

1. **Spatial Reasoning:** Develop the ability to mentally rotate and manipulate 3D objects
2. **Volume Conservation:** Understand that pieces can be rearranged without changing total volume
3. **Geometric Transformations:** Practice rotation in 2D (Z-axis) and 3D (X, Y, Z axes)
4. **Strategic Planning:** Learn to work backward from the goal and manage limited resources

### Visual Theme: Building Workshop

The game uses a **woodworking workshop aesthetic** to make geometric concepts tangible:

- **Workbench Background:** Wood grain texture creates a craftsman's workspace
- **Blueprint Grid:** Target cells display a blueprint pattern with white lines on blue
- **Colored Blocks:** Vibrant tetromino and polycube pieces in distinct colors
- **Snap Animation:** Pieces "wobble" into place with a satisfying snap when placed
- **Dust Burst:** Successful placement triggers particle effects with expanding rings

All animations use GPU-accelerated CSS (`transform`, `opacity`, `filter`) and respect `prefers-reduced-motion` for accessibility.

---

## Mathematical Foundations

### Core Concepts

#### 1. Spatial Geometry

ShapeArchitect operates in a **3D coordinate system** even for 2D puzzles:

- **X-axis:** Horizontal (left-right)
- **Y-axis:** Vertical (up-down)
- **Z-axis:** Depth (forward-backward)

2D levels use only the XY plane (z=0), while 3D levels utilize all three dimensions.

#### 2. 3D Rotation System

Pieces rotate using **Euler angles** with 90-degree increments:

| Axis | Name | Transformation | Effect |
|------|------|----------------|--------|
| X | Pitch | `(x, y, z) → (x, -z, y)` | Tilts forward/backward |
| Y | Yaw | `(x, y, z) → (z, y, -x)` | Spins left/right |
| Z | Roll | `(x, y, z) → (-y, x, z)` | Rotates on floor plane |

**Rotation Count:**
- **2D levels:** 4 unique orientations (Z-axis only)
- **3D levels:** 24 unique orientations (all three axes)

The 24 orientations come from the fact that a cube has:
- 6 faces that can point upward
- 4 rotational positions for each face
- Total: 6 × 4 = 24 unique orientations

#### 3. Volume Conservation

A fundamental principle: **Total piece volume must equal target volume** for a puzzle to be solvable.

If you have 4 tetromino pieces (4 cells each), the target must contain exactly 16 cells:
```
Piece Volume = 4 pieces × 4 cells = 16 cells
Target Volume = 16 cells
Solution possible: YES
```

If volumes don't match, the puzzle is unsolvable:
```
Piece Volume = 20 cells
Target Volume = 16 cells
Solution possible: NO (4 cells won't fit)
```

#### 4. Polyominoes and Polycubes

ShapeArchitect uses classic tiling pieces from mathematics:

**Tetrominoes (4 cells):** The 7 shapes from Tetris (I, O, T, S, Z, J, L)

**Pentominoes (5 cells):** The 12 unique shapes formed by connecting 5 squares (F, I, L, N, P, T, U, V, W, X, Y, Z)

**Polycubes (3D):** Extensions into three dimensions (Corner3D, Tower, L3D, Cube2x2x2, etc.)

These shapes have been studied by mathematicians for centuries and appear in recreational mathematics, computer science, and puzzle design.

### Curriculum Alignment

#### US Common Core Standards

| Standard | Description | How ShapeArchitect Addresses It |
|----------|-------------|--------------------------------|
| 1.G.A.2 | Compose 2D shapes to create composite shapes | Building rectangles and complex shapes from tetrominoes |
| 3.MD.C.5 | Recognize area as additive | Understanding that total piece area equals target area |
| 5.MD.C.3 | Understand volume as packing unit cubes | 3D levels require filling space with unit cubes |

#### Vietnamese Curriculum (SGK)

| Grade | Topic | Connection |
|-------|-------|------------|
| Lớp 2 | Hình học phẳng (Flat Geometry) | 2D tetrominoes and pentominoes |
| Lớp 3 | Diện tích (Area) | Area conservation in 2D levels |
| Lớp 4-5 | Hình học không gian (Spatial Geometry) | 3D polycubes and volume |

### Learning Objectives by Grade Level

**Grades 1-3 (Ages 6-9):**
- Recognize and name basic shapes (square, rectangle, L-shape)
- Understand that shapes can be rotated and still be the same
- Develop spatial awareness through manipulation

**Grades 4-6 (Ages 9-12):**
- Calculate area by counting unit squares
- Understand that rotations preserve area/volume
- Practice systematic problem-solving strategies

**Grades 7-8 (Ages 12-14):**
- Apply geometric transformations (rotations in 3D space)
- Use algebraic thinking to verify volume conservation
- Develop backtracking and constraint-satisfaction strategies

---

## Game Mechanics

### Objective

Fill the **target shape** (blue blueprint cells) using all provided **pieces** exactly once with no gaps or overlaps.

### Rules

1. **Drag pieces** from the piece tray onto the grid
2. **Rotate pieces** using X/Y/Z rotation buttons (3D levels) or just Z (2D levels)
3. **No overlapping:** Pieces cannot be placed on top of each other
4. **Target coverage:** At least one cell of each piece must land on a target (blue) cell
5. **Complete filling:** Win when all target cells are covered exactly

### Visual Feedback

| State | Visual | Description |
|-------|--------|-------------|
| Target cells | Blue with blueprint pattern | Cells you need to fill |
| Valid ghost | Blue semi-transparent | Preview of where piece will land |
| Invalid ghost | Red semi-transparent | Piece cannot be placed here |
| Placed piece | Solid color matching piece | Piece successfully placed |
| Snap animation | Wobble + dust burst | Satisfying feedback on placement |

### Controls

**Mouse/Touch:**
- **Drag:** Click and drag piece from tray to grid
- **Rotate:** Click X/Y/Z buttons to rotate current piece
- **Undo:** Click undo button to remove last piece
- **Reset:** Click reset button to start level over

**Keyboard (accessibility):**
- **Tab:** Navigate between pieces and buttons
- **Enter/Space:** Select piece or activate button
- **Arrow keys:** Move ghost preview on grid
- **R:** Rotate around Z-axis

### Snap-to-Nearest Feature

When you drag a piece near a valid position, the game automatically **snaps** it to the closest valid placement within 2 cells. This helps players avoid pixel-perfect positioning frustration while maintaining challenge.

Example: You drag an I-block close to row 3 but slightly off. The game detects a valid position at row 3 and automatically adjusts the piece to snap there.

---

## Piece Reference

### Tetrominoes (7 Classic Pieces)

Each tetromino consists of **4 cells** arranged in a unique pattern. All are based on the famous Tetris game pieces.

| Name | ASCII Visualization | Description | Cells |
|------|---------------------|-------------|-------|
| **I-Block** | `████` | Four in a straight line | 4 |
| **O-Block** | `██`<br>`██` | 2×2 square | 4 |
| **T-Block** | `███`<br>` █` | T-shape with center below | 4 |
| **S-Block** | ` ██`<br>`██` | S-zigzag (offset right) | 4 |
| **Z-Block** | `██`<br>` ██` | Z-zigzag (offset left) | 4 |
| **J-Block** | `█`<br>`███` | L pointing left | 4 |
| **L-Block** | `  █`<br>`███` | L pointing right | 4 |

**Rotation Example (I-Block):**
```
0°:  ████        90°:  █
                        █
                        █
                        █
```

### Pentominoes (12 Unique Pieces)

Each pentomino consists of **5 cells**. These are used in harder 2D levels.

| Name | Shape Pattern | Cells |
|------|---------------|-------|
| **F-Pento** | ` ██`<br>`██`<br>` █` | 5 |
| **I-Pento** | `█`<br>`█`<br>`█`<br>`█`<br>`█` | 5 |
| **L-Pento** | `█`<br>`█`<br>`█`<br>`██` | 5 |
| **N-Pento** | `█`<br>`██`<br>` █`<br>` █` | 5 |
| **P-Pento** | `██`<br>`██`<br>`█` | 5 |
| **T-Pento** | `███`<br>` █`<br>` █` | 5 |
| **U-Pento** | `█ █`<br>`███` | 5 |
| **V-Pento** | `█`<br>`█`<br>`███` | 5 |
| **W-Pento** | `█`<br>`██`<br>` ██` | 5 |
| **X-Pento** | ` █`<br>`███`<br>` █` | 5 |
| **Y-Pento** | ` █`<br>`██`<br>` █`<br>` █` | 5 |
| **Z-Pento** | `██`<br>` █`<br>` ██` | 5 |

### 3D Polycubes

These pieces extend into the third dimension (z > 0). Used exclusively in 3D levels.

| Name | Description | Cells | Type |
|------|-------------|-------|------|
| **Cube2x2** | 2×2 flat block (z=0 only) | 4 | Tetracube |
| **Cube2x2x2** | 2×2×2 solid cube | 8 | Octacube |
| **Corner3D** | Three-way corner piece | 4 | Tetracube |
| **Tower4** | Vertical stack of 4 cubes | 4 | Tetracube |
| **L3D** | L-shape extending vertically | 4 | Tetracube |
| **T3D** | T-shape with vertical extension | 4 | Tetracube |
| **Step3D** | Staircase in 3D | 4 | Tetracube |
| **Plus3D** | Plus sign in 3D (cross) | 5 | Pentacube |
| **Stairs3D** | Three-step staircase | 5 | Pentacube |
| **Hook3D** | L-shape with perpendicular extension | 5 | Pentacube |
| **Bracket3D** | U-shaped bracket in 3D | 6 | Hexacube |

**3D Rotation Example (Corner3D):**
```
Original (0°, 0°, 0°):    After Y-rotation 90° (0°, 90°, 0°):
  z=0: ██                   z=0:  █
       █                          ██
  z=1: █                    z=1: █
```

---

## Difficulty Progression

### 2D Levels

| Difficulty | Grid Size | Pieces | Piece Types | Target Size | Rotations |
|------------|-----------|--------|-------------|-------------|-----------|
| **Easy** | 6×6 to 8×5 | 4-6 | O-blocks, I-blocks | 16-24 cells | Z only (4) |
| **Medium** | 8×8 | 5-6 | Mixed tetrominoes | 20 cells | Z only (4) |
| **Hard** | 8×5 to 11×7 | 6-8 | Tetrominoes + pentominoes | 24-32 cells | Z only (4) |

**Progression Strategy (2D):**
- **Easy:** Simple shapes (squares, rectangles) with only O-blocks or I-blocks
- **Medium:** Irregular shapes (plus, H, staircase) with mixed tetrominoes
- **Hard:** Complex shapes requiring all 7 tetrominoes or pentominoes

### 3D Levels

| Difficulty | Grid Size | Pieces | Piece Types | Target Size | Rotations |
|------------|-----------|--------|-------------|-------------|-----------|
| **Easy** | 4×4×3 | 2-3 | Cube2x2 blocks | 8-12 cells | X,Y,Z (24) |
| **Medium** | 4×4×5 to 6×6×3 | 4 | Cube2x2 or Cube2x2x2 | 16 cells | X,Y,Z (24) |
| **Hard** | 4×4×7 to 7×6×3 | 3-6 | Mixed polycubes | 24 cells | X,Y,Z (24) |

**Progression Strategy (3D):**
- **Easy:** Simple cubes and towers with uniform pieces
- **Medium:** Multi-layer structures (platforms, double cubes)
- **Hard:** Complex 3D shapes requiring strategic placement

---

## Preset Levels (18 Total)

### 2D Easy Levels (4 levels)

#### 1. 4×4 Square
- **Target:** 4×4 square (16 cells)
- **Pieces:** 4 O-blocks (yellow, green, blue, pink)
- **Grid:** 6×6
- **Learning Focus:** Basic shape filling with uniform pieces

#### 2. Long Strip
- **Target:** 8×2 rectangle (16 cells)
- **Pieces:** 4 I-blocks (cyan, green, orange, purple)
- **Grid:** 8×5
- **Learning Focus:** Rotation basics (horizontal ↔ vertical)

#### 3. T-Formation
- **Target:** T-shape (16 cells)
- **Pieces:** 4 O-blocks (cyan, purple, pink, orange)
- **Grid:** 7×7
- **Learning Focus:** Fitting pieces into non-rectangular shapes

#### 4. Rectangle
- **Target:** 6×4 rectangle (24 cells)
- **Pieces:** 6 O-blocks (various colors)
- **Grid:** 8×5
- **Learning Focus:** Scaling up piece count

### 2D Medium Levels (3 levels)

#### 5. Plus Sign
- **Target:** Plus shape (20 cells)
- **Pieces:** 5 O-blocks (yellow, green, cyan, purple, pink)
- **Grid:** 8×8
- **Learning Focus:** Symmetrical shapes with central cross

#### 6. Staircase
- **Target:** Stair pattern (20 cells)
- **Pieces:** 5 O-blocks (yellow, green, blue, orange, pink)
- **Grid:** 8×5
- **Learning Focus:** Offset patterns requiring strategic placement

#### 7. H-Shape
- **Target:** H pattern (20 cells)
- **Pieces:** 4 O-blocks + 1 I-block (mixed colors)
- **Grid:** 8×6
- **Learning Focus:** Combining different piece types

### 2D Hard Levels (6 levels)

#### 8. Tetris Master
- **Target:** 6×4 rectangle (24 cells)
- **Pieces:** 2 I-blocks + 4 O-blocks (mixed)
- **Grid:** 8×5
- **Learning Focus:** Efficient packing with mixed pieces

#### 9. Big Rectangle
- **Target:** 8×4 rectangle (32 cells)
- **Pieces:** 8 O-blocks (8 different colors)
- **Grid:** 10×5
- **Learning Focus:** Large-scale organization

#### 10. Long Board
- **Target:** 8×4 rectangle (32 cells)
- **Pieces:** 8 I-blocks (8 different colors)
- **Grid:** 10×5
- **Learning Focus:** Mastering rotation patterns

#### 11. Ultimate
- **Target:** 8×4 rectangle (32 cells)
- **Pieces:** 2 I-blocks + 2 O-blocks + 2 T-blocks + 1 L-block + 1 J-block
- **Grid:** 11×7
- **Learning Focus:** All 7 tetromino types working together

#### 12. Pentomino Rectangle
- **Target:** 5×4 rectangle (20 cells)
- **Pieces:** 4 pentominoes (I-Pento, L-Pento, V-Pento, P-Pento)
- **Grid:** 8×6
- **Learning Focus:** Introduction to pentominoes

#### 13. Wide Grid
- **Target:** 8×3 rectangle (24 cells)
- **Pieces:** 6 I-blocks (6 different colors)
- **Grid:** 9×5
- **Learning Focus:** Thin horizontal packing

### 3D Easy Levels (2 levels)

#### 14. Cube Stack
- **Target:** 2×2×2 cube (8 cells)
- **Pieces:** 2 Cube2x2 blocks (orange, green)
- **Grid:** 4×4×3
- **Learning Focus:** First 3D puzzle with simple vertical stacking

#### 15. Mini Tower
- **Target:** 2×2×3 tower (12 cells)
- **Pieces:** 3 Cube2x2 blocks (pink, blue, yellow)
- **Grid:** 4×5×4
- **Learning Focus:** Building vertical structures

### 3D Medium Levels (3 levels)

#### 16. Cube Tower
- **Target:** 2×2×4 tower (16 cells)
- **Pieces:** 4 Cube2x2 blocks (orange, green, blue, purple)
- **Grid:** 4×4×5
- **Learning Focus:** Taller vertical structures

#### 17. Double Cube
- **Target:** Two 2×2×2 cubes side-by-side (16 cells)
- **Pieces:** 2 Cube2x2x2 blocks (pink, blue)
- **Grid:** 5×4×3
- **Learning Focus:** Horizontal 3D arrangement

#### 18. Flat Platform
- **Target:** 4×4×1 platform (16 cells)
- **Pieces:** 4 Cube2x2 blocks (orange, green, blue, pink)
- **Grid:** 6×6×3
- **Learning Focus:** 2D thinking in 3D space

### 3D Hard Levels (3 levels)

#### 19. Tall Tower
- **Target:** 2×2×6 tower (24 cells)
- **Pieces:** 6 Cube2x2 blocks (orange, green, blue, purple, pink, brown)
- **Grid:** 4×4×7
- **Learning Focus:** Maximum vertical stacking

#### 20. Triple Stack
- **Target:** Three 2×2×2 cubes in L-formation (24 cells)
- **Pieces:** 3 Cube2x2x2 blocks (pink, blue, orange)
- **Grid:** 5×5×4
- **Learning Focus:** Complex 3D spatial arrangement

#### 21. Wide Platform
- **Target:** 6×4×1 platform (24 cells)
- **Pieces:** 6 Cube2x2 blocks (orange, green, blue, purple, pink, brown)
- **Grid:** 7×6×3
- **Learning Focus:** Large-scale 2D packing in 3D space

---

## Solver Algorithm (Teacher-Friendly Explanation)

ShapeArchitect includes a **backtracking solver** that can find solutions to puzzles programmatically. This helps validate that levels are solvable before presenting them to students.

### Algorithm Overview: Tetris Analogy

Think of the solver as an ultra-fast Tetris player who can:

1. **See the entire grid** at once (not just falling pieces)
2. **Try every possible position** for every piece
3. **Undo mistakes instantly** and try a different approach
4. **Stop as soon as it finds a solution** (or proves impossible)

### Step-by-Step Process

#### Step 0: Volume Check (Fast Rejection)
```
Total piece volume = Sum of all piece cells
Target volume = Number of target cells

IF piece volume ≠ target volume:
    RETURN "Unsolvable" (pieces won't fit)
```

Example:
```
Pieces: 4 tetrominoes = 4 × 4 = 16 cells
Target: 4×4 square = 16 cells
✓ Volume matches, continue to Step 1
```

#### Step 1: Find First Empty Target Cell

Look at the target shape and find the first cell that hasn't been filled yet.

```
Grid scan order: Left-to-right, top-to-bottom, front-to-back
First empty target = (1, 2, 0) in XYZ coordinates
```

#### Step 2: Try Each Remaining Piece

For each piece that hasn't been placed yet:

```python
FOR each unused_piece IN remaining_pieces:
    # Step 3: Try all rotations
    FOR each rotation IN [0°, 90°, 180°, 270°]:  # 2D
        # Or 24 rotations for 3D levels

        # Step 4: Try all positions that cover the empty target
        FOR each position WHERE piece_covers_empty_target:

            # Step 5: Check if placement is valid
            IF can_place(piece, position, rotation):
                # Place it temporarily
                place_piece(piece, position, rotation)

                # Recurse: Try to fill the rest
                result = solve_recursively(grid, remaining_pieces)

                IF result == "Success":
                    RETURN "Success"

                # Backtrack: This didn't work, undo and try next
                remove_piece(piece, position)

    # If we get here, no placement worked for this piece
    # Try the next piece
```

#### Step 6: Backtrack if Stuck

If no piece can fill the current empty target cell, **backtrack**:
- Undo the last placement
- Try a different position/rotation for the previous piece
- Continue until finding a solution or exhausting all possibilities

#### Step 7: Timeout Protection

To prevent infinite searches on complex puzzles, the solver has a **5-second timeout**:
```
IF elapsed_time > 5000 milliseconds:
    RETURN "Timeout" (unable to solve in reasonable time)
```

### Optimization: Unique Rotations

The solver is smart about rotations. Some pieces look identical after certain rotations:

**O-block (2×2 square):**
```
0° rotation = 90° rotation = 180° rotation = 270° rotation
All look the same!
```

The solver detects these **duplicate orientations** and only tries each unique orientation once, significantly speeding up the search.

### Performance Characteristics

| Metric | Typical Value | Notes |
|--------|---------------|-------|
| Easy 2D (4 pieces) | <10ms | Nearly instant |
| Medium 2D (6 pieces) | 10-100ms | Quick solution |
| Hard 2D (8 pieces) | 100ms-1s | May explore thousands of states |
| 3D levels | 500ms-5s | 24 rotations increase complexity |

### Educational Use

Teachers can use the solver to:
1. **Validate custom levels** before assigning them
2. **Check if student solutions are optimal** (compare piece count)
3. **Demonstrate algorithmic thinking** (backtracking strategy)
4. **Discuss computational complexity** (why 3D is harder than 2D)

The solver implements a classic **constraint satisfaction** algorithm, the same type used in:
- Sudoku solvers
- Chess engines (move exploration)
- Scheduling software
- Route planning

---

## Educational Tips for Teachers

### Classroom Integration

#### Lesson Plan: Area and Volume Conservation (Grades 3-5)

**Objective:** Students will understand that shapes can be decomposed and rearranged without changing total area.

**Materials:**
- ShapeArchitect game (projected or individual devices)
- Physical tetromino blocks (optional)

**Activity Sequence:**

1. **Warm-up (5 min):** Play "4×4 Square" level as a class
   - Ask: "How many cells does each O-block cover?" (4)
   - Ask: "How many O-blocks do we need?" (4)
   - Calculate: 4 blocks × 4 cells = 16 total cells

2. **Guided Practice (10 min):** Students attempt "Long Strip" individually
   - Observe: Do students rotate the I-blocks?
   - Discuss: "Why did the horizontal pieces become vertical?"

3. **Challenge (15 min):** "Plus Sign" level
   - Question: "Can you calculate the target area without counting each cell?"
   - Extension: "Draw a different arrangement of 5 O-blocks on graph paper"

4. **Reflection (5 min):**
   - "What strategy did you use when you got stuck?"
   - "How is this like solving a jigsaw puzzle? How is it different?"

#### Discussion Prompts

**For Spatial Reasoning:**
- "Before rotating, can you predict what the piece will look like?"
- "How many different ways can you rotate this piece to make it fit?"
- "What would happen if we flipped the piece instead of rotating it?"

**For Volume Conservation:**
- "If I have 6 O-blocks, how many cells can I fill?" (24)
- "Can 4 pieces ever fill a 20-cell target? Why not?" (No, 4×4=16≠20)
- "What if I broke one O-block into 4 single cubes? Would it still work?" (Yes, volume preserved)

**For Problem-Solving:**
- "When you got stuck, what did you try differently?"
- "Did you start from the corners or the middle? Why?"
- "How is this puzzle like organizing books on a shelf?"

### Common Misconceptions

#### Misconception 1: "Rotation changes the size of the piece"

**Evidence:** Student tries to fit a 4-cell piece into a 3-cell gap after rotating

**Correction:** Use physical manipulatives to show that rotation only changes **orientation**, not **area**
- Count cells before rotation: 4
- Rotate the piece
- Count cells after rotation: Still 4

#### Misconception 2: "All pieces must start on the grid edges"

**Evidence:** Student only places pieces along the outer border

**Correction:** Show example where middle placement is necessary
- Demonstrate "Plus Sign" level where center must be filled first
- Encourage experimentation with interior placements

#### Misconception 3: "3D rotation is just spinning"

**Evidence:** Student only uses Z-axis rotation in 3D levels

**Correction:** Visual demonstration of three rotation axes
- X-axis (pitch): "Tipping a glass forward"
- Y-axis (yaw): "Turning your head left/right"
- Z-axis (roll): "Spinning a coin on a table"

#### Misconception 4: "There's only one correct solution"

**Evidence:** Student thinks their solution is "wrong" if it differs from a peer's

**Correction:** Celebrate multiple valid solutions
- Show two different solutions side-by-side
- Discuss: "Both filled all target cells using all pieces!"
- Extension: "Can you find a third solution?"

### Differentiation Strategies

#### For Struggling Learners:

1. **Start with Easy levels only** (uniform pieces like all O-blocks)
2. **Use physical manipulatives** alongside the digital game
3. **Provide partially completed puzzles** (teacher places first 2-3 pieces)
4. **Allow unlimited time** with practice mode (no stats tracking)
5. **Pair with a peer mentor** for collaborative solving

#### For Advanced Learners:

1. **Challenge: Solve using minimal rotations** (count rotation button clicks)
2. **Create custom levels** on graph paper for peers to solve
3. **Explore pentominoes** (12 unique pieces with 5 cells each)
4. **Research: Study the mathematics of polyominoes** (academic extension)
5. **Speed challenges:** Complete all Easy levels under 10 minutes total

#### For English Language Learners (ELL):

1. **Visual demonstrations** (game is language-light by design)
2. **Vocabulary support:** "rotate," "horizontal," "vertical," "overlap"
3. **Bilingual mode:** Switch to Vietnamese if applicable
4. **Gesture cues:** Use hand motions to show rotation directions
5. **Partner with fluent peer** for instruction clarification

### Assessment Ideas

#### Formative Assessment (During Play):

- **Observation Checklist:**
  - [ ] Student rotates pieces appropriately
  - [ ] Student checks target coverage before placing
  - [ ] Student uses undo when stuck
  - [ ] Student verbalizes strategy ("I'll put the I-block here because...")

- **Exit Ticket:**
  - "Draw a 3×4 rectangle. How many O-blocks would you need to fill it?" (3)
  - "If a piece has 5 cells, what is it called?" (Pentomino)

#### Summative Assessment (End of Unit):

- **Puzzle Creation Project:**
  - Students design a solvable 16-cell level using 4 tetrominoes
  - Peer testing: Classmates attempt to solve each other's puzzles
  - Rubric: Solvability (4 pts), Creativity (3 pts), Neatness (3 pts)

- **Problem-Solving Reflection:**
  - "Describe your strategy for solving a difficult puzzle in 3-5 sentences"
  - Criteria: Mentions rotation, trial-and-error, and volume conservation

### Cross-Curricular Connections

#### Art:
- **Tessellations:** Explore M.C. Escher's repeating patterns
- **Color Theory:** Discuss why each piece has a distinct color (visual differentiation)

#### History:
- **Ancient Puzzles:** Research tangrams (Chinese puzzle from 1000+ years ago)
- **Tetris History:** Learn about Alexey Pajitnov's 1984 invention

#### Computer Science:
- **Algorithms:** Introduce backtracking as a computer science concept
- **Computational Thinking:** Discuss how the solver "thinks" through possibilities

#### Language Arts:
- **Procedural Writing:** Write step-by-step instructions to solve a level
- **Vocabulary:** Geometry terms (perpendicular, adjacent, symmetry)

---

## Extensions and Challenges

### Challenge Mode Ideas

1. **Speedrun:** Complete all Easy levels in under 5 minutes
2. **Minimal Moves:** Solve a puzzle with the fewest piece placements (no undo)
3. **No Rotation:** Solve "Rectangle" level using only 0° rotation
4. **3D Master:** Complete all 3D levels without using undo
5. **Blindfolded (Guided):** Peer directs placement verbally while solver's eyes are closed

### Real-World Connections

**Packing Problems:**
- Loading boxes into a truck (maximize space)
- Arranging furniture in a room
- Organizing groceries in a refrigerator

**Architecture:**
- Designing floor plans with modular rooms
- Creating tiled mosaics
- Planning building blocks in video games (Minecraft)

**Manufacturing:**
- Cutting fabric pieces from cloth (minimize waste)
- Sheet metal stamping (industrial die cutting)
- 3D printing support structures

### Further Exploration

**Books:**
- "The Tangram Magician" by Lisa Campbell Ernst (K-2)
- "Block City" by Robert Louis Stevenson (Poetry, K-3)
- "Polyominoes: Puzzles, Patterns, Problems, and Packings" by Solomon W. Golomb (Advanced)

**Online Resources:**
- National Council of Teachers of Mathematics (NCTM) geometry activities
- KenKen and Sudoku (related logic puzzles)
- Scratch programming: Create your own tetromino game

**Manipulatives:**
- Physical tetromino sets (available from educational suppliers)
- Pattern blocks (similar spatial reasoning)
- Soma cube (3D puzzle with 7 polycube pieces)

---

## Accessibility Features

ShapeArchitect is designed with **universal design principles** to ensure all students can participate:

### Visual Accessibility

- **High-contrast colors:** Each piece has a distinct, vibrant color
- **Blueprint pattern:** Target cells have visible texture in addition to color
- **Ghost preview:** Semi-transparent overlay shows exactly where piece will land
- **Sufficient spacing:** Grid cells are large enough to see clearly (min 40px)

### Motor Accessibility

- **Keyboard navigation:** Full game playable without mouse
  - Tab to navigate, Enter to select, Arrow keys to move
- **Snap-to-nearest:** Pieces auto-align to valid positions (reduces fine motor demands)
- **Large click targets:** Buttons are minimum 44×44px (WCAG AAA compliant)
- **No time pressure:** Puzzles can be solved at any pace (practice mode has no timer)

### Cognitive Accessibility

- **Clear objective:** Visual target shape shows exactly what to fill
- **Immediate feedback:** Invalid placements turn red instantly
- **Undo button:** Mistakes are easily reversible (no penalty)
- **Progressive difficulty:** Start with 4-piece puzzles before advancing to 8-piece

### Reduced Motion Support

All animations respect `prefers-reduced-motion: reduce`:
- Snap wobble disabled
- Dust burst particles disabled
- Win celebration confetti disabled
- Only essential visual feedback remains

### Screen Reader Support

- ARIA labels on all interactive elements
- Live region announcements for game state changes ("Piece placed", "Puzzle solved")
- Semantic HTML structure for logical navigation

---

## Technical Implementation Notes

For developers and advanced educators interested in the underlying mechanics:

### Grid System

```typescript
type CellState = 0 | 1 | 2;
// 0 = Empty space
// 1 = Target cell (blueprint)
// 2 = Filled cell (placed piece)
```

Grid is represented as a 3D array: `grid[x][y][z]`

### Rotation Mathematics

Each rotation is defined by Euler angles with 90° increments:

```typescript
interface Rotation3D {
    x: 0 | 90 | 180 | 270;  // Pitch
    y: 0 | 90 | 180 | 270;  // Yaw
    z: 0 | 90 | 180 | 270;  // Roll
}
```

Rotations are applied in order: X → Y → Z

Example: Rotating point (1, 0, 0) by 90° around Z-axis:
```typescript
(x, y, z) → (-y, x, z)
(1, 0, 0) → (0, 1, 0)
```

### Placement Validation

A piece can be placed if:
1. All cells are within grid bounds
2. No cells overlap with already-filled cells (state 2)
3. At least one cell lands on a target cell (state 1)

### Solver Performance

Complexity analysis:
- **State space size:** O(P! × R^P × G^P)
  - P = number of pieces
  - R = rotations per piece (4 or 24)
  - G = grid size
- **Pruning strategies:**
  - Early volume check (O(1) rejection)
  - Target-first search (reduces branching factor)
  - Unique rotation detection (eliminates symmetric states)

Typical search depths:
- Easy (4 pieces): ~10-100 states
- Medium (6 pieces): ~1,000-10,000 states
- Hard (8 pieces): ~100,000+ states (may timeout)

---

## Conclusion

ShapeArchitect bridges the gap between **play and learning** by transforming spatial geometry into an engaging workshop experience. Through progressively challenging puzzles, students develop:

- **Spatial reasoning** that transfers to STEM fields
- **Problem-solving persistence** through trial and error
- **Mathematical confidence** by mastering geometric transformations
- **Computational thinking** via constraint satisfaction strategies

Whether used as a math center activity, a reward for completed work, or a full lesson on area and volume, ShapeArchitect provides **meaningful practice** with core geometric concepts. The game's forgiving mechanics (undo, snap-to-nearest, practice mode) ensure that **all students can experience success** while being appropriately challenged.

By making geometry **tangible, visual, and fun**, ShapeArchitect helps students build the spatial intuition that underlies everything from reading maps to designing buildings to understanding molecular structures.

---

## Quick Reference Card

### For Students

**Objective:** Fill the blue blueprint with colored blocks

**Controls:**
- **Drag** pieces onto the grid
- **Click X/Y/Z** buttons to rotate
- **Click Undo** if you make a mistake
- **Win** when all blue cells are filled!

**Tips:**
- Start with corner pieces
- Rotate pieces before placing
- If it turns red, try a different spot
- Count cells: Do your pieces match the target?

### For Teachers

**Grade Level:** 1-8 (Ages 6-14)

**Math Standards:** Geometry, Area, Volume, Spatial Reasoning

**Session Time:** 5-20 minutes

**Accessibility:** Keyboard navigable, high contrast, no time pressure

**Differentiation:**
- Easy: O-blocks only (uniform pieces)
- Medium: Mixed tetrominoes
- Hard: Pentominoes and 3D polycubes

**Assessment:** Observe rotation usage, strategic planning, and volume understanding

---

**Document Version:** 1.0
**Last Updated:** January 2026
**Game Version:** ShapeArchitect 2.0 (with 3D levels and snap-to-nearest)
