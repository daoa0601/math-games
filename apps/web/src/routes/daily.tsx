import { createFileRoute } from '@tanstack/react-router'

import { getDailyChallenge } from '@/daily/daily.functions'
import { getPlayerProfileOverview } from '@/player/profile.functions'
import { DailyRoute } from './-daily-route'
import { RouteErrorFallback } from '@/routes/-route-error'
import { RoutePending } from '@/routes/-route-pending'

export const Route = createFileRoute('/daily')({
  loader: async () => {
    const [challenge, overview] = await Promise.all([
      getDailyChallenge(),
      getPlayerProfileOverview(),
    ])
    return { challenge, overview }
  },
  component: DailyRoute,
  errorComponent: RouteErrorFallback,
  pendingComponent: RoutePending,
})
