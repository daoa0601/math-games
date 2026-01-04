# E2E Test Performance Optimization Plan

Reduce E2E test execution time on CI from 30+ minutes to under 10 minutes by addressing WebGL slowness, game-loop overhead, and repeated test setup.

## Optimization Areas

### 1. Global Setup Pre-warming

**Problem**: Games have significant cold-start times due to bundle compilation.
**Solution**: Add proper waits in `global-setup.ts` to ensuring lazy-loaded bundles are fully compiled and cached before tests start.

```typescript
// Optimized global setup
await page.goto(baseURL);
await page.waitForSelector('.dashboard', { state: 'visible' });
await page.goto(`${baseURL}/magic-graph`);
await page.waitForSelector('.puzzle-board', { state: 'visible' });
// ... other routes
```

### 2. WebGL/3D Test Handling

**Problem**: Three.js rendering via WebGL is extremely slow in headless CI environments.
**Solution**: Skip complex 3D view tests on CI environments while keeping them enabled for local development.

```typescript
const isCI = !!process.env.CI;
test.skip(() => isCI, '3D view tests skipped on CI');
```

### 3. Game-Loop Optimization

**Problem**: Playing full games (20+ moves with AI thinking time) takes 30-60s per test.
**Solution**: 
- Reduce max moves on CI (20 → 8)
- Implement **Seeding Strategy**: Navigate directly to near-win states instead of playing from scratch.

```typescript
// Instead of playing 20 moves:
await seedSequenceRaceNearWin(page, 2, 'easy');
// Now win in just 1-2 moves
```

### 4. Serial Test Mode

**Problem**: Repeated setup (login, navigation) for every single test adds overhead.
**Solution**: Use `test.describe.configure({ mode: 'serial' })` for read-only tests (like accessibility) to share a single browser context.

### 5. CI Configuration

**Problem**: Default timeouts and retries are too generous for CI.
**Solution**:
- Increase workers: 2 → 3/4
- Reduce retries: 2 → 1
- Tighter timeouts to fail fast
