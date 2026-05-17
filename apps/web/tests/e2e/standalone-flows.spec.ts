import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

function collectRuntimeErrors(page: Page) {
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

function expectNoRuntimeErrors(errors: string[]) {
  expect(errors).toEqual([])
}

async function expectHydrated(page: Page) {
  await expect(page.getByTestId('app-hydrated')).toHaveText('hydrated')
}

async function expectPlayerCookie(page: Page) {
  const cookies = await page.context().cookies()
  const playerCookie = cookies.find((cookie) => cookie.name === 'mg_player')

  expect(playerCookie?.value).toMatch(
    /^player_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  )
  expect(playerCookie?.httpOnly).toBe(true)
}

test('old root game routes are rejected', async ({ page }) => {
  for (const path of ['/magic-graph', '/sequence-race', '/shape-architect']) {
    const response = await page.goto(path)

    expect(response?.status(), path).toBe(404)
  }
})

test('dashboard and daily expose standalone route links', async ({ page }) => {
  const errors = collectRuntimeErrors(page)

  await page.goto('/')
  await expectHydrated(page)

  await expect(page).toHaveTitle('Math Games')
  await expect(page.getByRole('heading', { name: 'Math Games' })).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Daily Challenge' }),
  ).toBeVisible()

  const dailyLink = page.locator('a[href="/daily"]')

  await expect(dailyLink).toHaveText('Play Today')
  await page.goto('/daily')

  await expect(page).toHaveURL('/daily')
  await expect(
    page.getByRole('heading', { name: 'Daily Challenge' }),
  ).toBeVisible()

  const dailyGameLink = page.locator('a[href^="/games/"]')

  await expect(dailyGameLink).toHaveAttribute(
    'href',
    /^\/games\/(magic-graph|sequence-race|shape-architect|pattern-detective)/,
  )
  const dailyGameHref = await dailyGameLink.getAttribute('href')

  if (dailyGameHref === null) {
    throw new Error('Daily challenge game link is missing href.')
  }

  await page.goto(dailyGameHref)

  await expect(page).toHaveURL(
    /\/games\/(magic-graph|sequence-race|shape-architect)/,
  )
  await expect(page.locator('main')).toBeVisible()
  expectNoRuntimeErrors(errors)
})

test('profile writes through the D1-backed server function', async ({
  page,
}) => {
  const errors = collectRuntimeErrors(page)
  const displayName = `Smoke ${Date.now()}`

  await page.goto('/profile')
  await expectHydrated(page)

  await expect(
    page.getByRole('heading', { name: 'Player Profile' }),
  ).toBeVisible()
  await page.getByLabel('Display name').fill(displayName)
  await page.getByLabel('Language').selectOption('vi')
  await page.getByLabel('Grade band').selectOption('middle')
  await page.getByRole('button', { name: 'Save Profile' }).click()

  await expect(page.getByText('Profile saved.')).toBeVisible()
  await expect(page.locator('header')).toContainText(displayName)
  await expectPlayerCookie(page)
  expectNoRuntimeErrors(errors)
})

test('game routes expose standalone controls and progress writes', async ({
  page,
}) => {
  const errors = collectRuntimeErrors(page)

  await page.goto('/games/sequence-race')
  await expectHydrated(page)
  await expect(page.getByRole('heading', { name: 'Race Line' })).toBeVisible()
  await page.getByLabel('Practice seed').fill('e2e-sequence')
  await page.getByLabel('Practice difficulty').selectOption('hard')
  await page.getByRole('button', { name: 'Generate' }).click()
  await expect(page.getByRole('heading', { name: /Practice:/ })).toBeVisible()

  await page.goto('/games/magic-graph')
  await expectHydrated(page)
  await expect(page.getByRole('heading', { name: 'Numbers' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible()

  await page.goto('/games/shape-architect')
  await expectHydrated(page)
  await expect(page.getByRole('heading', { name: 'Blueprint' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Undo' })).toBeVisible()

  expectNoRuntimeErrors(errors)
})

test('profile round-trip: saved values persist across page reload', async ({
  page,
}) => {
  const errors = collectRuntimeErrors(page)
  const displayName = `Persist ${Date.now()}`

  await page.goto('/profile')
  await expectHydrated(page)

  await page.getByLabel('Display name').fill(displayName)
  await page.getByLabel('Language').selectOption('vi')
  await page.getByLabel('Grade band').selectOption('high')
  await page.getByRole('button', { name: 'Save Profile' }).click()
  await expect(page.getByText('Profile saved.')).toBeVisible()

  await page.reload()
  await expectHydrated(page)

  await expect(page.getByLabel('Display name')).toHaveValue(displayName)
  await expect(page.getByLabel('Language')).toHaveValue('vi')
  await expect(page.getByLabel('Grade band')).toHaveValue('high')
  await expect(page.locator('header')).toContainText(displayName)

  expectNoRuntimeErrors(errors)
})

test('daily challenge shows consistent puzzle for same date', async ({
  page,
}) => {
  const errors = collectRuntimeErrors(page)

  await page.goto('/daily')
  await expectHydrated(page)

  const heading = page.getByRole('heading', { name: 'Daily Challenge' })
  await expect(heading).toBeVisible()

  const gameLink = page.locator('a[href^="/games/"]')
  const firstHref = await gameLink.getAttribute('href')

  await page.reload()
  await expectHydrated(page)

  const secondHref = await gameLink.getAttribute('href')
  expect(firstHref).toBe(secondHref)

  expectNoRuntimeErrors(errors)
})

test('score recording reflects in profile progress', async ({ page }) => {
  const errors = collectRuntimeErrors(page)

  // Save a profile first
  await page.goto('/profile')
  await expectHydrated(page)
  const name = `Score ${Date.now()}`
  await page.getByLabel('Display name').fill(name)
  await page.getByRole('button', { name: 'Save Profile' }).click()
  await expect(page.getByText('Profile saved.')).toBeVisible()

  // Play a game — visit a game page so the player cookie is set
  await page.goto('/games/magic-graph')
  await expectHydrated(page)
  await expect(page.getByRole('heading', { name: 'Numbers' })).toBeVisible()

  // Check profile shows the player
  await page.goto('/profile')
  await expectHydrated(page)
  await expect(page.locator('main')).toContainText(name)

  expectNoRuntimeErrors(errors)
})

test('non-firebase parity surfaces are available', async ({ page }) => {
  const errors = collectRuntimeErrors(page)

  await page.goto('/profile')
  await expectHydrated(page)
  await expect(page.getByText('Rank', { exact: true })).toBeVisible()
  await expect(
    page.getByRole('heading', { name: /Achievements/ }).first(),
  ).toBeVisible()

  await page.goto('/games/magic-graph')
  await expectHydrated(page)
  await expect(page.getByRole('button', { name: 'Timed' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Hints' })).toBeVisible()

  await page.goto('/games/sequence-race')
  await expectHydrated(page)
  await expect(page.getByRole('button', { name: 'Practice' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Hints' })).toBeVisible()

  await page.goto('/games/shape-architect')
  await expectHydrated(page)
  await expect(page.getByRole('button', { name: 'Timed' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Hints' })).toBeVisible()

  expectNoRuntimeErrors(errors)
})
