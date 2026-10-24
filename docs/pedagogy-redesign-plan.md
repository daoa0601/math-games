# Math Games: Pedagogical Depth & Portfolio Redesign Plan

> Strategic analysis of how to deepen the math-games platform — turning the games
> from "answer-entry activities with game dressing" into small mathematical worlds.
> Complements [`next-phase.md`](./next-phase.md) (product roadmap) and
> [`improvement-plan.md`](./improvement-plan.md) (architecture-grounded plan); this
> document is the pedagogy-first / learning-design lens.

**Assumed targeting** (unfilled fields): middle-school first; classroom adoption plus motivated self-learners; learning gains as the primary success metric; solo/small team with AI assist; edge-first / no heavy runtime ML / en+vi parity. That is consistent with the platform constraints and ambitions.

---

## The point of view

Your biggest opportunity is not adding more games. It is turning the current games from "answer-entry activities with game dressing" into small mathematical worlds where learners manipulate structures, see consequences, compare representations, and gradually internalize strategies.

The strongest asset you have is the generate → solve → calibrate → cache backend. That should become the product's pedagogical engine: every generated level should carry a skill intent, misconception target, solution trace, hint/fading path, difficulty estimate, and assessment interpretation. Without that, procedural generation mainly gives you volume. With it, procedural generation gives you curriculum, adaptivity, and teacher-facing evidence.

My highest-confidence recommendation: **keep fewer concepts per game, but make each game own a distinct mathematical habit of mind.**

**Current weak spot:**

| Current game      | Risk                                                                       |
| ----------------- | -------------------------------------------------------------------------- |
| Pattern Detective | Often collapses into "find the missing number."                            |
| Equation Balance  | Often collapses into "compute the blank."                                  |
| Fraction Builder  | Often collapses into "produce the answer fraction."                        |
| Sequence Race     | May overlap with Pattern Detective unless it becomes functional/strategic. |

**Target state:**

| Game                                                                        | Distinct cognitive skill it should own                                    |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Fraction Builder → **Fraction Lab**                                         | Rational magnitude, equivalence, decomposition, proportional reasoning.   |
| Equation Balance → **Equation Lab**                                         | Equality as invariant-preserving transformation.                          |
| **Shape Architect**                                                         | Spatial decomposition, mental rotation, 2D↔3D translation.                |
| **Magic Graph**                                                             | Constraint propagation, additive structure, invariants.                   |
| Pattern Detective + Sequence Race → **Function Forge / Pattern Strategist** | Recursive vs explicit rules, tables/graphs/formulas, functional thinking. |
| New later: **Data & Chance Lab**                                            | Variability, sampling, probability, evidence from data.                   |
| New later: **Measure & Scale Lab**                                          | Units, area/volume, similarity, scaling, rate.                            |

The platform should feel less like "six quiz modes" and more like **six manipulatives with game rules.**

---

## 1. Make every game a representation-changing system, not a question type

The deepest math games are rarely deep because the numbers get larger. They are deep because the same mathematical object can be acted on through multiple linked representations.

For your app, the core pattern should be:

> concrete/visual manipulation → representational model → symbolic notation → strategic explanation.

That maps well to established concrete–representational–abstract design, and it is especially important for fractions and algebra. The IES fractions practice guide explicitly recommends helping students see fractions as numbers, using number lines as a central representation, and connecting computation procedures to meaning rather than teaching procedures in isolation.

### What this means in product terms

Every game should have at least two linked views:

| Game            | Linked representations                                                   |
| --------------- | ------------------------------------------------------------------------ |
| Fraction Lab    | area/strip model, number line, symbolic fraction, decimal/percent later. |
| Equation Lab    | balance scale, algebra tiles or expression tree, symbolic equation.      |
| Shape Architect | 2D grid, isometric view, 3D view, projection/silhouette.                 |
| Magic Graph     | grid/graph, line-sum equations, constraint notes.                        |
| Function Forge  | visual pattern, table, graph, recursive rule, explicit rule.             |

The linked views should not be decoration. They should be tools for solving. A learner should be able to drag a fraction on the number line and see the symbolic form update, or subtract 3 from both sides of an equation and see the scale remain balanced.

### Why this matters

ST Math is a useful reference here because it introduces math through visual puzzles before formal language, and uses animated feedback to show why an answer works or fails rather than merely marking it correct or incorrect. DragonBox is another reference: its algebra games deepen by letting learners transform symbolic structures through legal moves, then gradually revealing the formal algebra underneath.

### Effort / impact

High impact, medium effort if you implement it as a shared "math workbench" pattern:

- direct manipulation;
- undo/redo;
- replay solution trace;
- reveal/hide representations;
- short bilingual feedback;
- event logging for assessment.

### Risk

Multiple representations can overload learners if all views are visible at once. Cognitive load theory is clear that working memory is limited, and learning suffers when extraneous load dominates. Use progressive disclosure: start with one representation, then unlock or prompt another when it helps.

---

## 2. Rebuild Fraction Builder as a deep rational-number game

Fraction Builder is salvageable, but only if it stops being "enter or construct the target fraction" and becomes a game about magnitude, equivalence, decomposition, and unit reasoning.

