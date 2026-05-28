import { expect, test } from '@playwright/test'

import {
  expectHydrated,
  expectNoHorizontalOverflow,
  mobileLayout,
} from './_helpers'

const MOBILE_VIEWPORT = { width: 375, height: 667 }

test.use({ viewport: MOBILE_VIEWPORT })

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
      mobileLayout(page).getByText('Start', { exact: false }).first(),
    ).toBeVisible()
  })

  test('game cards are present in the page', async ({ page }) => {
    await page.goto('/')
    await expectHydrated(page)
    const mobile = mobileLayout(page)
    await expect(mobile.getByText('Magic Graph').first()).toBeAttached()
    await expect(mobile.getByText('Sequence Race').first()).toBeAttached()
    await expect(mobile.getByText('Shape Architect').first()).toBeAttached()
    await expect(mobile.getByText('Pattern Detective').first()).toBeAttached()
  })

  test('bottom tab bar is visible on mobile', async ({ page }) => {
    await page.goto('/')
    await expectHydrated(page)
    await expect(mobileLayout(page).getByRole('navigation')).toBeVisible()
  })
})

test.describe('mobile layout — game routes', () => {
  test('magic-graph: renders on mobile without overflow', async ({ page }) => {
    await page.goto('/games/magic-graph')
    await expectHydrated(page)
    await expectNoHorizontalOverflow(page)

    // The mobile layout is the md:hidden copy of the themed container (the
    // md:flex desktop copy renders first); assert its target heading mounted.
    const mobile = page.locator('[class*="theme-magic-graph"]').last()
    await expect(mobile.getByRole('heading', { name: /Target/ })).toBeVisible()
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
      mobileLayout(page).getByText('Player', { exact: false }).first(),
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
