'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { TenantProvider } from '@/providers/tenant-provider'
import { QueryProvider } from '@/providers/query-provider'
import { LocaleProvider } from '@/providers/locale-provider'
import { Toaster } from '@/components/ui/sonner'
import { Menu, Search, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/shared/language-switcher'

export function DashboardShell({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <LocaleProvider>
      <QueryProvider>
        <TenantProvider>
          <div className="min-h-screen bg-[#0b141a]">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block">
              <Sidebar />
            </div>

            {/* Mobile Navigation */}
            <MobileNav
              open={mobileNavOpen}
              onClose={() => setMobileNavOpen(false)}
            />

            {/* Mobile Header */}
            <div className="lg:hidden sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#222d34] bg-[#111b21] px-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileNavOpen(true)}
                  className="text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33]"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <span className="font-semibold text-[#e9edef]">Chatsetter</span>
              </div>
              <div className="flex items-center gap-1">
                <LanguageSwitcher />
              </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:flex fixed top-0 right-0 left-[72px] h-[60px] items-center justify-between border-b border-[#222d34] bg-[#111b21] px-6 z-30">
              <div className="flex items-center gap-4">
                <h1 className="text-lg font-semibold text-[#e9edef]">Chatsetter</h1>
              </div>
              <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33] rounded-full"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:pl-[72px] lg:pt-[60px]">
              <main className="p-4 sm:p-6">
                <div className="mx-auto max-w-7xl">
                  {children}
                </div>
              </main>
            </div>

            <Toaster />
          </div>
        </TenantProvider>
      </QueryProvider>
    </LocaleProvider>
  )
}
