'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun, Monitor, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLocale } from '@/hooks/use-locale'
import { localeNames, localeFlags, type Locale } from '@/i18n/config'

interface TopBarProps {
  /** Page title to display */
  title?: string
  /** Additional actions to render on the right side */
  actions?: React.ReactNode
}

/**
 * Application top bar with theme toggle and locale switcher.
 */
export function TopBar({ title, actions }: TopBarProps) {
  const { setTheme, resolvedTheme } = useTheme()
  const { locale, switchLocale, locales } = useLocale()

  return (
    <header className="flex h-14 items-center justify-between border-b px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-3">
        {title && <h1 className="text-base font-semibold text-foreground">{title}</h1>}
      </div>

      <div className="flex items-center gap-2">
        {actions}

        {/* Locale switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Globe className="h-4 w-4" />
              <span className="sr-only">Switch language</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {locales.map((loc) => (
              <DropdownMenuItem
                key={loc}
                onClick={() => switchLocale(loc as Locale)}
                className={locale === loc ? 'font-medium text-primary' : ''}
              >
                <span className="mr-2">{localeFlags[loc as Locale]}</span>
                {localeNames[loc as Locale]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              {resolvedTheme === 'dark' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme('light')}>
              <Sun className="mr-2 h-4 w-4" />
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              <Moon className="mr-2 h-4 w-4" />
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>
              <Monitor className="mr-2 h-4 w-4" />
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export { TopBar as default }
