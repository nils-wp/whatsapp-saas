import { QrCode, Settings, TrendingUp } from "lucide-react"

const steps = [
  {
    number: "01",
    icon: QrCode,
    title: "WhatsApp verbinden",
    description:
      "Scanne einfach einen QR-Code um deinen WhatsApp Business Account zu verbinden. Keine technischen Kenntnisse erforderlich.",
    highlight: "In unter 2 Minuten einsatzbereit",
  },
  {
    number: "02",
    icon: Settings,
    title: "Agent konfigurieren",
    description:
      "Definiere die Persoenlichkeit, Ziele und Gespraechsskripte deines KI-Agenten. Passe FAQ und Eskalationsregeln an.",
    highlight: "Drag-and-Drop Skript-Builder",
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Leads qualifizieren",
    description:
      "Dein Agent fuehrt automatisch Erstgespraeche, qualifiziert Leads und uebergibt heiße Kontakte an dein Vertriebsteam.",
    highlight: "24/7 automatische Lead-Qualifizierung",
  },
]

export function HowItWorks() {
  return (
    <section className="py-20 sm:py-32 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            So einfach funktioniert es
          </h2>
          <p className="text-lg text-gray-400">
            In nur drei Schritten zur vollautomatischen WhatsApp-Kommunikation.
            Keine Programmierkenntnisse erforderlich.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line - desktop only */}
          <div className="hidden lg:block absolute top-24 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-emerald-500/50 via-emerald-500 to-emerald-500/50" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                {/* Mobile connector */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden absolute left-6 top-20 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500 to-emerald-500/20" />
                )}

                <div className="relative bg-slate-900/50 border border-slate-800 rounded-xl p-6 lg:p-8">
                  {/* Step number */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
                        <span className="text-white font-bold">{step.number}</span>
                      </div>
                      {/* Glow effect */}
                      <div className="absolute inset-0 rounded-full bg-emerald-500 blur-lg opacity-30" />
                    </div>
                    <step.icon className="w-6 h-6 text-emerald-400" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-400 mb-4 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Highlight badge */}
                  <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-sm text-emerald-400">{step.highlight}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