The most important conceptual shift: fractions are not pairs of whole numbers. They are numbers with magnitude. A major misconception is **whole-number bias**: students often treat numerator and denominator as separate whole numbers, leading to errors such as thinking a larger denominator means a larger fraction, or adding fractions by separately adding numerators and denominators. Research on fraction learning repeatedly identifies this interference from whole-number reasoning.

### New core loop: "build the quantity, then justify it"

A good Fraction Builder level should ask learners to construct, compare, transform, or optimize a rational quantity under constraints.

| Level type | Example                                                                                   |
| ---------- | ----------------------------------------------------------------------------------------- |
| Build      | "Make 5/6 using exactly two pieces."                                                      |
| Compare    | "Which is closer to 1: 7/8 or 5/6? Show it on the number line."                           |
| Decompose  | "Make 1 using three different unit fractions."                                            |
| Repair     | "A student says 1/3 + 1/3 = 2/6. Fix the model."                                          |
| Optimize   | "Reach 3/4 using the fewest pieces."                                                      |
| Transfer   | "Show the same quantity as an area model, number line position, and simplified fraction." |
| Proportion | "Scale this recipe from 2 servings to 6 servings while keeping the ratio."                |

### Example difficulty progression

| Tier | Skill                                | Example level                                                                       |
| ---- | ------------------------------------ | ----------------------------------------------------------------------------------- |
| 1    | Equal parts and unit fractions       | "Cut one whole into 4 equal parts. Shade 3 parts."                                  |
| 2    | Same whole, different partitions     | "Build 1/2 using fourths, sixths, and eighths."                                     |
| 3    | Equivalence                          | "Make 2/3 using sixths. Now simplify it."                                           |
| 4    | Magnitude and benchmarks             | "Place 5/8, 3/4, and 7/12 on the number line."                                      |
| 5    | Decomposition                        | "Make 5/6 using two fractions from {1/2, 1/3, 1/4, 1/6}."                           |
| 6    | Addition/subtraction with meaning    | "You have 2/3 cup. Add enough to reach 11/12."                                      |
| 7    | Improper fractions and mixed numbers | "Build 1 3/4 using unit pieces, then show it on the number line."                   |
| 8    | Multiplication/division meaning      | "Show why 1/2 of 3/4 is smaller than 3/4."                                          |
| 9    | Ratio/rate/proportion                | "A recipe uses 2/3 cup for 2 servings. Build the amount for 6 servings."            |
| 10   | Proof/optimization                   | "Find all ways to make 1 using exactly three unit fractions with denominators ≤ 8." |

The IES guide's fraction recommendations support this trajectory: build fraction meaning, use number lines centrally, connect procedures to meaning, and develop ratio/rate/proportion conceptually before teaching cross-multiplication as a procedure.

### Misconception-targeted feedback

Do not just say "wrong." Say what structure failed.

| Misconception                               | Product feedback                                                                              |
| ------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Larger denominator means larger fraction    | Show two equal wholes split into thirds and eighths; animate that eighths are smaller pieces. |
| Numerator/denominator treated independently | For 1/2 + 1/2 = 2/4, show two halves covering one whole, not two fourths.                     |
| Unequal partitions                          | Reject the cut: "These pieces are not equal shares of the same whole."                        |
| Different wholes                            | Show two fraction bars with different whole lengths and ask "What is 1?"                      |
| Multiplying always makes bigger             | Animate 1/2 of 3/4 as taking part of a part.                                                  |

### Generator features for Fraction Lab

Your offline workflow can generate much better fraction levels if the manifest includes:

```json
{
  "skillTags": ["equivalence", "magnitude", "decomposition"],
  "misconceptionTags": ["whole_number_bias", "denominator_size_bias"],
  "representations": ["area_model", "number_line", "symbolic"],
  "difficultyFeatures": {
    "lcmSize": 12,
    "requiresCommonWhole": true,
    "benchmarkDistance": 0.125,
    "numberOfValidSolutions": 3,
    "hasMisleadingDenominator": true
  },
  "solutionTrace": [
    "partition whole into sixths",
    "shade four sixths",
    "group sixths into thirds",
    "simplify 4/6 to 2/3"
  ]
}
```

### Effort / impact

Very high impact. This is probably one of the two most important redesigns. A strong MVP could be built with fraction bars, number lines, symbolic cards, and a solver for equivalence/decomposition. You do not need runtime ML.

### What would make this wrong

If your actual priority is grades K–2, this is too ambitious initially. You would start with equal sharing, halves/thirds/fourths, and visual comparison only. If the priority is high school, Fraction Lab should pivot toward rational expressions, rates, slope, and proportional functions.

---

## 3. Rebuild Equation Balance as a legal-transformation game

Equation Balance should not be a missing-number game. Its distinctive skill should be:

> An equation is a relationship that remains true when you apply valid transformations to both sides.

That is the bridge from arithmetic to algebra.

The IES algebra practice guide recommends using solved problems, teaching the structure of algebraic representations, and helping students intentionally choose among alternative strategies. That maps almost perfectly to a game where learners manipulate equations through legal moves.

