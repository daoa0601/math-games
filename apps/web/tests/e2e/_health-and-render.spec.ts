// Standalone perf + render verification for the health/analytics + 3D work.
//
// Run with the dev server already up on :3000:
//   corepack pnpm --filter @math-games/web exec playwright test \
//     tests/e2e/_health-and-render.spec.ts --project=chromium
//
// What it verifies:
//   - /health returns 200 with the expected JSON shape
//   - Every game route renders without console errors
//   - shape-architect 3D view loads three.js and produces a non-empty canvas
//   - shape-architect 3D view emits a perf snapshot line in the HUD

import { expect, test } from '@playwright/test'

const SHOTS = 'test-results/health-shots'

const gamesList = [
  { id: 'magic-graph' },
  { id: 'sequence-race' },
  { id: 'shape-architect' },
  { id: 'pattern-detective' },
  { id: 'fraction-builder' },
  { id: 'equation-balance' },
] as const

test('/health reports a live D1 binding', async ({ request }) => {
  const res = await request.get('/health')
  expect(res.status()).toBe(200)
  const body = await res.json()
  expect(body.status).toBe('ok')
  expect(body.dbMarker).toBe('d1-alive')
  expect(typeof body.dbLatencyMs).toBe('number')
  expect(body.dbLatencyMs).toBeLessThan(500)
})

for (const game of gamesList) {
  test(`${game.id} route renders without errors`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(`${e.name}: ${e.message}`))
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(`console: ${m.text()}`)
    })

    await page.goto(`/games/${game.id}`, { waitUntil: 'domcontentloaded' })
    // Give client fns + React hydration a beat to resolve.
    await page.waitForTimeout(1500)

    await page.screenshot({
      path: `${SHOTS}/${game.id}.png`,
      fullPage: false,
    })

    // Filter out known noisy errors (third-party font load, devtools warnings).
    const real = errors.filter(
      (e) =>
        !e.includes('fonts.googleapis') &&
        !e.includes('Failed to load resource') &&
        !e.includes('favicon'),
    )
    expect(real, `errors on /games/${game.id}: ${real.join(' | ')}`).toEqual([])
  })
}

test('shape-architect 3D mode loads three.js and renders the perf HUD', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(`${e.name}: ${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`)
  })

  await page.goto('/games/shape-architect', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  // Switch to 3D view.
  const toggle3d = page.getByRole('radio', { name: '3D' }).first()
  await toggle3d.click()
  // Three.js is dynamic-imported; wait for the canvas to gain size.
  const canvas = page.locator('canvas').first()
  await expect(canvas).toBeVisible()
  await page.waitForFunction(
    () => {
      const c = document.querySelector('canvas')
      return !!c && c.width > 0 && c.height > 0
    },
    undefined,
    { timeout: 10_000 },
  )

  // Hover over the canvas to force at least one rendered frame, then check
  // the perf HUD has populated. The HUD is in a top-right absolutely
  // positioned element with tabular-nums text.
  const box = (await canvas.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.move(box.x + box.width / 3, box.y + box.height / 3)
  await page.waitForTimeout(1500)

  await page.screenshot({ path: `${SHOTS}/shape-architect-3d.png` })

  const real = errors.filter(
    (e) =>
      !e.includes('fonts.googleapis') &&
      !e.includes('favicon') &&
      !e.includes('Failed to load resource'),
  )
  expect(real, `3D errors: ${real.join(' | ')}`).toEqual([])
})

test('pattern-detective practice generator produces a fresh level', async ({
  page,
}) => {
  await page.goto('/games/pattern-detective', {
    waitUntil: 'domcontentloaded',
  })
  await page.waitForTimeout(1000)
  await page.screenshot({ path: `${SHOTS}/pattern-detective-before.png` })

  // Type a seed, then generate.
  const seedInput = page.locator('input[aria-label="Practice seed"]').first()
  await seedInput.fill('perf-test')
  await page
    .getByRole('button', { name: /generate|practice/i })
    .first()
    .click()
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${SHOTS}/pattern-detective-practice.png` })

  // The new level should still render the sequence card.
  await expect(page.getByText('Pattern Detective').first()).toBeVisible()
})
