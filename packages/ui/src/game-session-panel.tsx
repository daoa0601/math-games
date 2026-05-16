import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Progress } from './ui/progress'
import { cn } from './cn'

import type { GameSessionMode } from './use-game-session'

interface GameSessionPanelProps {
  className?: string
  elapsedSeconds: number
  hints: readonly string[]
  labels: {
    hints: string
    pause: string
    practice: string
    resume: string
    timed: string
    timedOut: string
  }
  metricLabel: string
  metricValue: string
  mode: GameSessionMode
  paused: boolean
  remainingSeconds: number
  status?: string | null
  timedOut: boolean
  onModeChange: (mode: GameSessionMode) => void
  onPausedChange: (paused: boolean) => void
}

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function GameSessionPanel({
  className,
  elapsedSeconds,
  hints,
  labels,
  metricLabel,
  metricValue,
  mode,
  paused,
  remainingSeconds,
  status,
  timedOut,
  onModeChange,
  onPausedChange,
}: GameSessionPanelProps) {
  const timedProgress = ((60 - remainingSeconds) / 60) * 100

  return (
    <Card className={cn('gap-4', className)}>
      <CardContent>
        <div className="grid gap-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">{metricLabel}</p>
              <p className="mt-1 text-2xl font-semibold">{metricValue}</p>
            </div>
            <Badge variant={timedOut ? 'destructive' : 'secondary'}>
              {mode === 'timed'
                ? formatClock(remainingSeconds)
                : formatClock(elapsedSeconds)}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={mode === 'practice' ? 'default' : 'outline'}
              onClick={() => onModeChange('practice')}
              type="button"
            >
              {labels.practice}
            </Button>
            <Button
              variant={mode === 'timed' ? 'default' : 'outline'}
              onClick={() => onModeChange('timed')}
              type="button"
            >
              {labels.timed}
            </Button>
          </div>

          {mode === 'timed' ? (
            <Progress className="h-2" value={timedProgress} />
          ) : null}

          <Button
            variant="outline"
            onClick={() => onPausedChange(!paused)}
            type="button"
          >
            {paused ? labels.resume : labels.pause}
          </Button>

          {timedOut ? (
            <p className="border-t border-border pt-3 text-sm font-medium text-destructive">
              {labels.timedOut}
            </p>
          ) : null}

          {status ? (
            <p className="border-t border-border pt-3 text-sm text-muted-foreground">
              {status}
            </p>
          ) : null}

          <div className="border-t border-border pt-3">
            <h3 className="text-sm font-semibold">{labels.hints}</h3>
            <ul className="mt-2 grid gap-1.5 text-sm text-muted-foreground">
              {hints.map((hint) => (
                <li key={hint}>- {hint}</li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
