import { createFileRoute } from '@tanstack/react-router'

import { getMagicGraphLevel } from '@/games/magic-graph.functions'
import { MagicGraphRoute } from './-magic-graph-route'
import { validateLevelSearch } from '@/games/level-search'
import { RouteErrorFallback } from '@/routes/-route-error'
import { GameRoutePending } from '@/routes/-route-pending'

export const Route = createFileRoute('/games/magic-graph')({
  validateSearch: validateLevelSearch,
  loader: () => getMagicGraphLevel(),
  component: MagicGraphRoute,
  errorComponent: RouteErrorFallback,
  pendingComponent: GameRoutePending,
})