### New core loop: "preserve equality"

The learner sees:

- a balance scale;
- algebra tiles or expression blocks;
- a symbolic equation;
- operation cards.

They solve by applying legal transformations:

- add/subtract the same quantity from both sides;
- multiply/divide both sides by the same nonzero value;
- combine like terms;
- distribute/factor;
- substitute;
- later, compare strategies.

Illegal moves should visibly break the invariant. If a learner subtracts 3 from only one side, the scale tilts. If they distribute incorrectly, the expression block highlights the unprocessed term.

### Example difficulty progression

| Tier | Skill                                     | Example                                                              |
| ---- | ----------------------------------------- | -------------------------------------------------------------------- |
| 0    | Equality is relational                    | "Is 8 + 4 = 5 + 7 true?"                                             |
| 1    | Missing value without "answer comes next" | 8 + 4 = \_\_ + 5                                                     |
| 2    | One-step inverse operations               | x + 7 = 15, 3x = 18                                                  |
| 3    | Two-step equations                        | 2x + 5 = 17                                                          |
| 4    | Variables on both sides                   | 3x + 2 = x + 10                                                      |
| 5    | Parentheses/distribution                  | 2(x + 3) = 18                                                        |
| 6    | Negatives and fractions                   | (x - 1)/3 = 5, -2x + 7 = 1                                           |
| 7    | Strategy comparison                       | "Solve in the fewest legal moves."                                   |
| 8    | Error diagnosis                           | "Find the first illegal step in this solution."                      |
| 9    | Construction                              | "Create an equation with solution x = 4 that takes exactly 3 moves." |

### Make it deep without inflating numbers

Depth comes from choice of transformation, not bigger coefficients.

- **A shallow level:** Find x: x + 8 = 13.
- **A deeper level:** You may use only two operation cards. Solve 3x + 6 = 21.
- **A still deeper level:** Two students solved 3x + 6 = 21. One divided first; one subtracted first. Which strategy keeps all intermediate values whole?
- **An expert-level level:** Build an equation whose solution is x = -2, using one distributive step and one variable-on-both-sides step.

DragonBox is the relevant product reference because it makes algebraic manipulation feel like object transformation before formalizing the notation; its later algebra game adds parentheses, signs, common denominators, factorization, and substitution without abandoning the same core manipulation idea.

### Misconception-targeted feedback

| Misconception                               | Product response                                               |
| ------------------------------------------- | -------------------------------------------------------------- |
| Equal sign means "the answer is next"       | Use equations like 7 + 5 = \_\_ + 8, 3 = 3, and x + 2 = x + 2. |
| Move terms magically across the equals sign | Require operation cards applied to both sides.                 |
| Sign errors                                 | Animate +3 and -3 as inverse pairs that cancel.                |
| Dividing only one term                      | Highlight the entire side/group being divided.                 |
| Combining unlike terms                      | Use incompatible tile shapes/colors and block the merge.       |
| Distribution error                          | Show 2(x + 3) as two copies of the whole group.                |

### Generator features for Equation Lab

```json
{
  "skillTags": ["linear_equations", "inverse_operations", "distribution"],
  "misconceptionTags": [
    "one_sided_operation",
    "sign_error",
    "distribution_error"
  ],
  "difficultyFeatures": {
    "minimalMoveCount": 4,
    "expressionTreeDepth": 3,
    "hasVariablesBothSides": true,
    "hasNegativeCoefficient": false,
    "hasFractionCoefficient": false,
    "numberOfTemptingIllegalMoves": 2
  },
  "solutionTrace": [
    "subtract 6 from both sides",
    "simplify 3x = 15",
    "divide both sides by 3",
    "x = 5"
  ]
}
```

### Effort / impact

Very high impact, high effort. This is likely a 6–10 week bet for a small team if you build a reusable expression engine, operation validator, and trace visualizer. It is worth it because it gives the platform a genuinely deep algebra game instead of another missing-number activity.

### What would make this wrong

If teachers mainly want quick arithmetic fluency practice, this will feel too conceptual. But for middle-school learning gains, the conceptual move is the point.

---

## 4. Merge Pattern Detective and Sequence Race into one functions-and-patterns game

Your instinct is right: Pattern Detective, Equation Balance, and Sequence Race overlap if all three reduce to "find the missing number."

Pattern Detective should not remain a standalone "next term" game unless it becomes a gateway into functional thinking. The deeper version is a game about rules, representations, and generalization.

### New identity: Function Forge / Pattern Strategist

The core question changes from:

> What is the next number?

to:

> What rule generates this structure, and how can you prove it works?

### Progression

| Tier | Skill                      | Example                                                   |
| ---- | -------------------------- | --------------------------------------------------------- |
| 1    | Continue visible pattern   | 2, 4, 6, 8, \_\_                                          |
| 2    | Recursive rule             | "Each term adds 3."                                       |
| 3    | Position-to-term rule      | "Term n is 3n + 2."                                       |
| 4    | Table representation       | Fill input/output table.                                  |
| 5    | Graph representation       | Plot terms and infer slope/intercept.                     |
| 6    | Compare rules              | Which grows faster: 2n + 5 or 5n?                         |
| 7    | Ambiguous pattern critique | "Many rules fit the first 4 terms. Ask for another term." |
| 8    | Construct rule             | "Create a pattern whose 10th term is 47."                 |
| 9    | Strategy game              | Choose rules/actions to hit targets under constraints.    |

