'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { loginSchema, type LoginFormData } from '@/lib/utils/validation'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginFormData) {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (authError) {
      setError('E-Mail oder Passwort ist falsch')
      setIsLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-white mb-2">
          Willkommen zurück
        </h1>
        <p className="text-slate-400">
          Melde dich an, um fortzufahren
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

        {/* Password field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium text-slate-300">
              Passwort
            </Label>
            <Link
              href="/forgot-password"
              className="text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              Vergessen?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="pl-10 h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:bg-slate-800 focus:border-emerald-500 focus:ring-emerald-500/20 transition-colors"
              {...register('password')}
            />
          </div>
          {errors.password && (
            <p className="text-sm text-red-400 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              {errors.password.message}
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
              Anmelden...
            </>
          ) : (
            <>
              Anmelden
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
          <span className="px-4 bg-slate-900 text-slate-500">Neu hier?</span>
        </div>
      </div>

      {/* Sign up link */}
      <Link href="/signup" className="block">
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600 hover:text-white font-medium rounded-xl transition-all"
        >
          Kostenloses Konto erstellen
        </Button>
      </Link>
    </>
  )
}
