import { createFileRoute } from '@tanstack/react-router'

import { AnalyticsDashboard } from './-analytics-route'
import { RouteErrorFallback } from '@/routes/-route-error'

export const Route = createFileRoute('/admin/analytics')({
  component: AnalyticsDashboard,
  errorComponent: RouteErrorFallback,
})
