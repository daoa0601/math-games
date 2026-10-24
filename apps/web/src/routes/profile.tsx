import { createFileRoute } from '@tanstack/react-router'

import { getPlayerProfileOverview } from '@/player/profile.functions'
import { ProfileRoute } from './-profile-route'
import { RouteErrorFallback } from '@/routes/-route-error'
import { RoutePending } from '@/routes/-route-pending'

export const Route = createFileRoute('/profile')({
  loader: () => getPlayerProfileOverview(),
  component: ProfileRoute,
  errorComponent: RouteErrorFallback,
  pendingComponent: RoutePending,
})
