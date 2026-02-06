'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ArrowLeft, Mail, AlertCircle, CheckCircle2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/utils/validation'

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  async function onSubmit(data: ForgotPasswordFormData) {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      data.email,
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    )

    if (resetError) {
      setError('Fehler beim Senden der E-Mail. Bitte versuche es erneut.')
      setIsLoading(false)
      return
    }

    setSuccess(true)
    setIsLoading(false)
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-semibold text-white mb-3">
          E-Mail gesendet
        </h1>
        <p className="text-slate-400 mb-8 leading-relaxed">
          Wir haben dir einen Link zum Zurücksetzen deines Passworts geschickt.
          <br />
          Bitte überprüfe dein Postfach und deinen Spam-Ordner.
        </p>
        <Link href="/login">
          <Button
            variant="outline"
            className="h-12 px-8 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600 hover:text-white font-medium rounded-xl transition-all"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zum Login
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-white mb-2">
          Passwort vergessen?
        </h1>
        <p className="text-slate-400">
          Kein Problem. Gib deine E-Mail ein und wir senden dir einen Reset-Link.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Error message */}
        {error && (
          <div className="flex items-center gap-3 p-4 text-sm text-red-400 bg-red-500/10 rounded-xl border border-red-500/20">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Email field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-slate-300">
            E-Mail-Adresse
          </Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              id="email"
              type="email"
              placeholder="name@firma.de"
              className="pl-10 h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:bg-slate-800 focus:border-emerald-500 focus:ring-emerald-500/20 transition-colors"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-400 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-500/25"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Link wird gesendet...
            </>
          ) : (
            'Link senden'
          )}
        </Button>
      </form>

      {/* Back to login */}
      <div className="mt-8 text-center">
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zum Login
        </Link>
      </div>
    </>
  )
}
