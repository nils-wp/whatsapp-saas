import { DashboardShell } from '@/components/layout/dashboard-shell'

// Force dynamic rendering - dashboard requires runtime environment variables
export const dynamic = 'force-dynamic'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardShell>{children}</DashboardShell>
}
