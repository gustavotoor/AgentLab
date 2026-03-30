'use client'

import { useTheme as useNextTheme } from 'next-themes'
import { useSession } from 'next-auth/react'

/**
 * Extended theme hook that wraps next-themes and syncs with user preferences.
 * @returns Theme state and control functions
 */
export function useTheme() {
  const { theme, setTheme, resolvedTheme, systemTheme } = useNextTheme()
  const { data: session } = useSession()

  return {
    theme,
    resolvedTheme,
    systemTheme,
    setTheme,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
    userTheme: session?.user?.theme ?? 'light',
  }
}
