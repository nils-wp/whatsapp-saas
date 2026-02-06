'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  MessageSquare,
  Bot,
  Users,
  Phone,
  Plug,
  Settings,
  X,
  PhoneCall,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ChatsetterLogo } from '@/components/shared/chatsetter-logo'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useTenant } from '@/providers/tenant-provider'
import { createClient } from '@/lib/supabase/client'

// Navigation structure with groups - same as sidebar
const navigationGroups = [
  {
    label: 'HAUPTMENU',
    items: [
      { key: 'dashboard', href: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { key: 'conversations', href: '/conversations', icon: MessageSquare, label: 'Konversationen' },
      { key: 'agents', href: '/agents', icon: Bot, label: 'Agenten' },
      { key: 'contacts', href: '/contacts', icon: Users, label: 'Kontakte' },
    ],
  },
  {
    label: 'TOOLS',
    items: [
      { key: 'numberCheck', href: '/tools', icon: PhoneCall, label: 'Nummer-Check' },
    ],
  },
  {
    label: 'EINSTELLUNGEN',
    items: [
      { key: 'phoneNumbers', href: '/accounts', icon: Phone, label: 'Accounts' },
      { key: 'integrations', href: '/integrations', icon: Plug, label: 'Integrationen' },
    ],
  },
]

interface MobileNavProps {
  open: boolean
  onClose: () => void
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useTenant()

  const userInitials = user?.user_metadata?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || user?.email?.[0].toUpperCase() || 'U'

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const userEmail = user?.email || ''

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-[280px] p-0 bg-slate-950 border-slate-800/50">
        {/* Logo */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-800/50">
          <ChatsetterLogo size={32} showText />
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-white/5 rounded-lg h-8 w-8"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navigationGroups.map((group, groupIndex) => (
            <div key={group.label} className={cn(groupIndex > 0 && 'mt-6')}>
              <div className="px-3 mb-2">
                <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                  {group.label}
                </span>
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href ||
                    (item.href !== '/' && pathname.startsWith(item.href))

                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-emerald-500 rounded-r-full" />
                      )}
                      <item.icon className={cn(
                        'h-5 w-5 shrink-0',
                        isActive ? 'text-emerald-500' : 'text-slate-400'
                      )} />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-800/50 bg-slate-950">
          <div className="p-3">
            {/* User Info */}
            <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 mb-2">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                {userInitials}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-medium text-white truncate">{userName}</span>
                <span className="text-xs text-slate-400 truncate">{userEmail}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-1">
              <button
                onClick={() => {
                  router.push('/settings')
                  onClose()
                }}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-all duration-200"
              >
                <Settings className="h-4 w-4" />
                <span>Einstellungen</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-white/5 hover:text-red-300 transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
                <span>Abmelden</span>
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
