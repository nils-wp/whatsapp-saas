'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ArrowLeft, Lock, AlertCircle, CheckCircle2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/utils/validation'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const password = watch('password', '')

  // Password strength indicator
  const getPasswordStrength = (pwd: string) => {
    let strength = 0
    if (pwd.length >= 8) strength++
    if (/[A-Z]/.test(pwd)) strength++
    if (/[0-9]/.test(pwd)) strength++
    if (/[^A-Za-z0-9]/.test(pwd)) strength++
    return strength
  }

  const passwordStrength = getPasswordStrength(password)

  useEffect(() => {
    // Check if we have access to update password (via hash fragment)
    const supabase = createClient()
    supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User clicked the password recovery link
      }
    })
  }, [])

  async function onSubmit(data: ResetPasswordFormData) {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    const { error: updateError } = await supabase.auth.updateUser({
      password: data.password,
    })

    if (updateError) {
      setError('Fehler beim Aktualisieren des Passworts. Bitte versuche es erneut.')
      setIsLoading(false)
      return
    }

    setSuccess(true)
    setIsLoading(false)

    // Redirect to dashboard after 2 seconds
    setTimeout(() => {
      router.push('/')
    }, 2000)
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-semibold text-white mb-3">
          Passwort aktualisiert
        </h1>
        <p className="text-slate-400 mb-2 leading-relaxed">
          Dein Passwort wurde erfolgreich geändert.
        </p>
        <p className="text-sm text-slate-500">
          Du wirst gleich weitergeleitet...
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-white mb-2">
          Neues Passwort setzen
        </h1>
        <p className="text-slate-400">
          Wähle ein sicheres Passwort für dein Konto
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

        {/* Password field */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-slate-300">
            Neues Passwort
          </Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              id="password"
              type="password"
              placeholder="Mind. 8 Zeichen, 1 Großbuchstabe, 1 Zahl"
              className="pl-10 h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:bg-slate-800 focus:border-emerald-500 focus:ring-emerald-500/20 transition-colors"
              {...register('password')}
            />
          </div>
          {/* Password strength indicator */}
          {password && (
            <div className="space-y-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      level <= passwordStrength
                        ? passwordStrength <= 1
                          ? 'bg-red-500'
                          : passwordStrength <= 2
                          ? 'bg-amber-500'
                          : passwordStrength <= 3
                          ? 'bg-emerald-400'
                          : 'bg-emerald-500'
                        : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500">
                {passwordStrength <= 1 && 'Schwach'}
                {passwordStrength === 2 && 'Mittel'}
                {passwordStrength === 3 && 'Stark'}
                {passwordStrength === 4 && 'Sehr stark'}
              </p>
            </div>
          )}
          {errors.password && (
            <p className="text-sm text-red-400 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm password field */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-300">
            Passwort bestätigen
          </Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Passwort wiederholen"
              className="pl-10 h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:bg-slate-800 focus:border-emerald-500 focus:ring-emerald-500/20 transition-colors"
              {...register('confirmPassword')}
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-400 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              {errors.confirmPassword.message}
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
              Passwort wird gespeichert...
            </>
          ) : (
            'Passwort speichern'
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
