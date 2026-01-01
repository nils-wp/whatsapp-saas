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
  ChevronLeft,
  Plug,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

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

interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2">
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
            {!collapsed && (
              <span className="font-bold text-lg text-sidebar-foreground">
                ChatSetter
              </span>
            )}
          </Link>
          {onToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className={cn(
                'shrink-0 transition-transform text-sidebar-foreground hover:bg-sidebar-accent',
                collapsed && 'rotate-180'
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  collapsed && 'justify-center'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Navigation */}
        <div className="border-t border-sidebar-border px-2 py-4 space-y-1">
          {bottomNavigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/settings' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  collapsed && 'justify-center'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
