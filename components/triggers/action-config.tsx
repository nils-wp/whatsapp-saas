'use client'

import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, GripVertical, Play, Variable } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CRM_ACTIONS, getActionCategories, getActionsByCategory, type CRMAction, type ActionField } from '@/lib/utils/crm-actions'
import type { TriggerType } from '@/lib/utils/validation'
import { cn } from '@/lib/utils'
import { VariablePicker, VariableDisplay } from './variable-picker'
import type { TriggerVariable } from '@/lib/utils/trigger-variables'

interface ActionInstance {
  id: string
  crm_type: TriggerType
  action: string
  fields: Record<string, unknown>
  enabled: boolean
}

interface ActionConfigProps {
  actions: ActionInstance[]
  onChange: (actions: ActionInstance[]) => void
  connectedCRMs: {
    close: boolean
    activecampaign: boolean
    pipedrive: boolean
    hubspot: boolean
    monday: boolean
  }
  // For dynamic variables from trigger
  triggerType: TriggerType
  triggerEvent?: string
}

// Available CRM options for actions (excluding webhook)
const CRM_ACTION_OPTIONS: Array<{ value: TriggerType; label: string }> = [
  { value: 'close', label: 'Close CRM' },
  { value: 'activecampaign', label: 'ActiveCampaign' },
  { value: 'pipedrive', label: 'Pipedrive' },
  { value: 'hubspot', label: 'HubSpot' },
  { value: 'monday', label: 'Monday.com' },
]

