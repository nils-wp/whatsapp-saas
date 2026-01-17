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
import { useTranslations } from '@/providers/locale-provider'

const navigation = [
  { key: 'dashboard', href: '/', icon: LayoutDashboard },
  { key: 'agents', href: '/agents', icon: Bot },
  { key: 'triggers', href: '/triggers', icon: Zap },
  { key: 'phoneNumbers', href: '/accounts', icon: Phone },
  { key: 'integrations', href: '/integrations', icon: Plug },
  { key: 'templates', href: '/templates', icon: FileText },
  { key: 'settings', href: '/settings', icon: Settings },
]

interface MobileNavProps {
  open: boolean
  onClose: () => void
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname()
  const { user } = useTenant()
  const t = useTranslations('nav')

  const userInitials = user?.user_metadata?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || user?.email?.[0].toUpperCase() || 'U'

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-72 p-0 bg-[#111b21] border-[#222d34]">
        {/* Logo */}
        <div className="flex items-center justify-between gap-3 px-4 py-4 border-b border-[#222d34]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#00a884] flex items-center justify-center">
              <svg
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
              >
                <path
                  d="M16 4C9.373 4 4 9.373 4 16C4 18.251 4.632 20.35 5.73 22.15L4 28L10.05 26.34C11.78 27.34 13.82 27.92 16 27.92C22.627 27.92 28 22.547 28 15.92C28 9.373 22.627 4 16 4Z"
                  fill="white"
                />
                <path
                  d="M21.5 18.5C21.2 19.4 19.8 20.2 18.7 20.4C17.9 20.5 16.9 20.6 14.3 19.5C11.1 18.1 9.1 14.8 8.9 14.5C8.7 14.2 7.3 12.3 7.3 10.4C7.3 8.5 8.3 7.5 8.7 7.1C9.1 6.7 9.5 6.6 9.8 6.6C10 6.6 10.2 6.6 10.4 6.6C10.6 6.6 10.9 6.5 11.2 7.2C11.5 7.9 12.2 9.8 12.3 10C12.4 10.2 12.4 10.4 12.3 10.6C12.2 10.8 12.1 11 11.9 11.2C11.7 11.4 11.5 11.7 11.3 11.9C11.1 12.1 10.9 12.3 11.1 12.6C11.3 13 12.2 14.5 13.5 15.6C15.2 17 16.6 17.5 17 17.7C17.4 17.9 17.6 17.9 17.8 17.6C18 17.4 18.9 16.3 19.2 15.9C19.5 15.5 19.8 15.6 20.1 15.7C20.4 15.8 22.3 16.7 22.6 16.9C23 17.1 23.2 17.2 23.3 17.4C23.4 17.6 23.4 18.4 21.5 18.5Z"
                  fill="#00a884"
                />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-[#e9edef] text-base">Chatsetter</span>
              <span className="text-xs text-[#8696a0]">AI Appointment Setter</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33] rounded-full"
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
                key={item.key}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-[#00a884]/15 text-[#00a884]'
                    : 'text-[#8696a0] hover:bg-[#202c33] hover:text-[#e9edef]'
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#00a884] rounded-r-full" />
                )}
                <item.icon className="h-5 w-5" />
                <span>{t(item.key)}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Profile */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-[#222d34] p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#00a884] to-[#02735e] flex items-center justify-center text-white text-sm font-semibold">
              {userInitials}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-[#e9edef] truncate">{userName}</span>
              <span className="text-xs text-[#00a884]">Premium Plan</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
