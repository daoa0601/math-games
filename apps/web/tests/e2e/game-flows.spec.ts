import { expect, test } from '@playwright/test'

import {
  collectRuntimeErrors,
  expectHydrated,
  expectNoRuntimeErrors,
} from './_helpers'

test.describe('pattern-detective gameplay', () => {
  test('correct answer shows Solved and Next Level button', async ({
    page,
  }) => {
    const errors = collectRuntimeErrors(page)

    await page.goto('/games/pattern-detective')
    await expectHydrated(page)

    const main = page.locator('main')
    await expect(main.getByText('arithmetic').first()).toBeVisible()

    await main.getByRole('button', { name: '8', exact: true }).click()

    await expect(main.getByText('Solved', { exact: true })).toBeVisible()
    await expect(main.getByText('Next Level')).toBeVisible()

    expectNoRuntimeErrors(errors)
  })

  test('wrong answer shows answer and hint', async ({ page }) => {
    const errors = collectRuntimeErrors(page)

    await page.goto('/games/pattern-detective')
    await expectHydrated(page)

    const main = page.locator('main')
    await main.getByRole('button', { name: '7', exact: true }).click()

    await expect(main.getByText('Try Again')).toBeVisible()
    await expect(main.getByText(/The answer is/)).toBeVisible()
    await expect(main.getByText('Next Level')).toBeVisible()

    expectNoRuntimeErrors(errors)
  })

  test('Next Level button advances to level 2', async ({ page }) => {
    const errors = collectRuntimeErrors(page)

    await page.goto('/games/pattern-detective')
    await expectHydrated(page)

    const main = page.locator('main')
    await main.getByRole('button', { name: '8', exact: true }).click()
    await expect(main.getByText('Solved', { exact: true })).toBeVisible()

    await main.getByText('Next Level').click()

    await expect(main.getByText('1/18')).not.toBeVisible()
    await expect(main.getByText('2/18')).toBeVisible()

    expectNoRuntimeErrors(errors)
  })
})

test.describe('level navigation', () => {
  test('pattern-detective: prev/next arrows change level', async ({ page }) => {
    const errors = collectRuntimeErrors(page)

    await page.goto('/games/pattern-detective')
    await expectHydrated(page)

    await expect(page.getByText('1/18')).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Previous Level' }),
    ).toBeDisabled()
    await expect(
      page.getByRole('button', { name: 'Next Level' }).first(),
    ).toBeEnabled()

    await page.getByRole('button', { name: 'Next Level' }).first().click()

    await expect(page.getByText('2/18')).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Previous Level' }),
    ).toBeEnabled()

    await page.getByRole('button', { name: 'Previous Level' }).click()

    await expect(page.getByText('1/18')).toBeVisible()

    expectNoRuntimeErrors(errors)
  })

  test('magic-graph: board starts empty on first load', async ({ page }) => {
    const errors = collectRuntimeErrors(page)

    await page.goto('/games/magic-graph')
    await expectHydrated(page)

    const nodes = page.locator('button[aria-label^="Node "]:visible')
    await expect(nodes.first()).toBeVisible()

    // Board state must be initialized from the resolved level, not configs[0]:
    // a mismatch leaves nodes styled as filled (bg-primary) while holding no
    // number, and the first tap clears instead of placing.
    const filledNodes = page.locator('button[aria-label^="Node "].bg-primary')
    await expect(filledNodes).toHaveCount(0)

    // Guard the selector against rot: placing a number must produce a
    // filled-styled node.
    await page
      .locator('main')
      .getByRole('button', { name: '1', exact: true })
      .locator('visible=true')
      .first()
      .click()
    await nodes.first().click()
    await expect(filledNodes.first()).toBeVisible()

    expectNoRuntimeErrors(errors)
  })

  test('magic-graph: level nav is present and functional', async ({ page }) => {
    const errors = collectRuntimeErrors(page)

    await page.goto('/games/magic-graph')
    await expectHydrated(page)

    const counter = page.locator('text=/\\d+\\/\\d+/')
    await expect(counter.first()).toBeVisible()

    const nextBtn = page.getByRole('button', { name: 'Next Level' }).first()
    await expect(nextBtn).toBeVisible()

    const initialText = await counter.first().textContent()
    await nextBtn.click()

    const updatedText = await counter.first().textContent()
    expect(updatedText).not.toBe(initialText)

    expectNoRuntimeErrors(errors)
  })

  test('sequence-race: level nav is present', async ({ page }) => {
    const errors = collectRuntimeErrors(page)

    await page.goto('/games/sequence-race')
    await expectHydrated(page)

    const counter = page.locator('text=/\\d+\\/\\d+/')
    await expect(counter.first()).toBeVisible()

    await expect(
      page.getByRole('button', { name: 'Next Level' }).first(),
    ).toBeVisible()

    expectNoRuntimeErrors(errors)
  })

  test('shape-architect: level nav is present', async ({ page }) => {
    const errors = collectRuntimeErrors(page)

    await page.goto('/games/shape-architect')
    await expectHydrated(page)

    const counter = page.locator('text=/\\d+\\/\\d+/')
    await expect(counter.first()).toBeVisible()

    await expect(
      page.getByRole('button', { name: 'Next Level' }).first(),
    ).toBeVisible()

    expectNoRuntimeErrors(errors)
  })
})

test.describe('level grid selection', () => {
  test('pattern-detective: clicking a level card loads it', async ({
    page,
  }) => {
    const errors = collectRuntimeErrors(page)

    await page.goto('/games/pattern-detective')
    await expectHydrated(page)

    await expect(page.getByText('1/18')).toBeVisible()

    const geometricCard = page
      .getByRole('button', { name: /geometric/i })
      .first()
    await geometricCard.click()

    await expect(page.getByText('1/18')).not.toBeVisible()

    expectNoRuntimeErrors(errors)
  })
})

test.describe('language toggle', () => {
  test('switching to Vietnamese updates game title', async ({ page }) => {
    const errors = collectRuntimeErrors(page)

    await page.goto('/games/pattern-detective')
    await expectHydrated(page)

    await expect(
      page.getByRole('heading', { name: 'Pattern Detective', exact: true }),
    ).toBeVisible()

    await page.getByRole('button', { name: /Switch to Vietnamese/i }).click()

    await expect(
      page.getByRole('heading', { name: 'Thám Tử Quy Luật', exact: true }),
    ).toBeVisible()

    expectNoRuntimeErrors(errors)
  })

  test('Vietnamese locale translates ResultCard strings', async ({ page }) => {
    const errors = collectRuntimeErrors(page)

    await page.goto('/games/pattern-detective')
    await expectHydrated(page)

    await page.getByRole('button', { name: /Switch to Vietnamese/i }).click()

    await page.getByRole('button', { name: '7', exact: true }).click()

    await expect(page.getByText('Thử Lại')).toBeVisible()
    await expect(page.getByText(/Đáp án là/)).toBeVisible()
    await expect(page.getByText('Cấp Tiếp Theo')).toBeVisible()

    expectNoRuntimeErrors(errors)
  })
})

test.describe('achievements route', () => {
  test('loads and shows achievement content', async ({ page }) => {
    const errors = collectRuntimeErrors(page)

    await page.goto('/achievements')
    await expectHydrated(page)

    await expect(page.locator('main').first()).toBeVisible()

    expectNoRuntimeErrors(errors)
  })
})
