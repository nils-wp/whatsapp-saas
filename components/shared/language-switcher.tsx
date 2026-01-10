'use client'

import { Globe } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useLocale } from '@/providers/locale-provider'
import { locales, localeNames, localeFlags, type Locale } from '@/lib/i18n/config'
import { cn } from '@/lib/utils'

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-gray-400 hover:text-white hover:bg-[#252525]"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{localeFlags[locale]} {localeNames[locale]}</span>
          <span className="sm:hidden">{localeFlags[locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[#2a2a2a]">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => setLocale(loc)}
            className={cn(
              'text-gray-300 focus:text-white focus:bg-[#252525] cursor-pointer',
              locale === loc && 'bg-emerald-500/10 text-emerald-500'
            )}
          >
            <span className="mr-2">{localeFlags[loc]}</span>
            {localeNames[loc]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
