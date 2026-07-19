# Shape Architect — Performance Benchmarks

Solver + generator wall-clock times on the development machine (Apple Silicon,
Node 22). Run with:

```bash
corepack pnpm --filter @math-games/game-shape-architect bench
```

## DLX `buildRows` optimization (2026-07-19)

The DLX exact-cover setup step (`buildRows`) previously enumerated every
`(target, cell)` pair as a placement anchor and deduped with an `O(rows)` scan
per candidate — an `O(targets × cells × rotations × pieces × rows)` hot path
that dominated solve time on every level.

The fix: for exact cover, every cell of a valid placement must land on a
target, so `layout[0]` must land on some target `T`. That gives a unique
translation per `T` (`position = T − layout[0]`); each candidate is generated
exactly once, so **no dedup is needed**. The inner loop collapses from
`targets × cells` to just `targets`.

### Median solve time, before → after

| Level    | DLX before | DLX after | Speedup |
| -------- | ---------: | --------: | ------: |
| `easy_1` |      241µs |      87µs |    2.8× |
| `easy_4` |      425µs |     163µs |    2.6× |
| `med_1`  |      282µs |      74µs |    3.8× |
| `hard_1` |      567µs |     121µs |    4.7× |
| `hard_2` |      896µs |     170µs |    5.3× |
| `hard_3` |     1.53ms |     289µs |    5.3× |
| `hard_4` |     1.36ms |     650µs |    2.1× |

Hard-level canonical solution time (`solveLevelToSolution`, DLX-then-backtrack
fallback) dropped from **1.31ms → 0.59ms** median.

## Three.js render-loop optimization (2026-07-19)

The 3D scene now uses **render-on-demand**: a `requestAnimationFrame` loop
runs continuously but only calls `renderer.render()` when a "dirty" flag is
set (controls change, grid update, ghost update, resize), followed by a short
settle window for damping. When idle, each frame is essentially free.

Additional scene-level changes:

- **Material pooling**: `MeshStandardMaterial` per color is cached for the
  lifetime of the scene instead of allocated + disposed on every placement
  (visible as GC pressure on the old path).
- **InstancedMesh pooling**: pooled meshes grow lazily and are reused across
  updates rather than recreated per placement.
- **Throttled mousemove picking**: raycasts are coalesced to one per rAF
  instead of one per mousemove event (Chrome fires 200+ events/sec on a
  trackpad swipe).
- **Soft shadows** (`PCFSoftShadowMap`) at the same effective cost on small
  voxel grids.

### Observable signal

A perf HUD in the top-right of the 3D view shows live FPS + median/p95 frame
time, sourced from `createPerfMonitor` in
`packages/game-shape-architect/src/rendering/perf-monitor.ts`. Snapshots are
flushed to the `client_metrics` D1 table (kind `perf`,
name `shape-architect.frame`) every 30s while the player interacts, so the
admin health dashboard can aggregate real-user frame times.
