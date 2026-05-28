import { expect } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'

export function collectRuntimeErrors(page: Page) {
  const errors: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text())
    }
  })

  page.on('pageerror', (error) => {
    errors.push(error.message)
  })

  return errors
}

export function expectNoRuntimeErrors(errors: string[]) {
  expect(errors).toEqual([])
}

export async function expectHydrated(page: Page) {
  await expect(page.getByTestId('app-hydrated')).toHaveText('hydrated')
}

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth
  })
  expect(overflow).toBe(false)
}

export function desktopLayout(page: Page): Locator {
  return page.locator('[class*="md\\:flex"]').first()
}

export function mobileLayout(page: Page): Locator {
  return page.locator('[class*="md\\:hidden"]').first()
}
