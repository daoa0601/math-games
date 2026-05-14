import { RotateCw, Check, X } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface PlacementToolbarProps {
  pieceName: string
  rotationDeg: number
  canPlace: boolean
  onRotate: () => void
  onPlace: () => void
  onCancel: () => void
}

export function PlacementToolbar({
  pieceName,
  rotationDeg,
  canPlace,
  onRotate,
  onPlace,
  onCancel,
}: PlacementToolbarProps) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card p-1.5 shadow-lg">
      <span className="px-2 text-xs font-medium text-muted-foreground">
        {pieceName} {rotationDeg > 0 ? `${rotationDeg}°` : ''}
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onRotate}
        type="button"
        aria-label="Rotate piece"
      >
        <RotateCw className="h-4 w-4" />
      </Button>
      <Button
        variant={canPlace ? 'default' : 'ghost'}
        size="icon-sm"
        onClick={onPlace}
        disabled={!canPlace}
        type="button"
        aria-label="Place piece"
      >
        <Check className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onCancel}
        type="button"
        aria-label="Cancel placement"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
