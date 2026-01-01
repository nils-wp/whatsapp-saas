'use client'

import { Menu, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserMenu } from './user-menu'
import { ProjectSelector } from './project-selector'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Menu öffnen</span>
      </Button>

      {/* Project Selector */}
      <ProjectSelector />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              3
            </Badge>
            <span className="sr-only">Benachrichtigungen</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>Benachrichtigungen</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
            <span className="font-medium">Neue Eskalation</span>
            <span className="text-sm text-muted-foreground">
              Ein Lead hat nach dem Preis gefragt und wartet auf Antwort.
            </span>
            <span className="text-xs text-muted-foreground">vor 5 Minuten</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
            <span className="font-medium">Termin gebucht</span>
            <span className="text-sm text-muted-foreground">
              Max Mustermann hat einen Termin für morgen 14:00 Uhr gebucht.
            </span>
            <span className="text-xs text-muted-foreground">vor 15 Minuten</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
            <span className="font-medium">WhatsApp verbunden</span>
            <span className="text-sm text-muted-foreground">
              Deine neue Nummer +49 151 12345678 ist jetzt aktiv.
            </span>
            <span className="text-xs text-muted-foreground">vor 1 Stunde</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="justify-center text-primary">
            Alle anzeigen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User menu */}
      <UserMenu />
    </header>
  )
}
