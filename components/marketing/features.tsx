import { Bot, Database, MessageSquare, BarChart3, Zap, Users } from "lucide-react"

const features = [
  {
    icon: Bot,
    title: "KI-Agenten",
    description:
      "Intelligente Agenten mit eigener Persoenlichkeit und Gespraechsfuehrung. Trainiert auf deine Branche und Zielgruppe.",
  },
  {
    icon: Database,
    title: "CRM Integration",
    description:
      "Nahtlose Verbindung zu Close.io, ActiveCampaign und weiteren CRM-Systemen. Automatische Lead-Synchronisation.",
  },
  {
    icon: MessageSquare,
    title: "Multi-Channel",
    description:
      "WhatsApp Business API Integration mit mehreren Nummern und Accounts. Ein Dashboard fuer alle Kanaele.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description:
      "Detaillierte Einblicke in Conversion-Rates, Antwortzeiten und Gespraechsqualitaet. Datengetriebene Optimierung.",
  },
  {
    icon: Zap,
    title: "Automatisierung",
    description:
      "Trigger-basierte Workflows, automatische Follow-ups und intelligentes Routing. Skaliere ohne mehr Personal.",
  },
  {
    icon: Users,
    title: "Team-Kollaboration",
    description:
      "Uebergabe an echte Mitarbeiter bei Bedarf. Interne Notizen, Tags und Zuweisungen fuer effektive Zusammenarbeit.",
  },
]

export function Features() {
  return (
    <section id="features" className="py-20 sm:py-32 bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Alles was du brauchst
          </h2>
          <p className="text-lg text-gray-400">
            Eine vollstaendige Plattform fuer WhatsApp-Marketing und Vertriebsautomatisierung.
            Entwickelt fuer deutsche Unternehmen mit hoechsten Datenschutzstandards.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative bg-slate-900 border border-slate-800 rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-500/30"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                <feature.icon className="w-6 h-6 text-emerald-500" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>

              {/* Hover gradient */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