The key misconception to attack is **overfitting from too few examples.** Learners often believe a sequence has one obvious next term, but mathematically many rules can fit finite data. A great version of this game teaches them to seek structure, not just pattern-match.

Sequence Race can supply the strategic layer: players choose transformations or rules under constraints. Pattern Detective supplies the recognition/generation layer. Together they become one coherent game about functions.

### Effort / impact

Medium-high effort, high impact. This reduces portfolio redundancy and creates a clear pre-algebra/function pathway.

### Risk

You may lose the simplicity of a fast daily "missing term" activity. Keep that as a warm-up mode, not as the game's identity.

---

## 5. Make the solver/backend produce pedagogy, not just solvability

Your Cloudflare Workflow is a major advantage. Use it as an item foundry.

Cloudflare Workflows are designed for durable multi-step execution with retries, observability, and long-running orchestration, which fits generate → solve → calibrate → cache well. D1 gives you SQLite-style relational storage on Workers, and KV is appropriate for globally cached, mostly immutable level manifests despite eventual consistency.

### The item manifest should become the central product object

A generated level should not only contain seed and answer. It should contain:

```json
{
  "gameId": "fraction_lab",
  "itemId": "frac_equiv_000184",
  "generatorVersion": "2026.05.1",
  "seed": "abc123",
  "gradeBand": "middle",
  "skillTags": ["fraction_equivalence", "number_line_magnitude"],
  "misconceptionTags": ["denominator_size_bias"],
  "representations": ["fraction_bar", "number_line", "symbolic"],
  "solution": {
    "canonicalAnswer": "2/3",
    "alternativeAnswers": ["4/6", "6/9"],
    "solutionTrace": [
      "partition whole into thirds",
      "shade two thirds",
      "subdivide each third into two sixths",
      "observe 2/3 = 4/6"
    ],
    "minimalMoves": 3
  },
  "difficulty": {
    "heuristicLevel": 4,
    "solverNodes": 128,
    "branchFactor": 5,
    "estimatedSuccessRate": 0.72
  },
  "qualityGates": {
    "solvable": true,
    "uniqueOrIntentionallyMultiple": true,
    "nonDegenerate": true,
    "hasWorkedExampleTrace": true,
    "hasLocalizedFeedback": true
  }
}
```

### Quality gates inside the workflow

For every candidate level:

1. **Reproducibility:** same seed and generator version produce the same item.
2. **Solvability:** solver confirms at least one valid solution.
3. **Uniqueness or intentional multiplicity:** if multiple solutions exist, the game knows and uses that fact.
4. **Non-degeneracy:** no trivial all-zero, one-click, impossible-to-misread items unless intended.
5. **Pedagogical tag present:** every item must target at least one skill and optionally one misconception.
6. **Solution trace exists:** needed for hints, worked examples, replay, and teacher explanations.
7. **Difficulty features extracted:** not just a tier label.
8. **Misconception traps checked:** distractors should be meaningful, not arbitrary.
9. **Localization ready:** no hardcoded English text inside item logic.
10. **Accessibility metadata:** no item should require drag-only interaction or color-only distinction.

This is where your architecture becomes learning infrastructure.

### Effort / impact

Medium effort, very high leverage. You can add this incrementally without rewriting all games.

### Risk

Overengineering the manifest before redesigning the weak mechanics. Start with Fraction Lab and Equation Lab, then generalize.

---

## 6. Use lightweight adaptivity: heuristic difficulty + item Elo + skill mastery

Do not start with heavy ML. Your best path is:

1. Generate item pools offline.
2. Assign heuristic difficulty from solver and structural features.
3. Collect response data.
4. Update item difficulty and learner skill estimates with simple online models.
5. Use those estimates to select the next item.

A good small-team architecture is:

| Layer                     | Model                                                            |
| ------------------------- | ---------------------------------------------------------------- |
| Initial item difficulty   | Hand-built features + solver signals.                            |
| Observed item difficulty  | Elo-style item rating.                                           |
| Learner ability per skill | Elo-style or exponentially weighted mastery score.               |
| Mastery decision          | Accuracy + hint use + time + transfer item success.              |
| Later upgrade             | IRT or Bayesian Knowledge Tracing for mature high-volume skills. |

There is precedent for Elo-style adaptive math practice. Maths Garden used an Elo-based IRT approach that updated ability and item difficulty after each response and sampled problems around a target success probability. IRT is more statistically principled and models item difficulty, discrimination, and sometimes guessing, but it needs enough data and model discipline to be useful. Bayesian Knowledge Tracing is useful when you have clear skills and repeated opportunities to observe mastery over time.

### Practical recommendation

Start with per-skill Elo-lite, not full IRT/BKT.

For each attempt, log:

