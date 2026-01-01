'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'
import { TenantProvider } from '@/providers/tenant-provider'
import { QueryProvider } from '@/providers/query-provider'
import { Toaster } from '@/components/ui/sonner'

export function DashboardShell({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <QueryProvider>
      <TenantProvider>
        <div className="min-h-screen bg-background">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block">
            <Sidebar
              collapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
          </div>

          {/* Mobile Navigation */}
          <MobileNav
            open={mobileNavOpen}
            onClose={() => setMobileNavOpen(false)}
          />

          {/* Main Content */}
          <div
            className={`transition-all duration-300 ${
              sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
            }`}
          >
            <Header onMenuClick={() => setMobileNavOpen(true)} />
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
  )
}
