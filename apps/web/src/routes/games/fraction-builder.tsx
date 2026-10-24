import { createFileRoute } from '@tanstack/react-router'

import { getFractionBuilderCatalog } from '@/games/fraction-builder.functions'
import { FractionBuilderRoute } from './-fraction-builder-route'
import { validateLevelSearch } from '@/games/level-search'
import { RouteErrorFallback } from '@/routes/-route-error'
import { GameRoutePending } from '@/routes/-route-pending'

export const Route = createFileRoute('/games/fraction-builder')({
  validateSearch: validateLevelSearch,
  loader: () => getFractionBuilderCatalog(),
  component: FractionBuilderRoute,
  errorComponent: RouteErrorFallback,
  pendingComponent: GameRoutePending,
})