```json
{
  "userId": "...",
  "itemId": "...",
  "skillTags": ["equation_inverse_operations"],
  "correct": true,
  "timeMs": 42000,
  "hintLevelUsed": 1,
  "invalidMoveTypes": ["one_sided_subtraction"],
  "undoCount": 2,
  "representationSwitches": ["scale", "symbolic"],
  "completedIndependently": false
}
```

Then compute:

- item observed difficulty;
- user skill estimate;
- misconception frequency;
- hint dependence;
- retention after delay.

A learner who solves 2x + 5 = 17 after three hints should not receive the same mastery credit as a learner who solves it independently and later succeeds on a transfer item.

### Target success zone

Use adaptivity to keep learners mostly in a productive band: not 100% success, not repeated failure. A rough target is **65–85% predicted success**, with harder challenge items and easier confidence-repair items mixed in. The exact target should be validated with your own data.

### Validation checks

Your difficulty tiers are "real" only if observed data agrees:

- success rate decreases as predicted difficulty increases;
- time and hint use generally increase with difficulty;
- items in the same tier have tolerable variance;
- items with high failure but low learning value get quarantined;
- items with low discrimination get rewritten or moved to warm-up;
- solver difficulty correlates with human difficulty, but is not treated as ground truth.

### Effort / impact

High impact, medium effort. D1 can hold attempts and item stats; KV can serve immutable item manifests; workflows can periodically recompute stats.

### Risk

Solver search effort may not match learner difficulty. For example, a puzzle may be hard for the solver but visually obvious to a child, or easy for the solver but conceptually tricky because it triggers a misconception. Treat solver features as priors, then let human data correct them.

---

## 7. Generalize guided workflow: worked example → faded scaffold → independent transfer

Your guided build-order mode in Shape Architect is a strong idea. Generalize it across the platform.

The pattern should be:

1. **Worked example:** full solution trace is shown.
2. **Completion problem:** learner fills in one missing step.
3. **Faded scaffold:** hints become less explicit.
4. **Independent solve:** no step hints.
5. **Transfer:** same skill in a different surface form.

Worked examples and fading are well-supported for problem-solving domains. Research on worked examples found that fading worked steps and adding self-explanation prompts can improve near and far transfer. The IES algebra guide also recommends solved problems as an instructional support for algebra.

### Apply it across games

| Game            | Worked → faded example                                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Fraction Lab    | Show 1/2 + 1/3 = 5/6 with fraction bars and number line; then hide the partitioning step; then ask learner to solve 1/2 + 1/6. |
| Equation Lab    | Show solving 2x + 5 = 17; then hide the inverse operation; then ask for a strategy choice.                                     |
| Magic Graph     | Show one forced line-sum deduction; then ask learner to identify the next forced cell.                                         |
| Function Forge  | Show how a visual pattern becomes 3n + 1; then hide the table or graph step.                                                   |
| Shape Architect | Show ordered placement; then ask "which piece is forced by this remaining void?"                                               |

### Make hints diagnostic

- **Bad hint:** Try again.
- **Better hint:** This move changed only the left side. What operation would keep both sides equal?
- **Best hint:** Subtract 5 from both sides. Watch the scale: both pans lose the same weight, so equality is preserved.

Game-based assessment research from CRESST emphasizes that feedback should connect game events to the underlying math principle; simply adding hints or points is not enough.

### Effort / impact

Very high impact, medium effort if every solver emits a trace. This is one of the best uses of your backend.

### Risk

Too much guidance can turn the app into passive following. Fade based on demonstrated mastery: high accuracy, low hint use, and success on transfer items should reduce scaffolding.

---

## 8. Make Shape Architect the spatial reasoning flagship

Shape Architect is already the most differentiated game. Do not treat 3D as a visual upgrade. Treat it as a curriculum strand: spatial visualization, mental rotation, projection, decomposition, and 2D↔3D translation.

Spatial reasoning is strongly related to STEM learning, and meta-analytic evidence suggests spatial skills can be improved through targeted interventions. The opportunity is to make Shape Architect the game that no ordinary worksheet can replicate.

### Progression for Shape Architect

| Stage | Skill                                                          |
| ----- | -------------------------------------------------------------- |
| 1     | 2D polyomino fitting with rotations disabled.                  |
| 2     | 2D rotations/reflections enabled.                              |
| 3     | Decompose target into subregions before placing pieces.        |
| 4     | Isometric view of stacked cubes.                               |
| 5     | Match 2D top/front/side projections to 3D object.              |
| 6     | Build a 3D object from projections.                            |
| 7     | Identify hidden cubes / impossible solids.                     |
| 8     | Mental rotation challenge: same object, different orientation. |
| 9     | Cross-sections and slices.                                     |
| 10    | Construct object satisfying volume/surface-area constraints.   |

### When 3D helps

3D helps when it is used for:

- mental rotation;
- perspective switching;
- projection matching;
- checking hidden structure;
- connecting volume to unit cubes.

### When 3D hurts

3D hurts when it adds camera manipulation, occlusion, and visual clutter before the learner has a stable spatial model. Keep 3D optional at first, then make it necessary only when the learning objective is actually spatial.

### Effort / impact

Medium effort, high impact because you already have the renderer and solver. Add projection tasks and trace-based hints before adding more 3D spectacle.

