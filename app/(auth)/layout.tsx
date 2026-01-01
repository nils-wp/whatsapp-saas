import { MessageSquare } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:flex-1 bg-primary items-center justify-center p-12">
        <div className="max-w-md text-primary-foreground">
          <div className="flex items-center gap-3 mb-8">
            <MessageSquare className="h-10 w-10" />
            <span className="text-2xl font-bold">WhatsApp SaaS</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Automatisiere deine WhatsApp Kommunikation
          </h1>
          <p className="text-lg opacity-90">
            KI-gestützte Konversationen, die Leads in Kunden verwandeln.
            Rund um die Uhr, vollautomatisch.
          </p>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <MessageSquare className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">WhatsApp SaaS</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
