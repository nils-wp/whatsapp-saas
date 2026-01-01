'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoader } from '@/components/shared/loading-spinner'
import { useAccount, useUpdateAccount } from '@/lib/hooks/use-accounts'
import { toast } from 'sonner'

interface SettingsForm {
  display_name: string
  daily_limit: number
}

export default function AccountSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { data: account, isLoading } = useAccount(id)
  const updateAccount = useUpdateAccount()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SettingsForm>({
    values: {
      display_name: account?.display_name || '',
      daily_limit: account?.daily_limit || 50,
    },
  })

  async function onSubmit(data: SettingsForm) {
    try {
      await updateAccount.mutateAsync({
        id,
        display_name: data.display_name,
        daily_limit: data.daily_limit,
      })
      toast.success('Einstellungen gespeichert')
      router.push(`/accounts/${id}`)
    } catch (error) {
      toast.error('Fehler beim Speichern')
    }
  }

  if (isLoading) {
    return <PageLoader />
  }

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Account nicht gefunden</p>
        <Link href="/accounts">
          <Button variant="outline" className="mt-4">
            Zurück zur Übersicht
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/accounts/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Account Einstellungen</h1>
          <p className="text-muted-foreground">
            {account.display_name || account.instance_name}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Allgemein</CardTitle>
            <CardDescription>
              Grundlegende Einstellungen für diesen Account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display_name">Anzeigename</Label>
              <Input
                id="display_name"
                placeholder="z.B. Hauptnummer"
                {...register('display_name')}
              />
              <p className="text-xs text-muted-foreground">
                Ein freundlicher Name für diese Nummer
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="daily_limit">Tageslimit</Label>
              <Input
                id="daily_limit"
                type="number"
                min={1}
                max={1000}
                {...register('daily_limit', { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">
                Maximale Anzahl Nachrichten pro Tag (empfohlen: dem Warmup-Plan folgen)
              </p>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={updateAccount.isPending}>
                <Save className="mr-2 h-4 w-4" />
                Speichern
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
