'use client'

import { Menu, Bell, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/shared/language-switcher'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-slate-800/50 bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-slate-950/80 px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden text-slate-400 hover:text-white hover:bg-white/5"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Menu oeffnen</span>
      </Button>

      {/* Search (optional - hidden on mobile) */}
      <div className="hidden md:flex flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            type="search"
            placeholder="Suchen..."
            className="w-full pl-9 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-9"
          />
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1 md:hidden" />

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-slate-400 hover:text-white hover:bg-white/5 h-9 w-9"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full bg-emerald-500 text-[10px] font-medium text-white flex items-center justify-center">
                3
              </span>
              <span className="sr-only">Benachrichtigungen</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-slate-900 border-slate-700">
            <DropdownMenuLabel className="text-white">Benachrichtigungen</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-700" />
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer">
              <span className="font-medium text-white">Neue Eskalation</span>
              <span className="text-sm text-slate-400">
                Ein Lead hat nach dem Preis gefragt und wartet auf Antwort.
              </span>
              <span className="text-xs text-slate-500">vor 5 Minuten</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer">
              <span className="font-medium text-white">Termin gebucht</span>
              <span className="text-sm text-slate-400">
                Max Mustermann hat einen Termin fuer morgen 14:00 Uhr gebucht.
              </span>
              <span className="text-xs text-slate-500">vor 15 Minuten</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer">
              <span className="font-medium text-white">WhatsApp verbunden</span>
              <span className="text-sm text-slate-400">
                Deine neue Nummer +49 151 12345678 ist jetzt aktiv.
              </span>
              <span className="text-xs text-slate-500">vor 1 Stunde</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-700" />
            <DropdownMenuItem className="justify-center text-emerald-500 hover:text-emerald-400 hover:bg-slate-800 cursor-pointer">
              Alle anzeigen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
