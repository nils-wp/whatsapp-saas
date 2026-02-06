'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Mail, Lock, User, AlertCircle, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { signupSchema, type SignupFormData } from '@/lib/utils/validation'

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
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

  async function onSubmit(data: SignupFormData) {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    const { error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.name,
        },
        emailRedirectTo: `${window.location.origin}/`,
      },
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        setError('Diese E-Mail-Adresse ist bereits registriert')
      } else {
        setError('Registrierung fehlgeschlagen. Bitte versuche es erneut.')
      }
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
          Bestätige deine E-Mail
        </h1>
        <p className="text-slate-400 mb-8 leading-relaxed">
          Wir haben dir einen Bestätigungslink geschickt.
          <br />
          Bitte überprüfe dein Postfach und deinen Spam-Ordner.
        </p>
        <Link href="/login">
          <Button
            variant="outline"
            className="h-12 px-8 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600 hover:text-white font-medium rounded-xl transition-all"
          >
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
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-sm font-medium mb-4 border border-emerald-500/20">
          <Sparkles className="h-3.5 w-3.5" />
          14 Tage kostenlos testen
        </div>
        <h1 className="text-2xl font-semibold text-white mb-2">
          Konto erstellen
        </h1>
        <p className="text-slate-400">
          In wenigen Minuten startklar
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

        {/* Name field */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-slate-300">
            Vollständiger Name
          </Label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              id="name"
              type="text"
              placeholder="Max Mustermann"
              className="pl-10 h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:bg-slate-800 focus:border-emerald-500 focus:ring-emerald-500/20 transition-colors"
              {...register('name')}
            />
          </div>
          {errors.name && (
            <p className="text-sm text-red-400 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-slate-300">
            Geschäftliche E-Mail
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

        {/* Password field */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-slate-300">
            Passwort
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

        {/* Terms notice */}
        <p className="text-xs text-slate-500 leading-relaxed">
          Mit der Registrierung akzeptierst du unsere{' '}
          <Link href="/terms" className="text-emerald-400 hover:text-emerald-300 hover:underline">
            AGB
          </Link>{' '}
          und{' '}
          <Link href="/privacy" className="text-emerald-400 hover:text-emerald-300 hover:underline">
            Datenschutzerklärung
          </Link>
          .
        </p>

        {/* Submit button */}
        <Button
          type="submit"
          className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-500/25"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Konto wird erstellt...
            </>
          ) : (
            <>
              Kostenlos starten
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-slate-900 text-slate-500">Bereits registriert?</span>
        </div>
      </div>

      {/* Login link */}
      <Link href="/login" className="block">
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600 hover:text-white font-medium rounded-xl transition-all"
        >
          Zum Login
        </Button>
      </Link>
    </>
  )
}
