'use client'

import { useState } from 'react'
import {
  CreditCard,
  Check,
  Zap,
  ArrowUpRight,
  Receipt,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    description: 'Perfekt für den Einstieg',
    features: [
      '1 WhatsApp Nummer',
      '1.000 Nachrichten/Monat',
      '2 AI Agents',
      '2 Team-Mitglieder',
    ],
    limits: {
      accounts: 1,
      messages: 1000,
      agents: 2,
      members: 2,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 149,
    description: 'Für wachsende Teams',
    popular: true,
    features: [
      '3 WhatsApp Nummern',
      '5.000 Nachrichten/Monat',
      '10 AI Agents',
      '5 Team-Mitglieder',
      'Priority Support',
    ],
    limits: {
      accounts: 3,
      messages: 5000,
      agents: 10,
      members: 5,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 399,
    description: 'Für große Unternehmen',
    features: [
      '10 WhatsApp Nummern',
      '25.000 Nachrichten/Monat',
      'Unbegrenzte Agents',
      'Unbegrenzte Team-Mitglieder',
      'Priority Support',
      'Custom Integrationen',
    ],
    limits: {
      accounts: 10,
      messages: 25000,
      agents: -1,
      members: -1,
    },
  },
]

const MOCK_INVOICES = [
  {
    id: 'inv_001',
    date: '2024-01-01',
    amount: 149,
    status: 'paid',
  },
  {
    id: 'inv_002',
    date: '2023-12-01',
    amount: 149,
    status: 'paid',
  },
  {
    id: 'inv_003',
    date: '2023-11-01',
    amount: 49,
    status: 'paid',
  },
]

export default function BillingPage() {
  const [currentPlan] = useState('pro')
  const [usage] = useState({
    accounts: 2,
    messages: 3240,
    agents: 5,
    members: 3,
  })

  const plan = PLANS.find((p) => p.id === currentPlan) || PLANS[1]

  const handleUpgrade = (planId: string) => {
    toast.success(`Upgrade zu ${PLANS.find((p) => p.id === planId)?.name}`)
  }

  const handleManageSubscription = () => {
    toast.info('Weiterleitung zum Stripe Kundenportal...')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Abrechnung</h1>
        <p className="text-muted-foreground">
          Verwalte dein Abonnement und deine Rechnungen.
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Aktueller Plan</CardTitle>
                <CardDescription>
                  Dein Abonnement und die Nutzung
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{plan.name}</span>
                <Badge variant="default">Aktiv</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {plan.price}€/Monat
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Usage Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <UsageCard
              label="WhatsApp Nummern"
              used={usage.accounts}
              limit={plan.limits.accounts}
            />
            <UsageCard
              label="Nachrichten"
              used={usage.messages}
              limit={plan.limits.messages}
            />
            <UsageCard
              label="AI Agents"
              used={usage.agents}
              limit={plan.limits.agents}
            />
            <UsageCard
              label="Team-Mitglieder"
              used={usage.members}
              limit={plan.limits.members}
            />
          </div>

          <Separator />

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleManageSubscription}>
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Abonnement verwalten
            </Button>
            <Button variant="outline">
              <CreditCard className="mr-2 h-4 w-4" />
              Zahlungsmethode ändern
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Verfügbare Pläne</h2>
        <div className="grid gap-6 lg:grid-cols-3">
          {PLANS.map((p) => (
            <Card
              key={p.id}
              className={p.popular ? 'border-primary' : ''}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{p.name}</CardTitle>
                  {p.popular && (
                    <Badge variant="default">
                      <Zap className="mr-1 h-3 w-3" />
                      Beliebt
                    </Badge>
                  )}
                </div>
                <CardDescription>{p.description}</CardDescription>
                <div className="pt-2">
                  <span className="text-3xl font-bold">{p.price}€</span>
                  <span className="text-muted-foreground">/Monat</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {p.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {p.id === currentPlan ? (
                  <Button variant="outline" className="w-full" disabled>
                    Aktueller Plan
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={p.popular ? 'default' : 'outline'}
                    onClick={() => handleUpgrade(p.id)}
                  >
                    {PLANS.findIndex((pl) => pl.id === p.id) >
                    PLANS.findIndex((pl) => pl.id === currentPlan)
                      ? 'Upgrade'
                      : 'Downgrade'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Rechnungen</CardTitle>
              <CardDescription>
                Deine bisherigen Rechnungen
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {MOCK_INVOICES.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <div className="font-medium">
                      {new Date(invoice.date).toLocaleDateString('de-DE', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {invoice.amount}€
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-primary">
                    Bezahlt
                  </Badge>
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function UsageCard({
  label,
  used,
  limit,
}: {
  label: string
  used: number
  limit: number
}) {
  const percentage = limit === -1 ? 0 : (used / limit) * 100
  const isUnlimited = limit === -1

  return (
    <div className="rounded-lg border p-4">
      <div className="text-sm text-muted-foreground mb-2">{label}</div>
      <div className="text-2xl font-bold">
        {used.toLocaleString()}
        <span className="text-sm font-normal text-muted-foreground">
          /{isUnlimited ? '∞' : limit.toLocaleString()}
        </span>
      </div>
      {!isUnlimited && (
        <Progress value={percentage} className="mt-2 h-2" />
      )}
    </div>
  )
}
