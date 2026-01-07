'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Building2 } from 'lucide-react'
import { toast } from 'sonner'

export default function OnboardingPage() {
  const [projectName, setProjectName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!projectName.trim()) {
      toast.error('Bitte gib einen Projektnamen ein')
      return
    }

    setIsLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Nicht eingeloggt')
        router.push('/login')
        return
      }

      const slug = generateSlug(projectName)

      // Create tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: projectName,
          slug: slug,
          owner_id: user.id,
        })
        .select()
        .single()

      if (tenantError) {
        if (tenantError.code === '23505') {
          toast.error('Ein Projekt mit diesem Namen existiert bereits')
        } else {
          toast.error('Fehler beim Erstellen des Projekts')
          console.error(tenantError)
        }
        setIsLoading(false)
        return
      }

      toast.success('Projekt erstellt!')

      // Small delay to ensure tenant_member trigger has completed
      await new Promise(resolve => setTimeout(resolve, 500))

      router.push('/conversations')
      router.refresh()
    } catch (error) {
      console.error('Onboarding error:', error)
      toast.error('Ein Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Willkommen bei ChatSetter</CardTitle>
          <CardDescription>
            Erstelle dein erstes Projekt, um loszulegen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">Projektname</Label>
              <Input
                id="projectName"
                placeholder="z.B. Meine Firma"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Der Name deines Unternehmens oder Projekts
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird erstellt...
                </>
              ) : (
                'Projekt erstellen'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
