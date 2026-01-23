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
import { ChatsetterLogo } from '@/components/shared/chatsetter-logo'
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
          <ChatsetterLogo size={40} showText />
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
