'use client'

import { useState, useRef, useEffect } from 'react'
import { Variable, ChevronDown, X, Copy, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  getVariablesByCategory,
  type TriggerVariable,
} from '@/lib/utils/trigger-variables'
import type { TriggerType } from '@/lib/utils/validation'

interface VariablePickerProps {
  triggerType: TriggerType
  triggerEvent?: string
  onSelect: (variable: TriggerVariable) => void
  disabled?: boolean
}

export function VariablePicker({
  triggerType,
  triggerEvent,
  onSelect,
  disabled,
}: VariablePickerProps) {
  const [open, setOpen] = useState(false)
  const variablesByCategory = getVariablesByCategory(triggerType, triggerEvent)
  const categories = Object.keys(variablesByCategory)

  if (categories.length === 0) {
    return null
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="h-8 gap-1.5 text-xs font-medium"
        >
          <Variable className="h-3.5 w-3.5" />
          Variable
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="border-b px-3 py-2">
          <p className="text-sm font-medium">Variable einfugen</p>
          <p className="text-xs text-muted-foreground">
            Wahle eine Variable aus dem Trigger-Payload
          </p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {categories.map((category) => (
            <div key={category} className="border-b last:border-b-0">
              <div className="bg-muted/50 px-3 py-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {category}
                </span>
              </div>
              <div className="p-1">
                {variablesByCategory[category].map((variable) => (
                  <VariableItem
                    key={variable.key}
                    variable={variable}
                    onSelect={() => {
                      onSelect(variable)
                      setOpen(false)
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface VariableItemProps {
  variable: TriggerVariable
  onSelect: () => void
}

function VariableItem({ variable, onSelect }: VariableItemProps) {
  const typeColors: Record<string, string> = {
    string: 'bg-blue-100 text-blue-700',
    number: 'bg-purple-100 text-purple-700',
    email: 'bg-green-100 text-green-700',
    phone: 'bg-orange-100 text-orange-700',
    date: 'bg-pink-100 text-pink-700',
    boolean: 'bg-yellow-100 text-yellow-700',
    object: 'bg-gray-100 text-gray-700',
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-accent transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{variable.label}</span>
          <Badge
            variant="secondary"
            className={cn('text-[10px] h-4 px-1', typeColors[variable.type])}
          >
            {variable.type}
          </Badge>
        </div>
        {variable.example && (
          <p className="text-xs text-muted-foreground truncate">
            z.B. {variable.example}
          </p>
        )}
      </div>
    </button>
  )
}

/**
 * Display component for showing inserted variables as badges
 */
interface VariableBadgeProps {
  variableKey: string
  label?: string
  onRemove?: () => void
}

export function VariableBadge({ variableKey, label, onRemove }: VariableBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className="h-6 gap-1 pl-2 pr-1 bg-primary/10 text-primary hover:bg-primary/20"
    >
      <Variable className="h-3 w-3" />
      <span className="text-xs">{label || variableKey}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  )
}

/**
 * A text input with integrated variable picker
 * Shows variables as visual badges inline
 */
interface VariableInputProps {
  value: string
  onChange: (value: string) => void
  triggerType: TriggerType
  triggerEvent?: string
  placeholder?: string
  disabled?: boolean
  multiline?: boolean
}

export function VariableInput({
  value,
  onChange,
  triggerType,
  triggerEvent,
  placeholder,
  disabled,
  multiline,
}: VariableInputProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  const [cursorPosition, setCursorPosition] = useState<number | null>(null)

  // Track cursor position
  const handleSelect = () => {
    if (inputRef.current) {
      setCursorPosition(inputRef.current.selectionStart)
    }
  }

  // Insert variable at cursor position
  const handleVariableSelect = (variable: TriggerVariable) => {
    const placeholder = `{{${variable.key}}}`
    const pos = cursorPosition ?? value.length

    const newValue = value.slice(0, pos) + placeholder + value.slice(pos)
    onChange(newValue)

    // Focus and move cursor after inserted variable
    setTimeout(() => {
      if (inputRef.current) {
        const newPos = pos + placeholder.length
        inputRef.current.focus()
        inputRef.current.setSelectionRange(newPos, newPos)
      }
    }, 0)
  }

  const InputComponent = multiline ? 'textarea' : 'input'

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <VariablePicker
          triggerType={triggerType}
          triggerEvent={triggerEvent}
          onSelect={handleVariableSelect}
          disabled={disabled}
        />
        <span className="text-xs text-muted-foreground">
          Klicke um eine Variable einzufugen
        </span>
      </div>
      <div className="relative">
        <InputComponent
          ref={inputRef as React.Ref<HTMLInputElement & HTMLTextAreaElement>}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onSelect={handleSelect}
          onClick={handleSelect}
          onKeyUp={handleSelect}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
            'ring-offset-background placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            multiline && 'min-h-[80px] resize-y'
          )}
          rows={multiline ? 3 : undefined}
        />
      </div>
      {/* Show preview of variables in the value */}
      {value && value.includes('{{') && (
        <VariablePreview value={value} triggerType={triggerType} triggerEvent={triggerEvent} />
      )}
    </div>
  )
}

/**
 * Preview component showing which variables are in the value
 */
interface VariablePreviewProps {
  value: string
  triggerType: TriggerType
  triggerEvent?: string
}

function VariablePreview({ value, triggerType, triggerEvent }: VariablePreviewProps) {
  const variablesByCategory = getVariablesByCategory(triggerType, triggerEvent)
  const allVariables = Object.values(variablesByCategory).flat()

  // Extract variable keys from the value
  const matches = value.match(/\{\{(\w+)\}\}/g) || []
  const usedKeys = matches.map((m) => m.replace(/[{}]/g, ''))

  // Find matching variable definitions
  const usedVariables = usedKeys
    .map((key) => allVariables.find((v) => v.key === key))
    .filter(Boolean) as TriggerVariable[]

  if (usedVariables.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      <span className="text-xs text-muted-foreground mr-1">Verwendete Variablen:</span>
      {usedVariables.map((variable) => (
        <Badge
          key={variable.key}
          variant="outline"
          className="h-5 text-[10px] gap-1 bg-primary/5"
        >
          <Variable className="h-2.5 w-2.5" />
          {variable.label}
        </Badge>
      ))}
    </div>
  )
}

/**
 * Inline variable display for showing a field value with highlighted variables
 */
interface VariableDisplayProps {
  value: string
  triggerType: TriggerType
  triggerEvent?: string
  className?: string
}

export function VariableDisplay({
  value,
  triggerType,
  triggerEvent,
  className,
}: VariableDisplayProps) {
  const variablesByCategory = getVariablesByCategory(triggerType, triggerEvent)
  const allVariables = Object.values(variablesByCategory).flat()

  // Parse the value and replace {{key}} with badges
  const parts: Array<{ type: 'text' | 'variable'; content: string; variable?: TriggerVariable }> = []
  let lastIndex = 0
  const regex = /\{\{(\w+)\}\}/g
  let match

  while ((match = regex.exec(value)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: value.slice(lastIndex, match.index) })
    }

    // Add the variable
    const key = match[1]
    const variable = allVariables.find((v) => v.key === key)
    parts.push({
      type: 'variable',
      content: key,
      variable,
    })

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < value.length) {
    parts.push({ type: 'text', content: value.slice(lastIndex) })
  }

  return (
    <span className={cn('inline-flex flex-wrap items-center gap-0.5', className)}>
      {parts.map((part, i) =>
        part.type === 'text' ? (
          <span key={i}>{part.content}</span>
        ) : (
          <Badge
            key={i}
            variant="secondary"
            className="h-5 px-1.5 text-[10px] gap-0.5 bg-primary/10 text-primary"
          >
            <Variable className="h-2.5 w-2.5" />
            {part.variable?.label || part.content}
          </Badge>
        )
      )}
    </span>
  )
}
