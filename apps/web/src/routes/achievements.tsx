import { createFileRoute } from '@tanstack/react-router'

import { getPlayerProfileOverview } from '@/player/profile.functions'
import { AchievementsRoute } from './-achievements-route'
import { RouteErrorFallback } from '@/routes/-route-error'
import { RoutePending } from '@/routes/-route-pending'

export const Route = createFileRoute('/achievements')({
  loader: () => getPlayerProfileOverview(),
  component: AchievementsRoute,
  errorComponent: RouteErrorFallback,
  pendingComponent: RoutePending,
})
