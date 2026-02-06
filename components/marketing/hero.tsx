import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Play, Shield, MapPin, CreditCard } from "lucide-react"

const trustBadges = [
  { icon: Shield, text: "DSGVO-konform" },
  { icon: MapPin, text: "Made in Germany" },
  { icon: CreditCard, text: "Keine Kreditkarte noetig" },
]

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm text-emerald-400">
              Jetzt mit KI-Agenten der naechsten Generation
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6">
            WhatsApp-Automatisierung{" "}
            <span className="text-emerald-400">fuer dein Business</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Qualifiziere Leads automatisch, fuehre Verkaufsgespraeche rund um die Uhr und
            integriere dein CRM nahtlos. Mit KI-Agenten, die sich wie echte Mitarbeiter verhalten.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white text-lg px-8 py-6 rounded-xl"
            >
              <Link href="/signup">Kostenlos starten</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-white text-lg px-8 py-6 rounded-xl"
            >
              <Link href="#demo" className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Demo ansehen
              </Link>
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {trustBadges.map((badge) => (
              <div key={badge.text} className="flex items-center gap-2 text-gray-400">
                <badge.icon className="w-5 h-5 text-emerald-500" />
                <span className="text-sm">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Image/Mockup Placeholder */}
        <div className="mt-16 sm:mt-20 relative">
          <div className="relative mx-auto max-w-5xl">
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-emerald-500/20 rounded-2xl blur-xl" />

            {/* Mockup container */}
            <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl">
              {/* Browser bar */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 bg-slate-800 rounded-md h-8 mx-4" />
              </div>

              {/* Dashboard mockup */}
              <div className="aspect-[16/9] bg-slate-800/50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-emerald-500"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">Dashboard-Vorschau</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
