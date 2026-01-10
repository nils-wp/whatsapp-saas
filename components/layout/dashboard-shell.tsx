'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { TenantProvider } from '@/providers/tenant-provider'
import { QueryProvider } from '@/providers/query-provider'
import { LocaleProvider } from '@/providers/locale-provider'
import { Toaster } from '@/components/ui/sonner'
import { Menu } from 'lucide-react'
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
          <div className="min-h-screen bg-[#121212]">
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
            <div className="lg:hidden sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#1f1f1f] bg-[#121212] px-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileNavOpen(true)}
                  className="text-gray-400 hover:text-white"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <span className="font-semibold text-white">Chatsetter</span>
              </div>
              <LanguageSwitcher />
            </div>

            {/* Desktop Header with Language Switcher */}
            <div className="hidden lg:flex fixed top-0 right-0 left-64 h-14 items-center justify-end border-b border-[#1f1f1f] bg-[#121212] px-6 z-30">
              <LanguageSwitcher />
            </div>

            {/* Main Content */}
            <div className="lg:pl-64 lg:pt-14">
              <main className="p-4 sm:p-6 lg:p-8">
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
