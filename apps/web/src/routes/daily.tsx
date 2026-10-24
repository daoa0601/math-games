import { createFileRoute } from '@tanstack/react-router'

import { getDailyChallengeAndOverview } from '@/daily/daily.functions'
import { DailyRoute } from './-daily-route'
import { RouteErrorFallback } from '@/routes/-route-error'
import { RoutePending } from '@/routes/-route-pending'

export const Route = createFileRoute('/daily')({
  loader: () => getDailyChallengeAndOverview(),
  component: DailyRoute,
  errorComponent: RouteErrorFallback,
  pendingComponent: RoutePending,
})
