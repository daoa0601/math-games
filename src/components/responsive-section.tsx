import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

interface ResponsiveSectionProps {
  title: string
  description?: string
  children: ReactNode
  actions?: ReactNode
  className?: string
}

export function ResponsiveSection({
  title,
  description,
  children,
  actions,
  className,
}: ResponsiveSectionProps) {
  const [open, setOpen] = useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={className}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">{title}</h2>
            <CollapsibleTrigger
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted md:hidden"
              aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
            >
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform',
                  open && 'rotate-180',
                )}
              />
            </CollapsibleTrigger>
          </div>
          {description ? (
            <p className="mt-2 text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>

      <CollapsibleContent
        forceMount
        className="data-[state=closed]:hidden md:data-[state=closed]:!block"
      >
        {actions ? <div className="mt-4">{actions}</div> : null}
        <div className="mt-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}
