'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Phone,
  Bot,
  Zap,
  Plug,
  FileText,
  Settings,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useTenant } from '@/providers/tenant-provider'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Agents', href: '/agents', icon: Bot },
  { name: 'Triggers', href: '/triggers', icon: Zap },
  { name: 'Phone Numbers', href: '/accounts', icon: Phone },
  { name: 'Integrations', href: '/integrations', icon: Plug },
  { name: 'Templates', href: '/templates', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
]

interface MobileNavProps {
  open: boolean
  onClose: () => void
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname()
  const { user } = useTenant()

  const userInitials = user?.user_metadata?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || user?.email?.[0].toUpperCase() || 'U'

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-64 p-0 bg-[#0f0f0f] border-[#1f1f1f]">
        {/* Logo */}
        <div className="flex items-center justify-between gap-3 px-4 py-5 border-b border-[#1f1f1f]">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 shrink-0">
              <svg
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-9 w-9"
              >
                <rect width="32" height="32" rx="8" fill="#22c55e" />
                <path
                  d="M16 7C11.0294 7 7 11.0294 7 16C7 17.6569 7.45587 19.2101 8.25 20.5417L7.25 24.75L11.625 23.7917C12.9149 24.5341 14.4069 25 16 25C20.9706 25 25 20.9706 25 16C25 11.0294 20.9706 7 16 7Z"
                  fill="white"
                />
                <path
                  d="M20.5 18.5C20.25 19.25 19 20 18 20C17 20 14.5 19.5 12.5 17.5C10.5 15.5 10 13 10 12C10 11 10.75 9.75 11.5 9.5C11.75 9.42857 12.25 9.5 12.5 10C12.75 10.5 13.5 12 13.5 12.25C13.5 12.5 13.5 12.75 13.25 13C13 13.25 12.75 13.5 12.75 13.75C12.75 14 12.9107 14.1607 13 14.25C13.5 14.75 14.75 16 15.75 16.5C16.25 16.75 16.5 16.75 16.75 16.5C17 16.25 17.5 15.75 17.75 15.5C18 15.25 18.25 15.25 18.5 15.5C18.75 15.75 20 16.75 20.25 17C20.5 17.25 20.75 17.75 20.5 18.5Z"
                  fill="#22c55e"
                />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-white text-base">Chatsetter</span>
              <span className="text-xs text-gray-500">AI Appointment Setter</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-gray-200'
                )}
              >
                <item.icon className={cn('h-5 w-5', isActive && 'text-emerald-500')} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Profile */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-[#1f1f1f] p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-sm font-semibold">
              {userInitials}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-white truncate">{userName}</span>
              <span className="text-xs text-emerald-500">Premium Plan</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
