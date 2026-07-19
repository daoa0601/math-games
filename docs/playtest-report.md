# Playtest Report — 2026-07-19

Driven by `apps/web/tests/e2e/_playtest.spec.ts` against the local dev server.
Each game played to completion through the real UI (not just render checks),
with per-step timing and friction notes captured.

## Summary

| Game              | Scenario       | Result | Total time | Friction                                       |
| ----------------- | -------------- | :----: | ---------: | ---------------------------------------------- |
| shape-architect   | 2D easy guided | SOLVED |      ~5.4s | guided fetch 2.6s; placements ~930ms each      |
| shape-architect   | 3D cube guided | SOLVED |      ~9.1s | **guided fetch 4.9s** (cache miss + solve)     |
| magic-graph       | Line of Three  | SOLVED |      ~2.6s | none — tight loop                              |
| sequence-race     | vs AI          | SOLVED |      ~3.2s | game-over UI unclear (buttons vanish silently) |
| pattern-detective | 3 levels       | SOLVED |      ~1.3s | **solved on first try every time — too easy**  |
| fraction-builder  | build 1/2      | SOLVED |      ~1.2s | none                                           |
| equation-balance  | fill ?+3=8     | SOLVED |      ~1.1s | none                                           |

All 6 games are completable through the UI. The 4 multiple-choice games
(magic-graph, pattern-detective, fraction-builder, equation-balance) have
tight, satisfying loops (1–2 seconds per level). The two construction games
(shape-architect 2D/3D) pay a heavier cost per placement because every
placement is a server round-trip for validation.

## Per-game findings

### shape-architect — construction games

**Strongest finding (positive):** Guided mode works correctly. The earlier
"guided 2D broken" hypothesis was a test-selector bug (the button reads
"Place piece", lowercase p, and my case-sensitive selector missed it).
The route pre-selects the next piece, ghosts it at the target, and the
player just confirms each step — a real safety net.

**Real friction — guided fetch latency:**

- 2D levels: ~2.6s to fetch the guided solution.
- 3D levels: ~4.9s — nearly double.

The server-side `getShapeArchitectSolution` runs the DLX solver on a cache
miss. The LevelForgeWorkflow is supposed to pre-warm the KV cache for
catalog levels, but in local dev it hasn't run. Fix: ensure the catalog
levels' solutions are solved lazily on first hit and then cached, OR
document that the first guided click on a new level pays this cost. The
3D doubling comes from the larger 3D rotation space (24 rotations vs 4).

**Real friction — per-placement round-trip:** ~930ms (2D) / ~1.3s (3D)
per placement, even in guided mode where the placement is guaranteed
valid. The optimistic UI masks this, but the next "Place piece" button
stays disabled until the server replies. Not a bug — the route validates
server-side — but it's the structural reason the construction games feel
slower than the multiple-choice games.

**Per-placement feedback gap:** When the player places a piece manually
and it's rejected, the ghost turns red but the player doesn't learn _why_
(out of bounds, overlaps, wrong rotation). The placement.ts module
extracted this session could carry a structured rejection reason.

### pattern-detective — too easy

Solved on the **first guess, every level**, by trying choices in DOM order
(12 → 15 → 14). The reason: the curated catalog lists distractors that
sort before the answer in many cases, AND the choices are visually
distinct enough that the correct one is obvious. The new seeded generator
adds variety but the catalog levels are the default.

Fix direction: shuffle choices on every render (already done in the
component via `shuffleChoices`), and tighten distractors to be closer to
the answer (±1, ±2) so the player has to actually reason.

### sequence-race — unclear game-over

When the player or AI wins, the `+N` step buttons disappear immediately
but the winner banner takes a beat to render. A player who just clicked
their last move sees an empty board with no obvious "you won" signal
until the confetti/banner paints. Fix: render an explicit "Game over —
You win / You lose" banner the instant the win condition triggers.

### magic-graph / fraction-builder / equation-balance — solid

All three completed cleanly with no friction. The `Check` button disabled
state correctly tracks whether the player has made a complete selection
(numerator + denominator for fractions, a single answer for equations).

## Fixes prioritized

1. **Guided fetch latency** — pre-warm solution cache for the currently
   selected level on hover/focus of the Guided button, so the click is
   instant. (Highest-impact shape-architect fix.)
2. **Pattern-detective difficulty** — tighten distractors to ±1/±2 of the
   answer so first-try guessing is harder.
3. **Sequence-race game-over banner** — render an explicit winner banner
   immediately on win.
4. **Shape-architect placement rejection feedback** — surface _why_ a
   placement was rejected (already structured in placement.ts).
