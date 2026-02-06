import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Hero } from "@/components/marketing/hero"
import { Features } from "@/components/marketing/features"
import { HowItWorks } from "@/components/marketing/how-it-works"
import { CTASection } from "@/components/marketing/cta-section"
import { Navbar } from "@/components/marketing/navbar"
import { Footer } from "@/components/marketing/footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Chatsetter - WhatsApp-Automatisierung für dein Business",
  description:
    "Qualifiziere Leads automatisch mit KI-Agenten, führe Verkaufsgespräche rund um die Uhr und integriere dein CRM nahtlos. DSGVO-konform und Made in Germany.",
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
    title: "Chatsetter - WhatsApp-Automatisierung für dein Business",
    description:
      "Qualifiziere Leads automatisch mit KI-Agenten. DSGVO-konform und Made in Germany.",
    type: "website",
    locale: "de_DE",
  },
}

export default async function RootPage() {
  // Check if user is authenticated
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If authenticated, redirect to dashboard
  if (user) {
    redirect('/accounts')
  }

  // Show landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
