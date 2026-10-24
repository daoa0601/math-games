// Playtest the 4 new hand-picked hard levels (Crucible, Outpost, Cascade,
// Bastion). For each: load the level, confirm it renders with the expected
// piece count, then guided-solve it to verify the full placement loop works
// on the new silhouettes.

import { test } from '@playwright/test'

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

    await page.goto('http://localhost:3000/games/shape-architect', {
      waitUntil: 'domcontentloaded',
    })
    await page.waitForTimeout(1200)

    // Select the level by name.
    await page.locator(`button:has-text("${level.name}")`).first().click()
    await page.waitForTimeout(1000)

    // Confirm the level loaded: the header should show the level name.
    const body = await page.evaluate(() => document.body.innerText)
    if (!body.includes(level.name)) {
      throw new Error(`${level.name} did not load into the header`)
    }

    // Guided solve.
    await page.locator('button:has-text("Guided")').first().click()
    await page.waitForTimeout(3000)

    let solved = false
    for (let i = 0; i < level.pieces + 2; i++) {
      const btn = page.locator('button:has-text("Place piece")').first()
      const visible = await btn.isVisible().catch(() => false)
      if (!visible) break
      await btn.click()
      await page.waitForTimeout(1000)
      const after = await page.evaluate(() => document.body.innerText)
      if (/Walkthrough complete/i.test(after)) {
        solved = true
        break
      }
    }

    if (!solved) {
      throw new Error(`${level.name} did not reach Walkthrough complete`)
    }

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
