/** Supported locales */
export const locales = ['pt-BR', 'en'] as const

/** Locale type */
export type Locale = (typeof locales)[number]

/** Default locale */
export const defaultLocale: Locale = 'pt-BR'

/** Locale display names */
export const localeNames: Record<Locale, string> = {
  'pt-BR': 'Português (BR)',
  en: 'English',
}

/** Locale flag emojis */
export const localeFlags: Record<Locale, string> = {
  'pt-BR': '🇧🇷',
  en: '🇺🇸',
}
