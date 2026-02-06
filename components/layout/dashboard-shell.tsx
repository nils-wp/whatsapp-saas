'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'
import { TenantProvider } from '@/providers/tenant-provider'
import { QueryProvider } from '@/providers/query-provider'
import { LocaleProvider } from '@/providers/locale-provider'
import { Toaster } from '@/components/ui/sonner'

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
          <div className="min-h-screen bg-background">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block">
              <Sidebar />
            </div>

            {/* Mobile Navigation */}
            <MobileNav
              open={mobileNavOpen}
              onClose={() => setMobileNavOpen(false)}
            />

            {/* Main Content Area */}
            <div className="lg:pl-[240px]">
              {/* Header */}
              <Header onMenuClick={() => setMobileNavOpen(true)} />

              {/* Main Content */}
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
