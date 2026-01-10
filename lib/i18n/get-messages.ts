import type { Locale } from './config'

const messageImports = {
  de: () => import('@/messages/de.json'),
  en: () => import('@/messages/en.json'),
  es: () => import('@/messages/es.json'),
  fr: () => import('@/messages/fr.json'),
}

export async function getMessages(locale: Locale) {
  const messages = await messageImports[locale]()
  return messages.default
}