export function ActionConfig({
  actions,
  onChange,
  connectedCRMs,
  triggerType,
  triggerEvent,
}: ActionConfigProps) {
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set())

  // Filter available CRMs based on connections
  const availableCRMs = CRM_ACTION_OPTIONS.filter(
    option => connectedCRMs[option.value as keyof typeof connectedCRMs]
  )

  const addAction = () => {
    const defaultCRM = availableCRMs[0]?.value || 'close'
    const defaultActions = CRM_ACTIONS[defaultCRM] || []
    const defaultAction = defaultActions[0]?.value || ''

    const newAction: ActionInstance = {
      id: `action_${Date.now()}`,
      crm_type: defaultCRM,
      action: defaultAction,
      fields: {},
      enabled: true,
    }

    onChange([...actions, newAction])
    setExpandedActions(prev => new Set([...prev, newAction.id]))
  }

  const removeAction = (id: string) => {
    onChange(actions.filter(a => a.id !== id))
    setExpandedActions(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const updateAction = (id: string, updates: Partial<ActionInstance>) => {
    onChange(actions.map(a => a.id === id ? { ...a, ...updates } : a))
  }

  const toggleExpanded = (id: string) => {
    setExpandedActions(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const moveAction = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= actions.length) return

    const newActions = [...actions]
    const [moved] = newActions.splice(index, 1)
    newActions.splice(newIndex, 0, moved)
    onChange(newActions)
  }

  const getActionLabel = (crmType: TriggerType, actionValue: string): string => {
    const crmActions = CRM_ACTIONS[crmType] || []
    const action = crmActions.find(a => a.value === actionValue)
    return action?.label || actionValue
  }

  const getCRMLabel = (crmType: TriggerType): string => {
    const option = CRM_ACTION_OPTIONS.find(o => o.value === crmType)
    return option?.label || crmType
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Aktionen
        </CardTitle>
        <CardDescription>
          Konfiguriere Aktionen, die nach der WhatsApp-Nachricht ausgefuhrt werden.
          Verwende Variablen aus dem Trigger-Payload fur dynamische Werte.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {availableCRMs.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Verbinde zuerst ein CRM unter Einstellungen - Integrationen, um Aktionen zu konfigurieren.
          </p>
        )}

        {/* List of configured actions - with scroll area for many actions */}
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
          {actions.map((action, index) => {
            const isExpanded = expandedActions.has(action.id)
            const actionDef = CRM_ACTIONS[action.crm_type]?.find(a => a.value === action.action)
            const categories = getActionCategories(action.crm_type)

            return (
              <Collapsible
                key={action.id}
                open={isExpanded}
                onOpenChange={() => toggleExpanded(action.id)}
              >
                <div className={cn(
                  'border rounded-lg transition-colors',
                  action.enabled ? 'border-border' : 'border-muted bg-muted/20'
                )}>
                  {/* Action header */}
                  <div className="flex items-center gap-2 p-3">
                    <button
                      type="button"
                      className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>

                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveAction(index, 'up')}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveAction(index, 'down')}
                        disabled={index === actions.length - 1}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>

                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex-1 flex items-center gap-2 text-left"
                      >
                        <Badge variant="outline" className="text-xs">
                          {getCRMLabel(action.crm_type)}
                        </Badge>
                        <span className={cn(
                          'font-medium',
                          !action.enabled && 'text-muted-foreground'
                        )}>
                          {getActionLabel(action.crm_type, action.action)}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 ml-auto text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground" />
                        )}
                      </button>
                    </CollapsibleTrigger>

                    <Switch
                      checked={action.enabled}
                      onCheckedChange={(enabled) => updateAction(action.id, { enabled })}
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeAction(action.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Action configuration */}
                  <CollapsibleContent>
                    <div className="border-t p-4 space-y-4">
                      {/* CRM and Action selection */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>CRM</Label>
                          <Select
                            value={action.crm_type}
                            onValueChange={(value) => {
                              const newCRM = value as TriggerType
                              const firstAction = CRM_ACTIONS[newCRM]?.[0]?.value || ''
                              updateAction(action.id, {
                                crm_type: newCRM,
                                action: firstAction,
                                fields: {},
                              })
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {availableCRMs.map((crm) => (
                                <SelectItem key={crm.value} value={crm.value}>
                                  {crm.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Aktion</Label>
                          <Select
                            value={action.action}
                            onValueChange={(value) => updateAction(action.id, { action: value, fields: {} })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Aktion auswahlen" />
                            </SelectTrigger>
                            <SelectContent className="max-h-80">
                              <ScrollArea className="h-72">
                                {categories.map(category => (
                                  <div key={category}>
                                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0 z-10">
                                      {category}
                                    </div>
                                    {getActionsByCategory(action.crm_type, category).map((a) => (
                                      <SelectItem key={a.value} value={a.value}>
                                        {a.label}
                                      </SelectItem>
                                    ))}
                                  </div>
                                ))}
                              </ScrollArea>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Action description */}
                      {actionDef && (
                        <p className="text-sm text-muted-foreground">
                          {actionDef.description}
                        </p>
                      )}

                      {/* Variable hint */}
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <Variable className="h-4 w-4 text-primary shrink-0" />
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium text-primary">Tipp:</span> Bei Textfeldern kannst du Variablen aus dem Trigger-Payload einfugen,
                          z.B. Kontaktdaten oder Lead-Informationen.
                        </p>
                      </div>

                      {/* Action fields */}
                      {actionDef && actionDef.fields.length > 0 && (
                        <div className="space-y-4 pt-2 border-t">
                          {actionDef.fields.map((field) => (
                            <ActionFieldInput
                              key={field.key}
                              field={field}
                              value={action.fields[field.key]}
                              onChange={(value) => {
                                updateAction(action.id, {
                                  fields: { ...action.fields, [field.key]: value },
                                })
                              }}
                              triggerType={triggerType}
                              triggerEvent={triggerEvent}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            )
          })}
        </div>

        {/* Add action button */}
        {availableCRMs.length > 0 && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={addAction}
          >
            <Plus className="h-4 w-4 mr-2" />
            Aktion hinzufugen
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// Individual field input component with variable support
interface ActionFieldInputProps {
  field: ActionField
  value: unknown
  onChange: (value: unknown) => void
  triggerType: TriggerType
  triggerEvent?: string
}

function ActionFieldInput({
  field,
  value,
  onChange,
  triggerType,
  triggerEvent,
}: ActionFieldInputProps) {
  // Track input ref for cursor position
  const handleVariableSelect = (variable: TriggerVariable, currentValue: string) => {
    const placeholder = `{{${variable.key}}}`
    // Append variable at the end
    const newValue = currentValue ? `${currentValue} ${placeholder}` : placeholder
    onChange(newValue)
  }

  // Check if this field type supports variables
  const supportsVariables = ['text', 'textarea', 'email', 'phone', 'url'].includes(field.type)

  const renderInput = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        return (
          <div className="space-y-2">
            {supportsVariables && (
              <VariablePicker
                triggerType={triggerType}
                triggerEvent={triggerEvent}
                onSelect={(variable) => handleVariableSelect(variable, (value as string) || '')}
              />
            )}
            <Input
              type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
              placeholder={field.placeholder}
              value={(value as string) || ''}
              onChange={(e) => onChange(e.target.value)}
            />
            {typeof value === 'string' && value.includes('{{') && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Vorschau:</span>
                <VariableDisplay
                  value={value}
                  triggerType={triggerType}
                  triggerEvent={triggerEvent}
                />
              </div>
            )}
          </div>
        )

      case 'textarea':
        return (
          <div className="space-y-2">
            {supportsVariables && (
              <VariablePicker
                triggerType={triggerType}
                triggerEvent={triggerEvent}
                onSelect={(variable) => handleVariableSelect(variable, (value as string) || '')}
              />
            )}
            <Textarea
              placeholder={field.placeholder}
              value={(value as string) || ''}
              onChange={(e) => onChange(e.target.value)}
              rows={3}
            />
            {typeof value === 'string' && value.includes('{{') && (
              <div className="flex flex-wrap items-start gap-2 text-xs text-muted-foreground">
                <span className="shrink-0">Vorschau:</span>
                <VariableDisplay
                  value={value}
                  triggerType={triggerType}
                  triggerEvent={triggerEvent}
                />
              </div>
            )}
          </div>
        )

      case 'number':
        return (
          <Input
            type="number"
            placeholder={field.placeholder}
            value={(value as number) ?? field.defaultValue ?? ''}
            onChange={(e) => onChange(e.target.valueAsNumber || undefined)}
          />
        )

      case 'date':
        return (
          <Input
            type="date"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        )

      case 'datetime':
        return (
          <Input
            type="datetime-local"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        )

      case 'boolean':
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={(value as boolean) ?? field.defaultValue ?? false}
              onCheckedChange={onChange}
            />
            <span className="text-sm text-muted-foreground">
              {(value as boolean) ? 'Ja' : 'Nein'}
            </span>
          </div>
        )

      case 'select':
        if (field.options === 'dynamic') {
          // Dynamic select - show text input with variable support
          return (
            <div className="space-y-2">
              <VariablePicker
                triggerType={triggerType}
                triggerEvent={triggerEvent}
                onSelect={(variable) => handleVariableSelect(variable, (value as string) || '')}
              />
              <Input
                placeholder={field.placeholder || 'ID eingeben oder Variable wahlen...'}
                value={(value as string) || ''}
                onChange={(e) => onChange(e.target.value)}
              />
              {typeof value === 'string' && value.includes('{{') && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Vorschau:</span>
                  <VariableDisplay
                    value={value}
                    triggerType={triggerType}
                    triggerEvent={triggerEvent}
                  />
                </div>
              )}
            </div>
          )
        }
        return (
          <Select
            value={(value as string) || ''}
            onValueChange={onChange}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || 'Auswahlen...'} />
            </SelectTrigger>
            <SelectContent>
              {Array.isArray(field.options) && field.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'json':
        return (
          <Textarea
            placeholder={field.placeholder || '{ "key": "value" }'}
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                onChange(JSON.parse(e.target.value))
              } catch {
                onChange(e.target.value)
              }
            }}
            rows={4}
            className="font-mono text-sm"
          />
        )

      default:
        return (
          <div className="space-y-2">
            <VariablePicker
              triggerType={triggerType}
              triggerEvent={triggerEvent}
              onSelect={(variable) => handleVariableSelect(variable, (value as string) || '')}
            />
            <Input
              placeholder={field.placeholder}
              value={(value as string) || ''}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
        )
    }
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1">
        {field.label}
        {field.required && <span className="text-destructive">*</span>}
      </Label>
      {renderInput()}
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
    </div>
  )
}
