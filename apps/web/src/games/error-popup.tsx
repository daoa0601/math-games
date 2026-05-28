import { Button, Card, CardContent } from '@math-games/ui'

interface ErrorPopupProps {
  message: string
  dismissLabel: string
  onDismiss: () => void
}

export function ErrorPopup({ message, dismissLabel, onDismiss }: ErrorPopupProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 animate-slide-up-fade"
      onClick={onDismiss}
      role="dialog"
      aria-modal="true"
    >
      <Card
        className="animate-scale-in w-full max-w-sm border border-destructive/30 shadow-(--card-shadow-long)"
        onClick={(event) => event.stopPropagation()}
      >
        <CardContent className="flex flex-col gap-4">
          <p className="font-display text-base font-medium tracking-tight text-destructive">
            {message}
          </p>
          <Button variant="outline" onClick={onDismiss} type="button">
            {dismissLabel}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
