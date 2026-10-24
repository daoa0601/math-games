import { createFileRoute } from '@tanstack/react-router'

import { getShapeArchitectLevel } from '@/games/shape-architect.functions'
import { ShapeArchitectRoute } from './-shape-architect-route'
import { validateLevelSearch } from '@/games/level-search'
import { RouteErrorFallback } from '@/routes/-route-error'
import { GameRoutePending } from '@/routes/-route-pending'

export const Route = createFileRoute('/games/shape-architect')({
  validateSearch: validateLevelSearch,
  loader: () => getShapeArchitectLevel(),
  component: ShapeArchitectRoute,
  errorComponent: RouteErrorFallback,
  pendingComponent: GameRoutePending,
})
