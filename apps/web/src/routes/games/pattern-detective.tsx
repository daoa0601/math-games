import { createFileRoute } from '@tanstack/react-router'

import { getPatternDetectiveCatalog } from '@/games/pattern-detective.functions'
import { PatternDetectiveRoute } from './-pattern-detective-route'
import { validateLevelSearch } from '@/games/level-search'
import { RouteErrorFallback } from '@/routes/-route-error'
import { GameRoutePending } from '@/routes/-route-pending'

export const Route = createFileRoute('/games/pattern-detective')({
  validateSearch: validateLevelSearch,
  loader: () => getPatternDetectiveCatalog(),
  component: PatternDetectiveRoute,
  errorComponent: RouteErrorFallback,
  pendingComponent: GameRoutePending,
})
