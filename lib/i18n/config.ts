export const locales = ['de', 'en', 'es', 'fr'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'de'

export const localeNames: Record<Locale, string> = {
  de: 'Deutsch',
  en: 'English',
  es: 'Español',
  fr: 'Français',
}

export const localeFlags: Record<Locale, string> = {
  de: '🇩🇪',
  en: '🇬🇧',
  es: '🇪🇸',
  fr: '🇫🇷',
}
