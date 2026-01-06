'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Input } from './input'
import { useWhatsAppCheckDebounced } from '@/lib/hooks/use-whatsapp-check'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface WhatsAppPhoneInputProps extends Omit<React.ComponentProps<'input'>, 'onChange'> {
  value?: string
  onChange?: (value: string) => void
  onValidationChange?: (isValid: boolean | null) => void
  showValidation?: boolean
  debounceMs?: number
}

export function WhatsAppPhoneInput({
  className,
  value,
  onChange,
  onValidationChange,
  showValidation = true,
  debounceMs = 800,
  ...props
}: WhatsAppPhoneInputProps) {
  const [internalValue, setInternalValue] = React.useState(value || '')

  const { checkNumber, isChecking, isValid, reset } = useWhatsAppCheckDebounced(debounceMs, {
    onSuccess: (result) => {
      onValidationChange?.(result.exists)
    },
    onError: () => {
      onValidationChange?.(null)
    },
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInternalValue(newValue)
    onChange?.(newValue)

    // Reset validation when value changes significantly
    if (newValue.length < 8) {
      reset()
      onValidationChange?.(null)
    } else {
      checkNumber(newValue)
    }
  }

  React.useEffect(() => {
    if (value !== undefined && value !== internalValue) {
      setInternalValue(value)
    }
  }, [value, internalValue])

  return (
    <div className="relative">
      <Input
        type="tel"
        className={cn(
          'pr-10',
          isValid === true && 'border-green-500 focus-visible:border-green-500 focus-visible:ring-green-500/50',
          isValid === false && 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/50',
          className
        )}
        value={internalValue}
        onChange={handleChange}
        {...props}
      />
      {showValidation && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isChecking && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {!isChecking && isValid === true && (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
          {!isChecking && isValid === false && (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
        </div>
      )}
    </div>
  )
}

// Simple validation badge component for use outside inputs
export function WhatsAppValidationBadge({
  phone,
  className
}: {
  phone: string
  className?: string
}) {
  const { checkNumber, isChecking, isValid } = useWhatsAppCheckDebounced(500)

  React.useEffect(() => {
    if (phone && phone.replace(/\D/g, '').length >= 8) {
      checkNumber(phone)
    }
  }, [phone, checkNumber])

  if (!phone || phone.replace(/\D/g, '').length < 8) {
    return null
  }

  return (
    <span className={cn('inline-flex items-center gap-1 text-xs', className)}>
      {isChecking && (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="text-muted-foreground">Checking...</span>
        </>
      )}
      {!isChecking && isValid === true && (
        <>
          <CheckCircle2 className="h-3 w-3 text-green-500" />
          <span className="text-green-500">WhatsApp</span>
        </>
      )}
      {!isChecking && isValid === false && (
        <>
          <XCircle className="h-3 w-3 text-red-500" />
          <span className="text-red-500">Not on WhatsApp</span>
        </>
      )}
    </span>
  )
}
