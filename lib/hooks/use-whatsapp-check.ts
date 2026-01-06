'use client'

import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'

interface WhatsAppCheckResult {
  exists: boolean
  jid: string | null
  phone: string
}

interface UseWhatsAppCheckOptions {
  onSuccess?: (result: WhatsAppCheckResult) => void
  onError?: (error: Error) => void
}

export function useWhatsAppCheck(options?: UseWhatsAppCheckOptions) {
  const [lastResult, setLastResult] = useState<WhatsAppCheckResult | null>(null)

  const mutation = useMutation({
    mutationFn: async (phone: string): Promise<WhatsAppCheckResult> => {
      const response = await fetch('/api/evolution/check-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to check number')
      }

      return response.json()
    },
    onSuccess: (data) => {
      setLastResult(data)
      options?.onSuccess?.(data)
    },
    onError: (error: Error) => {
      options?.onError?.(error)
    },
  })

  const checkNumber = useCallback((phone: string) => {
    return mutation.mutateAsync(phone)
  }, [mutation])

  const reset = useCallback(() => {
    setLastResult(null)
    mutation.reset()
  }, [mutation])

  return {
    checkNumber,
    isChecking: mutation.isPending,
    result: lastResult,
    error: mutation.error,
    isValid: lastResult?.exists ?? null,
    reset,
  }
}

// Debounced version for real-time form validation
export function useWhatsAppCheckDebounced(
  debounceMs: number = 500,
  options?: UseWhatsAppCheckOptions
) {
  const { checkNumber, ...rest } = useWhatsAppCheck(options)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  const checkNumberDebounced = useCallback((phone: string) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    // Only check if phone has at least 8 digits
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 8) {
      return
    }

    const id = setTimeout(() => {
      checkNumber(phone)
    }, debounceMs)

    setTimeoutId(id)
  }, [checkNumber, debounceMs, timeoutId])

  return {
    checkNumber: checkNumberDebounced,
    ...rest,
  }
}
