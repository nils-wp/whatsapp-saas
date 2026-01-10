'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { NextIntlClientProvider, useTranslations as useNextIntlTranslations } from 'next-intl'
import { type Locale, defaultLocale, locales } from '@/lib/i18n/config'

// Messages cache
const messagesCache: Partial<Record<Locale, Record<string, unknown>>> = {}

async function loadMessages(locale: Locale): Promise<Record<string, unknown>> {
  if (messagesCache[locale]) {
    return messagesCache[locale]!
  }

  const messages = await import(`@/messages/${locale}.json`)
  messagesCache[locale] = messages.default
  return messages.default
}

interface LocaleContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  isLoading: boolean
}

const LocaleContext = createContext<LocaleContextType | null>(null)

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }
  return context
}

// Re-export useTranslations from next-intl
export { useNextIntlTranslations as useTranslations }

interface LocaleProviderProps {
  children: ReactNode
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)
  const [messages, setMessages] = useState<Record<string, unknown> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load saved locale from localStorage
  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale | null
    if (savedLocale && locales.includes(savedLocale)) {
      setLocaleState(savedLocale)
    }
  }, [])

  // Load messages when locale changes
  useEffect(() => {
    setIsLoading(true)
    loadMessages(locale)
      .then((msgs) => {
        setMessages(msgs)
        setIsLoading(false)
      })
      .catch((error) => {
        console.error('Failed to load messages:', error)
        setIsLoading(false)
      })
  }, [locale])

  const setLocale = useCallback((newLocale: Locale) => {
    localStorage.setItem('locale', newLocale)
    setLocaleState(newLocale)
  }, [])

  // Show loading state or placeholder while messages load
  if (isLoading || !messages) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    )
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, isLoading }}>
      <NextIntlClientProvider locale={locale} messages={messages} timeZone="Europe/Berlin">
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  )
}
