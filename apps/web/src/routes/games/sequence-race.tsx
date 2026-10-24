import { createFileRoute } from '@tanstack/react-router'

import { getSequenceRaceLevel } from '@/games/sequence-race.functions'
import { SequenceRaceRoute } from './-sequence-race-route'
import { validateLevelSearch } from '@/games/level-search'
import { RouteErrorFallback } from '@/routes/-route-error'
import { GameRoutePending } from '@/routes/-route-pending'

export const Route = createFileRoute('/games/sequence-race')({
  validateSearch: validateLevelSearch,
  loader: () => getSequenceRaceLevel(),
  component: SequenceRaceRoute,
  errorComponent: RouteErrorFallback,
  pendingComponent: GameRoutePending,
})
