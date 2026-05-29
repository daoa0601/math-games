import { createFileRoute, notFound } from '@tanstack/react-router'

import { DesignCanvasRoute } from './-design-canvas-route'

export const Route = createFileRoute('/dev/design-canvas')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound()
  },
  component: DesignCanvasRoute,
})