### Risk

Three.js can dominate performance and attention. On mobile, default to 2D/isometric and let learners open 3D as a tool.

---

## 9. Use motivation systems to reinforce mastery, not grinding

Daily challenges, streaks, achievements, and classrooms can help, but they can also corrupt learning if they reward speed, volume, or low-level repetition.

Self-determination theory is the right framework: motivation is supported by autonomy, competence, and relatedness. For your app:

| Need        | Product design                                                                                      |
| ----------- | --------------------------------------------------------------------------------------------------- |
| Autonomy    | Let learners choose a path, representation, challenge mode, or "practice / puzzle / mastery check." |
| Competence  | Show visible progress on specific skills, not just XP.                                              |
| Relatedness | Classroom challenges, shared daily seeds, teacher feedback, cooperative puzzle discussion.          |

Game-based learning evidence is mixed in the useful way: games can support learning, but only when game mechanics align with instructional goals. Games by themselves do not automatically produce learning.

### Better achievements

Avoid:

- "Solved 100 problems."
- "Played 10 days in a row."
- "Fastest answer."

Prefer:

- "Solved a variables-on-both-sides equation with no hints."
- "Used a number line to correct a fraction comparison."
- "Found two different decompositions of 5/6."
- "Completed a spaced review after 7 days."
- "Explained why a one-sided equation move was invalid."
- "Recovered from a misconception and solved a transfer item."

### Daily challenge redesign

The daily challenge should not be random. It should be:

- 70% spaced/interleaved review;
- 20% current frontier skill;
- 10% stretch puzzle.

Spacing has a measurable positive effect on math learning, and interleaving can improve strategy selection; one classroom study found substantially higher test performance after interleaved practice than blocked practice.

### Risk

Streaks can become dark-pattern retention mechanics. Keep streak repair generous, avoid shame, and reward returning to hard concepts rather than merely opening the app.

---

## Quick wins

These are high-leverage changes that do not require a full redesign.

### 1. Add skillTags, misconceptionTags, and solutionTrace to the game contract

Every game module should expose:

```typescript
type LevelManifest = {
  gameId: string;
  seed: string;
  generatorVersion: string;
  gradeBand: GradeBand;
  skillTags: string[];
  misconceptionTags?: string[];
  difficultyFeatures: Record<string, number | boolean | string>;
  solutionTrace?: SolutionStep[];
  hintPath?: HintStep[];
};
```

This unlocks guided mode, teacher analytics, adaptivity, and quality gates.

### 2. Replace generic wrong feedback with misconception feedback

Start with Fraction Builder and Equation Balance.

Example:

- "Wrong" → "You changed only one side of the equation."
- "Wrong" → "These fractions use different-sized wholes."
- "Wrong" → "A larger denominator means smaller pieces when the whole is the same size."

### 3. Add replayable solution traces

After a solve, let learners replay:

- their own moves;
- the solver's canonical solution;
- an alternative strategy if one exists.

This adds perceived depth and supports self-explanation.

### 4. Redesign achievements around mastery evidence

Change achievement definitions from volume to skill:

```json
{
  "achievement": "Equation Invariant",
  "condition": "Solve 5 two-step equations with no one-sided operation errors and no hints"
}
```

### 5. Make daily challenge skill-aware

Instead of choosing a random game/level, choose:

- one spaced review item;
- one current-skill item;
- one challenge puzzle.

### 6. Add teacher-facing misconception summaries

A useful teacher dashboard is not "average score: 78%." It is:

- 9 students repeatedly subtracted from only one side of equations.
- 6 students compared fractions by denominator size.
- 4 students solved recursive patterns but failed explicit nth-term rules.

### 7. Improve manipulative accessibility

Do not require drag-only interaction. Provide click/tap alternatives, keyboard controls, undo, and sufficiently large targets. WCAG 2.2 added criteria around dragging movements and target size, which are directly relevant to math manipulative UIs.

---

## Big bets

### Big bet 1: Fraction Lab

Rebuild Fraction Builder as the platform's rational-number game.

- **Impact:** very high.
- **Effort:** high.
- **Why:** fractions are central, hard, and diagnostic. A strong fractions game gives the platform serious learning credibility.

### Big bet 2: Equation Lab

Rebuild Equation Balance as invariant-preserving transformation.

- **Impact:** very high.
- **Effort:** high.
- **Why:** this differentiates your algebra offering from arithmetic missing-value practice.

### Big bet 3: Function Forge

Merge Pattern Detective and Sequence Race.

- **Impact:** high.
- **Effort:** medium-high.
- **Why:** it removes redundancy and creates a true pre-algebra/functions strand.

### Big bet 4: Solver-backed guided learning across games

Use solution traces for worked examples, hints, fading, replay, and teacher explanations.

- **Impact:** very high.
- **Effort:** medium.
- **Why:** you already have the infrastructure advantage.

### Big bet 5: Item calibration loop

Add observed item difficulty and learner skill estimates.

- **Impact:** high.
- **Effort:** medium.
- **Why:** this makes procedural generation trustworthy.

---

## Proposed coherent portfolio

### Keep and deepen

