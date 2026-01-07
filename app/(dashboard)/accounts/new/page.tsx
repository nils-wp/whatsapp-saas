'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { QRCodeScanner } from '@/components/accounts/qr-code-scanner'
import { useCreateAccount } from '@/lib/hooks/use-accounts'
import { toast } from 'sonner'

export default function NewAccountPage() {
  const router = useRouter()
  const [step, setStep] = useState<'name' | 'connect'>('name')
  const [instanceName, setInstanceName] = useState('')
  const createAccount = useCreateAccount()

  async function handleCreateInstance() {
    if (!instanceName.trim()) {
      toast.error('Bitte gib einen Namen ein')
      return
    }

    try {
      // Transform the instance name
      const normalizedName = instanceName.trim().toLowerCase().replace(/\s+/g, '-')

      await createAccount.mutateAsync({
        instance_name: normalizedName,
        status: 'connecting',
      })

      // Update state with normalized name for QR scanner
      setInstanceName(normalizedName)
      setStep('connect')
    } catch (error) {
      toast.error('Fehler beim Erstellen der Instanz')
    }
  }

  function handleConnected() {
    toast.success('WhatsApp erfolgreich verbunden!')
    router.push('/accounts')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/accounts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Neue Nummer verbinden</h1>
          <p className="text-muted-foreground">
            Verbinde eine neue WhatsApp-Nummer mit deinem Account
          </p>
        </div>
      </div>

      {step === 'name' && (
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Instance Name</CardTitle>
            <CardDescription>
              Gib einen eindeutigen Namen für diese WhatsApp-Instanz ein
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instanceName">Name</Label>
              <Input
                id="instanceName"
                placeholder="z.B. mein-whatsapp"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Nur Kleinbuchstaben, Zahlen und Bindestriche erlaubt
              </p>
            </div>
            <Button
              onClick={handleCreateInstance}
              disabled={createAccount.isPending}
              className="w-full"
            >
              Weiter
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'connect' && (
        <QRCodeScanner
          instanceName={instanceName}
          onConnected={handleConnected}
        />
      )}
    </div>
  )
}
