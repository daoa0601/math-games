import { createFileRoute } from '@tanstack/react-router'

import { getEquationBalanceCatalog } from '@/games/equation-balance.functions'
import { EquationBalanceRoute } from './-equation-balance-route'
import { validateLevelSearch } from '@/games/level-search'
import { RouteErrorFallback } from '@/routes/-route-error'
import { GameRoutePending } from '@/routes/-route-pending'

export const Route = createFileRoute('/games/equation-balance')({
  validateSearch: validateLevelSearch,
  loader: () => getEquationBalanceCatalog(),
  component: EquationBalanceRoute,
  errorComponent: RouteErrorFallback,
  pendingComponent: GameRoutePending,
})
