import { createServerFn } from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'

import {
  createImportAchievementsPipeline,
  createUpdateProfilePipeline,
} from '@/games/server-handlers'
import { runServerEffect } from '@/services'

import { loadPlayerProfileOverview } from './profile.server'

export const getPlayerProfileOverview = createServerFn({
  method: 'GET',
}).handler(() => {
  setResponseHeader('cache-control', 'no-store')

  return runServerEffect(loadPlayerProfileOverview())
})

export const updatePlayerProfile = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => data)
  .handler(({ data }) => runServerEffect(createUpdateProfilePipeline(data)))

export const importPlayerAchievementBackup = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => data)
  .handler(({ data }) =>
    runServerEffect(createImportAchievementsPipeline(data)),
  )
