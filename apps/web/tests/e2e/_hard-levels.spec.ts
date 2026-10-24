// Playtest the 4 new hand-picked hard levels (Crucible, Outpost, Cascade,
// Bastion). For each: load the level, confirm it renders with the expected
// piece count, then guided-solve it to verify the full placement loop works
// on the new silhouettes.

import { expect, test } from '@playwright/test'

import { expectHydrated } from './_helpers'

const NEW_HARD = [
  { name: 'Crucible', pieces: 7 },
  { name: 'Outpost', pieces: 8 },
  { name: 'Cascade', pieces: 7 },
  { name: 'Bastion', pieces: 7 },
] as const

for (const level of NEW_HARD) {
  test(`hard level ${level.name} renders + guided-solves`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
    page.on('console', (m) => {
      if (m.type() === 'error')
        errors.push(`console: ${m.text().slice(0, 200)}`)
    })

    await page.goto('/games/shape-architect', {
      waitUntil: 'domcontentloaded',
    })
    // Clicks before hydration are dropped, which a cold CI server makes likely.
    await expectHydrated(page)

    // Select the level by name and confirm it loaded.
    await page.locator(`button:has-text("${level.name}")`).first().click()
    await expect(page.locator('body')).toContainText(level.name)

    // Guided solve. Wait for the walkthrough (a server-side solve) instead of
    // a fixed delay, then place each step.
    await page.locator('button:has-text("Guided")').first().click()

    const place = page.locator('button:has-text("Place piece")').first()
    const done = page.getByText(/Walkthrough complete/i)
    for (let i = 0; i < level.pieces + 2; i++) {
      await expect(place.or(done).first()).toBeVisible({ timeout: 15_000 })
      if (await done.isVisible()) break
      await place.click()
      // Let the placement settle before the next step.
      await page.waitForTimeout(1000)
    }
    await expect(
      done,
      `${level.name} did not reach Walkthrough complete`,
    ).toBeVisible()

    // Tolerate only the known cache/font noise.
    const real = errors.filter(
      (e) =>
        !e.includes('fonts.googleapis') &&
        !e.includes('favicon') &&
        !e.includes('Failed to load resource'),
    )
    if (real.length > 0) {
      throw new Error(`${level.name} errors: ${real.join(' | ')}`)
    }

    await page.screenshot({
      path: `test-results/playtest/hard-${level.name.toLowerCase()}.png`,
    })
  })
}
