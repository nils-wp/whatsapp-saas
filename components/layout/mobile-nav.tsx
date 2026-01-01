'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Smartphone,
  Bot,
  Zap,
  MessageSquare,
  Inbox,
  BarChart3,
  Settings,
  X,
  Plug,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Agents', href: '/agents', icon: Bot },
  { name: 'Triggers', href: '/triggers', icon: Zap },
  { name: 'Accounts', href: '/accounts', icon: Smartphone },
  { name: 'Konversationen', href: '/conversations', icon: MessageSquare },
  { name: 'Queue', href: '/queue', icon: Inbox },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
]

const bottomNavigation = [
  { name: 'Integrationen', href: '/settings/integrations', icon: Plug },
  { name: 'Einstellungen', href: '/settings', icon: Settings },
]

interface MobileNavProps {
  open: boolean
  onClose: () => void
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-64 p-0 bg-sidebar">
        <SheetHeader className="h-16 flex flex-row items-center justify-between px-4 border-b border-sidebar-border">
          <SheetTitle className="flex items-center gap-2">
            <div className="relative h-8 w-8 shrink-0">
              <svg
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
              >
                <rect width="32" height="32" rx="8" className="fill-primary" />
                <path
                  d="M16 7C11.0294 7 7 11.0294 7 16C7 17.6569 7.45587 19.2101 8.25 20.5417L7.25 24.75L11.625 23.7917C12.9149 24.5341 14.4069 25 16 25C20.9706 25 25 20.9706 25 16C25 11.0294 20.9706 7 16 7Z"
                  fill="white"
                />
                <path
                  d="M20.5 18.5C20.25 19.25 19 20 18 20C17 20 14.5 19.5 12.5 17.5C10.5 15.5 10 13 10 12C10 11 10.75 9.75 11.5 9.5C11.75 9.42857 12.25 9.5 12.5 10C12.75 10.5 13.5 12 13.5 12.25C13.5 12.5 13.5 12.75 13.25 13C13 13.25 12.75 13.5 12.75 13.75C12.75 14 12.9107 14.1607 13 14.25C13.5 14.75 14.75 16 15.75 16.5C16.25 16.75 16.5 16.75 16.75 16.5C17 16.25 17.5 15.75 17.75 15.5C18 15.25 18.25 15.25 18.5 15.5C18.75 15.75 20 16.75 20.25 17C20.5 17.25 20.75 17.75 20.5 18.5Z"
                  className="fill-primary"
                />
              </svg>
            </div>
            <span className="font-bold text-sidebar-foreground">ChatSetter</span>
          </SheetTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <X className="h-5 w-5" />
          </Button>
        </SheetHeader>
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-sidebar-border px-2 py-4 space-y-1">
          {bottomNavigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/settings' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}
