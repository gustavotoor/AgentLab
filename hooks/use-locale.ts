'use client'

import { useLocale as useNextIntlLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config'

/**
 * Hook for managing locale/language settings.
 * Changes the locale cookie and refreshes the page.
 * @returns Locale state and switching function
 */
export function useLocale() {
  const locale = useNextIntlLocale() as Locale
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  /**
   * Switches the application locale by updating the cookie and refreshing.
   * @param {Locale} newLocale - The locale to switch to
   */
  function switchLocale(newLocale: Locale): void {
    document.cookie = `locale=${newLocale};path=/;max-age=${60 * 60 * 24 * 365}`
    startTransition(() => {
      router.refresh()
    })
  }

  return {
    locale,
    locales,
    localeNames,
    localeFlags,
    switchLocale,
    isPending,
    currentLocaleName: localeNames[locale],
    currentLocaleFlag: localeFlags[locale],
  }
}
