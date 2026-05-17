import { cn } from './cn'

interface WordmarkProps {
  label: string
  className?: string
  compact?: boolean
}

export function Wordmark({ label, className, compact = false }: WordmarkProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <svg
        aria-hidden="true"
        viewBox="0 0 32 32"
        className={cn(
          'text-current',
          compact ? 'size-5' : 'size-7 md:size-8',
        )}
      >
        <line
          x1="9"
          y1="10"
          x2="23"
          y2="10"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.45"
        />
        <line
          x1="9"
          y1="10"
          x2="16"
          y2="23"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <line
          x1="23"
          y1="10"
          x2="16"
          y2="23"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="9" cy="10" r="3" fill="currentColor" />
        <circle cx="23" cy="10" r="3" fill="currentColor" />
        <circle cx="16" cy="23" r="3" fill="currentColor" />
      </svg>
      <span
        className={cn(
          'font-display font-medium tracking-tight',
          compact ? 'text-base' : 'text-2xl md:text-3xl',
        )}
      >
        {label}
      </span>
    </div>
  )
}