| Game             | Keep?             | New role                                        |
| ---------------- | ----------------- | ----------------------------------------------- |
| Shape Architect  | Yes               | Spatial reasoning flagship.                     |
| Magic Graph      | Yes               | Constraint reasoning and arithmetic invariants. |
| Fraction Builder | Yes, but redesign | Rational-number lab.                            |
| Equation Balance | Yes, but redesign | Algebraic transformation lab.                   |

### Merge

| Current games                     | New game                            |
| --------------------------------- | ----------------------------------- |
| Pattern Detective + Sequence Race | Function Forge / Pattern Strategist |

Pattern Detective alone is too thin. Sequence Race gives it game structure; Pattern Detective gives it mathematical content.

### Add later

| New game            | Why                                                                        |
| ------------------- | -------------------------------------------------------------------------- |
| Data & Chance Lab   | K–12 portfolio needs data, variability, probability, sampling.             |
| Measure & Scale Lab | Connects geometry, units, area/volume, similarity, proportional reasoning. |

### Possible final portfolio map

| Strand                         | Game                |
| ------------------------------ | ------------------- |
| Number & rational quantity     | Fraction Lab        |
| Algebra & equivalence          | Equation Lab        |
| Functions & patterns           | Function Forge      |
| Spatial geometry               | Shape Architect     |
| Constraint/invariant reasoning | Magic Graph         |
| Data/probability               | Data & Chance Lab   |
| Measurement/scaling            | Measure & Scale Lab |

This is more coherent than six unrelated minigames. It also gives teachers a clearer reason to assign each game.

---

## Per-game notes beyond the two weak games

### Magic Graph

Magic Graph can be excellent if it becomes a constraint-propagation game rather than a magic-square filler.

Add depth through:

- partial line sums;
- locked cells;
- parity constraints;
- modular constraints;
- symmetry;
- multiple possible sums;
- "prove uniqueness" levels;
- "change one number to restore consistency" levels;
- minimal-edit puzzles.

Example progression:

| Tier | Example                                  |
| ---- | ---------------------------------------- |
| 1    | Complete one missing cell in a line.     |
| 2    | Use row and column constraints together. |
| 3    | Infer target sum from overlapping lines. |
| 4    | Detect contradiction.                    |
| 5    | Find all possible completions.           |
| 6    | Prove a cell is forced.                  |
| 7    | Solve with parity/modular constraints.   |

This game should own invariants and constraints.

### Shape Architect

Add "why this piece?" prompts to the guided mode.

Useful hint types:

- "This remaining cavity has width 1, so only these pieces can fill it."
- "Try placing the most constrained piece first."
- "Rotate mentally before using the 3D view."
- "Compare the top projection to your build."

### Function Forge

Make ambiguity explicit.

Example:

> The sequence is 2, 4, 6, 8.
> Player A says the rule is +2.
> Player B says the rule is "double n."
> Player C says another rule also fits.
> Ask for the 10th term under each rule.

That teaches a much deeper idea: finite data does not uniquely determine a rule without assumptions.

---

## Embedded assessment and efficacy

The games should double as formative assessment, but only if you log process, not just answers.

### Log diagnostically meaningful events

| Event                                        | Interpretation                  |
| -------------------------------------------- | ------------------------------- |
| One-sided equation operation                 | Equality misconception.         |
| Repeated denominator-size comparisons        | Whole-number bias in fractions. |
| Many rotations before placement              | Spatial orientation difficulty. |
| Solves recursive pattern but misses nth-term | Weak functional generalization. |
| Uses hint then succeeds on transfer          | Productive scaffold.            |
| Succeeds only with same representation       | Fragile knowledge.              |

### Teacher dashboard

Show:

- skill mastery;
- misconception clusters;
- representative student work;
- recommended next assignments;
- class-wide readiness;
- growth over time.

Avoid giving teachers only points, stars, or completion rates.

---

## Measuring learning credibly

Start with modest but defensible evidence:

- Pre/post micro-assessments per skill.
- Delayed retention checks after 7–14 days.
- Transfer items that differ from trained examples.
- A/B tests on feedback, hint fading, and representations.
- Classroom pilots with teacher-assigned units.

Your strongest product metric should be something like:

> percentage of learners who improve from pre-test to delayed transfer check on a tagged skill.

Retention/streaks matter, but they should be secondary unless you are explicitly optimizing for consumer entertainment.

---

## Interaction and layout principles

Thin mechanics often feel thin because the UI is a prompt plus answer box. The fix is not visual clutter. The fix is a workbench.

### Math workbench pattern

Each game should support:

- direct manipulation;
- undo/redo;
- step history;
- replay;
- linked representations;
- optional hint panel;
- "explain this step" prompt;
- keyboard/tap alternatives to dragging;
- bilingual terminology;
- teacher-safe quiet mode;
- low-motion mode.

### Bilingual design

For English/Vietnamese parity, keep the math visual and localize labels, not logic.

Use stable glossary keys for terms such as:

| English     | Vietnamese  |
| ----------- | ----------- |
| numerator   | tử số       |
| denominator | mẫu số      |
| equivalent  | tương đương |
| balance     | cân bằng    |
| simplify    | rút gọn     |
| factor      | nhân tử     |
| variable    | biến        |
| expression  | biểu thức   |

