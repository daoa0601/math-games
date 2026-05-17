import type { ReactNode } from 'react'

import { cn } from './cn'
import { useT } from './use-t'

type TabId = 'home' | 'daily' | 'profile'

interface MobileTabBarProps {
  active: TabId
  onNavigate: (tab: TabId) => void
  className?: string
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={active ? 'text-primary' : 'text-muted-foreground'}
    >
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v9h14v-9" />
    </svg>
  )
}

function SunIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={active ? 'text-primary' : 'text-muted-foreground'}
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M4 12H2M22 12h-2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
    </svg>
  )
}

function AvatarIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={active ? 'text-primary' : 'text-muted-foreground'}
    >
      <circle cx="12" cy="9" r="4" />
      <path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" />
    </svg>
  )
}

const ICONS: Record<TabId, (props: { active: boolean }) => ReactNode> = {
  home: HomeIcon,
  daily: SunIcon,
  profile: AvatarIcon,
}

const LABEL_KEYS: Record<TabId, string> = {
  home: 'nav.home',
  daily: 'nav.daily',
  profile: 'nav.profile',
}

export function MobileTabBar({
  active,
  onNavigate,
  className,
}: MobileTabBarProps) {
  const t = useT()
  const tabs: TabId[] = ['home', 'daily', 'profile']

  return (
    <nav
      className={cn(
        'tab-bar-glass sticky bottom-0 z-40 grid grid-cols-3 border-t border-border px-2 pb-2 pt-1.5 md:hidden',
        className,
      )}
    >
      {tabs.map((tab) => {
        const on = tab === active
        const Icon = ICONS[tab]

        return (
          <button
            key={tab}
            onClick={() => onNavigate(tab)}
            className={cn(
              'flex flex-col items-center gap-1 border-none bg-transparent pb-1 pt-2',
              on
                ? 'font-semibold text-primary'
                : 'font-medium text-muted-foreground',
            )}
            style={{ fontSize: '0.6875rem' }}
          >
            <Icon active={on} />
            <span>{t(LABEL_KEYS[tab])}</span>
          </button>
        )
      })}
    </nav>
  )
}

export type { TabId }
