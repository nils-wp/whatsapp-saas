export const APP_NAME = 'WhatsApp SaaS'

export const PLANS = {
  trial: {
    name: 'Trial',
    price: 0,
    limits: {
      whatsapp_accounts: 1,
      monthly_messages: 100,
      agents: 1,
      team_members: 1
    }
  },
  starter: {
    name: 'Starter',
    price: 49,
    stripePriceId: 'price_starter_monthly',
    limits: {
      whatsapp_accounts: 1,
      monthly_messages: 1000,
      agents: 2,
      team_members: 2
    }
  },
  pro: {
    name: 'Pro',
    price: 149,
    stripePriceId: 'price_pro_monthly',
    limits: {
      whatsapp_accounts: 3,
      monthly_messages: 5000,
      agents: 10,
      team_members: 5
    }
  },
  enterprise: {
    name: 'Enterprise',
    price: 499,
    stripePriceId: 'price_enterprise_monthly',
    limits: {
      whatsapp_accounts: 10,
      monthly_messages: 25000,
      agents: -1,
      team_members: -1
    }
  }
} as const

export type PlanType = keyof typeof PLANS

export const DEFAULT_SCRIPT_STEPS = [
  { step: 1, name: 'greeting', goal: 'Rapport aufbauen', template: 'Hey {{contact_name}}, schön dass du schreibst!' },
  { step: 2, name: 'qualify', goal: 'Situation verstehen', template: 'Was machst du genau und wo stehst du gerade?' },
  { step: 3, name: 'confirm_goal', goal: 'Ziel bestätigen', template: 'Du möchtest also planbar mehr Kunden gewinnen?' },
  { step: 4, name: 'challenge', goal: 'Schmerzpunkt finden', template: 'Was fällt dir dabei am schwersten?' },
  { step: 5, name: 'offer', goal: 'Lösung anbieten', template: 'Das kennen wir gut. Möchtest du sehen wie wir helfen können?' },
  { step: 6, name: 'book', goal: 'Termin buchen', template: 'Super! {{booking_cta}} {{calendly_link}}' }
]

export const ESCALATION_TOPICS = ['preis', 'kosten', 'vertrag', 'garantie', 'beschwerde']
export const DISQUALIFY_CRITERIA = ['kein_angebot', 'kein_coach']
