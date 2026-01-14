import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/shared/lib/utils"

export interface ProgressProps extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  /** Show percentage label next to or below the progress bar */
  showLabel?: boolean
  /** Position of the label (inline = next to bar, below = underneath) */
  labelPosition?: 'inline' | 'below'
}

function Progress({
  className,
  value,
  showLabel = false,
  labelPosition = 'inline',
  ...props
}: ProgressProps) {
  const percentage = value ?? 0

  return (
    <div className={cn(
      "tw:flex tw:items-center tw:gap-2",
      labelPosition === 'below' && "tw:flex-col",
      className
    )}>
      <ProgressPrimitive.Root
        data-slot="progress"
        className={cn(
          "tw:bg-primary/20 tw:relative tw:h-2 tw:w-full tw:overflow-hidden tw:rounded-full",
          "tw: flex-1"
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className="tw:bg-primary tw:h-full tw:transition-all"
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
      </ProgressPrimitive.Root>
      {showLabel && (
        <span className="tw:text-xs tw:font-medium tw:text-muted-foreground tw:tabular-nums tw:whitespace-nowrap">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  )
}

export { Progress }
