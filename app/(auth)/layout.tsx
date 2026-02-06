import { Shield, Zap, MessageSquare } from 'lucide-react'
import { ChatsetterLogo } from '@/components/shared/chatsetter-logo'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950" />

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Ambient glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl" />

      {/* Content container */}
      <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center">
        {/* Logo */}
        <div className="mb-8">
          <ChatsetterLogo size={36} showText />
        </div>

        {/* Main card with subtle glow */}
        <div className="w-full relative">
          {/* Card glow effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-b from-slate-700/50 to-slate-800/50 rounded-2xl blur-sm" />

          {/* Card */}
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
            {children}
          </div>
        </div>

        {/* Feature highlights - minimal */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-slate-500 text-sm">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-500/70" />
            <span>KI-Automatisierung</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-emerald-500/70" />
            <span>WhatsApp API</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-500/70" />
            <span>DSGVO-konform</span>
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-10 pt-6 border-t border-slate-800/50 w-full">
          <div className="flex items-center justify-center gap-8 text-slate-600 text-xs">
            <div className="flex items-center gap-1.5">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>SSL-verschlüsselt</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>EU-Hosting</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22,4 12,14.01 9,11.01" />
              </svg>
              <span>Azure OpenAI</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
