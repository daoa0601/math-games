import { createFileRoute } from '@tanstack/react-router'

import { getMyClassrooms } from '@/classroom/classroom.functions'
import { ClassroomRoute } from './-classroom-route'
import { RouteErrorFallback } from '@/routes/-route-error'
import { RoutePending } from '@/routes/-route-pending'

export const Route = createFileRoute('/classroom')({
  loader: () => getMyClassrooms(),
  component: ClassroomRoute,
  errorComponent: RouteErrorFallback,
  pendingComponent: RoutePending,
})
