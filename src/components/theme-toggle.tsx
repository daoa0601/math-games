import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'

function getStoredTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem('mg-theme')
  return stored === 'dark' ? 'dark' : 'light'
}

function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  localStorage.setItem('mg-theme', theme)
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const stored = getStoredTheme()
    setTheme(stored)
    applyTheme(stored)
  }, [])

  function toggle() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    applyTheme(next)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={
        theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'
      }
      type="button"
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Button>
  )
}
