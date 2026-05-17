import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const MOBILE_VIEWPORT = { width: 375, height: 667 }

test.use({ viewport: MOBILE_VIEWPORT })

async function expectHydrated(page: Page) {
  await expect(page.getByTestId('app-hydrated')).toHaveText('hydrated')
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth
  })
  expect(overflow).toBe(false)
}

test.describe('mobile layout — dashboard', () => {
  test('renders without horizontal overflow', async ({ page }) => {
    await page.goto('/')
    await expectHydrated(page)
    await expectNoHorizontalOverflow(page)
  })

  test('daily hero card with start CTA is visible', async ({ page }) => {
    await page.goto('/')
    await expectHydrated(page)
    await expect(
      page.getByText('Start', { exact: false }).first(),
    ).toBeVisible()
  })

  test('game cards are present in the page', async ({ page }) => {
    await page.goto('/')
    await expectHydrated(page)
    await expect(page.getByText('Magic Graph').first()).toBeAttached()
    await expect(page.getByText('Sequence Race').first()).toBeAttached()
    await expect(page.getByText('Shape Architect').first()).toBeAttached()
    await expect(page.getByText('Pattern Detective').first()).toBeAttached()
  })

  test('bottom tab bar is visible on mobile', async ({ page }) => {
    await page.goto('/')
    await expectHydrated(page)
    await expect(page.getByRole('navigation').last()).toBeVisible()
  })
})

test.describe('mobile layout — game routes', () => {
  test('magic-graph: collapsible sections present on mobile', async ({
    page,
  }) => {
    await page.goto('/games/magic-graph')
    await expectHydrated(page)

    const puzzlesSection = page
      .locator('[data-slot="collapsible"]')
      .filter({ hasText: 'Puzzles' })
    await expect(puzzlesSection).toBeAttached()
  })

  test('magic-graph: expanding collapsible reveals level grid', async ({
    page,
  }) => {
    await page.goto('/games/magic-graph')
    await expectHydrated(page)

    const puzzlesSection = page
      .locator('[data-slot="collapsible"]')
      .filter({ hasText: 'Puzzles' })

    await puzzlesSection
      .getByRole('button', { name: /Expand|Collapse/i })
      .click()

    await expect(
      puzzlesSection.locator('[data-slot="collapsible-content"]'),
    ).toBeVisible()

    await expect(puzzlesSection.getByLabel('Practice seed')).toBeVisible()
  })

  test('sequence-race: renders on mobile without overflow', async ({
    page,
  }) => {
    await page.goto('/games/sequence-race')
    await expectHydrated(page)
    await expectNoHorizontalOverflow(page)

    await expect(page.getByRole('heading', { name: 'Race Line' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible()
  })

  test('shape-architect: renders on mobile without overflow', async ({
    page,
  }) => {
    await page.goto('/games/shape-architect')
    await expectHydrated(page)
    await expectNoHorizontalOverflow(page)

    await expect(page.getByRole('heading', { name: 'Blueprint' })).toBeVisible()
  })
})

test.describe('mobile layout — profile', () => {
  test('renders without horizontal overflow', async ({ page }) => {
    await page.goto('/profile')
    await expectHydrated(page)
    await expectNoHorizontalOverflow(page)
  })

  test('player identity section is visible on mobile', async ({ page }) => {
    await page.goto('/profile')
    await expectHydrated(page)
    await expect(
      page.getByText('Player', { exact: false }).first(),
    ).toBeVisible()
  })
})

test.describe('mobile layout — daily', () => {
  test('renders without horizontal overflow', async ({ page }) => {
    await page.goto('/daily')
    await expectHydrated(page)
    await expectNoHorizontalOverflow(page)
  })
})
