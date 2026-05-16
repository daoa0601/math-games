import { createServerFn } from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'
import { Schema } from 'effect'

import {
  createImportAchievementsPipeline,
  createUpdateProfilePipeline,
} from '@/games/server-handlers'
import { runServerEffect } from '@math-games/services'

import { AchievementImportInput, PlayerProfileInput } from './profile.schema'
import { loadPlayerProfileOverview } from './profile.server'

export const getPlayerProfileOverview = createServerFn({
  method: 'GET',
}).handler(() => {
  setResponseHeader('cache-control', 'no-store')

  return runServerEffect(loadPlayerProfileOverview())
})

export const updatePlayerProfile = createServerFn({ method: 'POST' })
  .inputValidator(Schema.decodeUnknownSync(PlayerProfileInput))
  .handler(({ data }) => runServerEffect(createUpdateProfilePipeline(data)))

export const importPlayerAchievementBackup = createServerFn({ method: 'POST' })
  .inputValidator(Schema.decodeUnknownSync(AchievementImportInput))
  .handler(({ data }) =>
    runServerEffect(createImportAchievementsPipeline(data)),
  )
