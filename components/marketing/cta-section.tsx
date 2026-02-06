import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, MessageSquare } from "lucide-react"

export function CTASection() {
  return (
    <section className="py-20 sm:py-32 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/0 via-emerald-500/5 to-slate-900/0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/20 mb-8">
          <MessageSquare className="w-8 h-8 text-emerald-500" />
        </div>

        {/* Headline */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
          Bereit, deine WhatsApp-Kommunikation zu automatisieren?
        </h2>

        {/* Description */}
        <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          Starte jetzt kostenlos und erlebe, wie KI-Agenten deine Leads qualifizieren
          und dein Vertriebsteam entlasten. Keine Kreditkarte erforderlich.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white text-lg px-8 py-6 rounded-xl group"
          >
            <Link href="/signup" className="flex items-center gap-2">
              Jetzt kostenlos starten
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full sm:w-auto border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-white text-lg px-8 py-6 rounded-xl"
          >
            <Link href="/kontakt">Vertrieb kontaktieren</Link>
          </Button>
        </div>

        {/* Trust indicators */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-gray-500">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">Kostenlose Testphase</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">Einrichtung in 5 Minuten</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">Jederzeit kuendbar</span>
          </div>
        </div>
      </div>
    </section>
  )
}