Avoid joke-based or story-heavy mechanics that are expensive to localize.

---

## Tradeoffs and risks

### Risk 1: You build deeper games and lose casual simplicity

Mitigation: keep a "daily quick puzzle" layer, but make the underlying game deep. The first level can still be simple; the system underneath should not be shallow.

### Risk 2: Multiple representations increase cognitive load

Mitigation: reveal representations progressively. Use one primary view and one optional support view until the learner is ready.

### Risk 3: Solver difficulty does not equal student difficulty

Mitigation: use solver features as priors only. Calibrate with observed correctness, time, hint use, invalid moves, and transfer success.

### Risk 4: Teachers need curriculum coverage, not just elegant games

Mitigation: map every level to skills and standards later. Do not start with standards bureaucracy, but make your item tags rich enough to support it.

### Risk 5: Rewards undermine learning

Mitigation: reward independence, transfer, persistence after feedback, and spaced mastery. Do not over-reward speed or raw volume.

### Risk 6: The platform becomes too complex for a small team

Mitigation: sequence the work:

1. add manifest tags and traces;
2. redesign Fraction Builder;
3. redesign Equation Balance;
4. merge Pattern/Sequence;
5. add calibration;
6. expand portfolio.

---

## Recommended roadmap

### Phase 1: Foundation, 2–4 weeks

- Add skill/misconception tags to all level manifests.
- Add solution traces where solvers already know the answer path.
- Add diagnostic attempt logging.
- Change achievements to mastery-based.
- Make daily challenge skill-aware.
- Add misconception feedback to current Fraction Builder and Equation Balance.

### Phase 2: Fraction Lab, 4–8 weeks

- Build fraction bars + number line + symbolic card workbench.
- Implement equivalence/decomposition solver.
- Add misconception-specific feedback.
- Add worked-example/faded-scaffold mode.
- Build first calibrated item pool.

### Phase 3: Equation Lab, 6–10 weeks

- Build expression representation and legal transformation engine.
- Add balance-scale visualization.
- Add operation cards and invalid-move feedback.
- Add solution-trace replay.
- Generate levels by minimal move count and misconception traps.

### Phase 4: Calibration and teacher analytics, 4–6 weeks

- Add item observed difficulty.
- Add per-skill learner estimates.
- Add teacher dashboard by skill and misconception.
- Quarantine bad items automatically.

### Phase 5: Portfolio cleanup, 4–8 weeks

- Merge Pattern Detective and Sequence Race into Function Forge.
- Deepen Magic Graph around constraints/invariants.
- Expand Shape Architect with projection and mental-rotation tasks.

---

## Execution strategy: where multi-agent workflows help

This plan is months of design-led, human-in-the-loop engineering — **not** a single orchestrated job. Two distinct things share the word "workflow," at different layers; do not conflate them:

- **Cloudflare Workflows** (sections 5–6) — the _runtime_ durable-execution product that powers the generate → solve → calibrate → cache item foundry. Application infrastructure you build and ship.
- **The Claude Code Workflow tool** — _dev-time_ multi-agent orchestration used to help write the code. Runs many subagents within one session; opt-in and billed. Use this to help build (among other things) the first.

**Reach for multi-agent orchestration on these bounded sub-tasks:**

| Task                                      | Why it fits                                                                                                                                                           |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Upfront codebase audit (before any phase) | Parallel readers over the registry, `GameModule` contract, solver/generator backend, and scoring pipeline → one structured seam map. ~6–10 agents.                    |
| Phase 1 manifest sweep                    | Adding `skillTags` / `misconceptionTags` / `solutionTrace` + misconception-feedback strings is a repetitive N-package change — pilot one module, then batch the rest. |
| Phase 4 item generation / calibration     | The generate→solve→calibrate batch is itself a pipeline; orchestrate pool generation + quality-gate checks across many items.                                         |
| Post-slice review                         | Multi-dimension adversarial review (correctness / accessibility / en-vi parity / pedagogy-intent) before committing.                                                  |

**Do NOT orchestrate** the new-game builds (Phases 2–3, Fraction Lab & Equation Lab). Those are sequential, design-coupled, TDD, visually-verified engineering — keep them interactive with review at each seam.

**Author workflow scripts at the start of the implementing session, not speculatively.** A good script references real files and seams; most don't exist yet. Scout first, then write the script. Reusable scripts can live in `.claude/workflows/`.

---

## The highest-leverage decision

Do not ask, "How do I make Fraction Builder more fun?" or "How do I make Equation Balance harder?"

Ask:

> What mathematical structure does this game let the learner manipulate, and what misconception does each level reveal or repair?

- For **Fraction Builder**, the structure is quantity under changing partitions.
- For **Equation Balance**, the structure is equality under invariant-preserving transformations.
- For **Shape Architect**, the structure is space under decomposition and transformation.
- For **Function Forge**, the structure is covariation and rule generalization.
- For **Magic Graph**, the structure is constraints and invariants.

That framing gives you a product that is both more learnable and more game-like.
