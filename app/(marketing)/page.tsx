import { Hero } from "@/components/marketing/hero"
import { Features } from "@/components/marketing/features"
import { HowItWorks } from "@/components/marketing/how-it-works"
import { CTASection } from "@/components/marketing/cta-section"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Chatsetter - WhatsApp-Automatisierung fuer dein Business",
  description:
    "Qualifiziere Leads automatisch mit KI-Agenten, fuehre Verkaufsgespraeche rund um die Uhr und integriere dein CRM nahtlos. DSGVO-konform und Made in Germany.",
  keywords: [
    "WhatsApp Automatisierung",
    "KI Agent",
    "Lead Qualifizierung",
    "WhatsApp Business",
    "CRM Integration",
    "DSGVO",
    "Vertriebsautomatisierung",
  ],
  openGraph: {
    title: "Chatsetter - WhatsApp-Automatisierung fuer dein Business",
    description:
      "Qualifiziere Leads automatisch mit KI-Agenten. DSGVO-konform und Made in Germany.",
    type: "website",
    locale: "de_DE",
  },
}

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <CTASection />
    </>
  )
}
