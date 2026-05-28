import { expect, test } from '@playwright/test'

import {
  collectRuntimeErrors,
  desktopLayout,
  expectHydrated,
  expectNoRuntimeErrors,
} from './_helpers'

test.describe('fraction-builder gameplay', () => {
  test('loads with level counter and navigation', async ({ page }) => {
    const errors = collectRuntimeErrors(page)

    await page.goto('/games/fraction-builder')
    await expectHydrated(page)

    await expect(page.locator('text=/\\d+\\/\\d+/').first()).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Next Level' }).first(),
    ).toBeVisible()

    expectNoRuntimeErrors(errors)
  })

  test('building the target fraction shows Solved', async ({ page }) => {
    const errors = collectRuntimeErrors(page)

    // fb-easy-half: build a fraction equal to 1/2 from choices [1, 2, 3, 4].
    await page.goto('/games/fraction-builder?level=fb-easy-half')
    await expectHydrated(page)

    const game = desktopLayout(page)
    await game
      .getByRole('group', { name: 'Numerator' })
      .getByRole('button', { name: '1', exact: true })
      .click()
    await game
      .getByRole('group', { name: 'Denominator' })
      .getByRole('button', { name: '2', exact: true })
      .click()
    await game.getByRole('button', { name: 'Check' }).click()

    await expect(game.getByText('Solved', { exact: true })).toBeVisible()
    await expect(game.getByText('Next Level')).toBeVisible()

    expectNoRuntimeErrors(errors)
  })
})

test.describe('equation-balance gameplay', () => {
  test('loads with level counter and navigation', async ({ page }) => {
    const errors = collectRuntimeErrors(page)

    await page.goto('/games/equation-balance')
    await expectHydrated(page)

    await expect(page.locator('text=/\\d+\\/\\d+/').first()).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Next Level' }).first(),
    ).toBeVisible()

    expectNoRuntimeErrors(errors)
  })

  test('choosing the balancing value shows Solved', async ({ page }) => {
    const errors = collectRuntimeErrors(page)

    // eb-easy-add-5: ? + 3 = 8, answer 5 from choices [3, 4, 5, 6].
    await page.goto('/games/equation-balance?level=eb-easy-add-5')
    await expectHydrated(page)

    const game = desktopLayout(page)
    await game.getByRole('button', { name: '5', exact: true }).click()
    await game.getByRole('button', { name: 'Check' }).click()

    await expect(game.getByText('Solved', { exact: true })).toBeVisible()
    await expect(game.getByText('Next Level')).toBeVisible()

    expectNoRuntimeErrors(errors)
  })
})
