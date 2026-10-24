import { expect, test } from '@playwright/test'
import type { Response } from '@playwright/test'

import { expectHydrated, mobileLayout } from './_helpers'

test.use({ viewport: { width: 375, height: 667 } })

async function mintedPlayerIds(response: Response): Promise<string[]> {
  const headers = await response.headersArray()
  return headers
    .filter((header) => header.name.toLowerCase() === 'set-cookie')
    .flatMap((header) => header.value.split('\n'))
    .map((cookie) => /^mg_player=([^;]+)/.exec(cookie)?.[1])
    .filter((id): id is string => id !== undefined)
}

// Game loaders only fetch catalogs, so a visitor who lands on a game page has
// no mg_player cookie yet. Navigating client-side to the dashboard then loads
// the daily challenge and the profile; both must belong to one minted player.
test('client-side navigation from a game page mints a single player', async ({
  page,
}) => {
  const pending: Promise<string[]>[] = []
  page.on('response', (response) => pending.push(mintedPlayerIds(response)))

  await page.goto('/games/magic-graph')
  await expectHydrated(page)
  expect((await Promise.all(pending)).flat()).toEqual([])

  await page.getByRole('button', { name: 'Dashboard' }).last().click()
  await expect(page).toHaveURL(/\/$/)
  // The dashboard renders only once its loader data (daily + profile) arrived.
  await expect(
    mobileLayout(page).getByText('Start', { exact: false }).first(),
  ).toBeVisible()

  const minted = new Set((await Promise.all(pending)).flat())
  expect(minted.size).toBe(1)

  const cookie = (await page.context().cookies()).find(
    (candidate) => candidate.name === 'mg_player',
  )
  expect(minted.has(cookie?.value ?? '')).toBe(true)
})
