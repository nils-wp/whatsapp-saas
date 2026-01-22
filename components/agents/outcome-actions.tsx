'use client'

import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, Play, Settings2 } from 'lucide-react'
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

// Conversation outcomes that can trigger CRM actions
export const CONVERSATION_OUTCOMES = [
  {
    value: 'booked',
    label: 'Termin gebucht',
    description: 'Wird ausgelöst, wenn der Lead einen Termin bucht',
    color: 'bg-green-500/10 text-green-500 border-green-500/20',
  },
  {
    value: 'not_interested',
    label: 'Kein Interesse',
    description: 'Wird ausgelöst, wenn der Lead kein Interesse zeigt',
    color: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  },
  {
    value: 'escalated',
    label: 'Eskaliert',
    description: 'Wird ausgelöst, wenn die Konversation eskaliert wird',
    color: 'bg-red-500/10 text-red-500 border-red-500/20',
  },
  {
    value: 'completed',
    label: 'Abgeschlossen',
    description: 'Wird ausgelöst, wenn die Konversation als abgeschlossen markiert wird',
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  },
] as const

export type ConversationOutcome = typeof CONVERSATION_OUTCOMES[number]['value']

export interface OutcomeAction {
  id: string
  crm_type: TriggerType
  action: string
  fields: Record<string, unknown>
  enabled: boolean
}

export interface OutcomeActionsConfig {
  [outcome: string]: OutcomeAction[]
}

interface OutcomeActionsProps {
  config: OutcomeActionsConfig
  onChange: (config: OutcomeActionsConfig) => void
  connectedCRMs: {
    close: boolean
    activecampaign: boolean
    pipedrive: boolean
    hubspot: boolean
    monday: boolean
  }
}

// Available CRM options for actions (excluding webhook)
const CRM_ACTION_OPTIONS: Array<{ value: TriggerType; label: string }> = [
  { value: 'close', label: 'Close CRM' },
  { value: 'activecampaign', label: 'ActiveCampaign' },
  { value: 'pipedrive', label: 'Pipedrive' },
  { value: 'hubspot', label: 'HubSpot' },
  { value: 'monday', label: 'Monday.com' },
]

export function OutcomeActions({
  config,
  onChange,
  connectedCRMs,
}: OutcomeActionsProps) {
  const [expandedOutcomes, setExpandedOutcomes] = useState<Set<string>>(new Set())
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set())

  // Filter available CRMs based on connections
  const availableCRMs = CRM_ACTION_OPTIONS.filter(
    option => connectedCRMs[option.value as keyof typeof connectedCRMs]
  )

  const toggleOutcome = (outcome: string) => {
    setExpandedOutcomes(prev => {
      const next = new Set(prev)
      if (next.has(outcome)) {
        next.delete(outcome)
      } else {
        next.add(outcome)
      }
      return next
    })
  }

  const toggleAction = (actionId: string) => {
    setExpandedActions(prev => {
      const next = new Set(prev)
      if (next.has(actionId)) {
        next.delete(actionId)
      } else {
        next.add(actionId)
      }
      return next
    })
  }

  const addAction = (outcome: string) => {
    const defaultCRM = availableCRMs[0]?.value || 'close'
    const defaultActions = CRM_ACTIONS[defaultCRM] || []
    const defaultAction = defaultActions[0]?.value || ''

    const newAction: OutcomeAction = {
      id: `action_${Date.now()}`,
      crm_type: defaultCRM,
      action: defaultAction,
      fields: {},
      enabled: true,
    }

    const currentActions = config[outcome] || []
    onChange({
      ...config,
      [outcome]: [...currentActions, newAction],
    })
    setExpandedActions(prev => new Set([...prev, newAction.id]))
  }

  const removeAction = (outcome: string, actionId: string) => {
    const currentActions = config[outcome] || []
    onChange({
      ...config,
      [outcome]: currentActions.filter(a => a.id !== actionId),
    })
    setExpandedActions(prev => {
      const next = new Set(prev)
      next.delete(actionId)
      return next
    })
  }

  const updateAction = (outcome: string, actionId: string, updates: Partial<OutcomeAction>) => {
    const currentActions = config[outcome] || []
    onChange({
      ...config,
      [outcome]: currentActions.map(a => a.id === actionId ? { ...a, ...updates } : a),
    })
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

  const getOutcomeActionCount = (outcome: string): number => {
    return (config[outcome] || []).filter(a => a.enabled).length
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          Outcome-Aktionen
        </CardTitle>
        <CardDescription>
          Konfiguriere CRM-Aktionen, die automatisch basierend auf dem Konversations-Ergebnis ausgeführt werden.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {availableCRMs.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Verbinde zuerst ein CRM unter Einstellungen - Integrationen, um Aktionen zu konfigurieren.
          </p>
        )}

        {availableCRMs.length > 0 && (
          <div className="space-y-3">
            {CONVERSATION_OUTCOMES.map((outcome) => {
              const isExpanded = expandedOutcomes.has(outcome.value)
              const actionCount = getOutcomeActionCount(outcome.value)
              const actions = config[outcome.value] || []

              return (
                <Collapsible
                  key={outcome.value}
                  open={isExpanded}
                  onOpenChange={() => toggleOutcome(outcome.value)}
                >
                  <div className="border rounded-lg">
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={cn('text-xs', outcome.color)}>
                            {outcome.label}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {outcome.description}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {actionCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {actionCount} Aktion{actionCount !== 1 ? 'en' : ''}
                            </Badge>
                          )}
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="border-t p-4 space-y-4">
                        {/* List of actions for this outcome */}
                        {actions.map((action) => {
                          const isActionExpanded = expandedActions.has(action.id)
                          const actionDef = CRM_ACTIONS[action.crm_type]?.find(a => a.value === action.action)
                          const categories = getActionCategories(action.crm_type)

                          return (
                            <Collapsible
                              key={action.id}
                              open={isActionExpanded}
                              onOpenChange={() => toggleAction(action.id)}
                            >
                              <div className={cn(
                                'border rounded-lg transition-colors',
                                action.enabled ? 'border-border' : 'border-muted bg-muted/20'
                              )}>
                                <div className="flex items-center gap-2 p-3">
                                  <CollapsibleTrigger asChild>
                                    <button
                                      type="button"
                                      className="flex-1 flex items-center gap-2 text-left"
                                    >
                                      <Play className="h-4 w-4 text-muted-foreground" />
                                      <Badge variant="outline" className="text-xs">
                                        {getCRMLabel(action.crm_type)}
                                      </Badge>
                                      <span className={cn(
                                        'font-medium text-sm',
                                        !action.enabled && 'text-muted-foreground'
                                      )}>
                                        {getActionLabel(action.crm_type, action.action)}
                                      </span>
                                      {isActionExpanded ? (
                                        <ChevronUp className="h-4 w-4 ml-auto text-muted-foreground" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground" />
                                      )}
                                    </button>
                                  </CollapsibleTrigger>

                                  <Switch
                                    checked={action.enabled}
                                    onCheckedChange={(enabled) => updateAction(outcome.value, action.id, { enabled })}
                                  />

                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => removeAction(outcome.value, action.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>

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
                                            updateAction(outcome.value, action.id, {
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
                                          onValueChange={(value) => updateAction(outcome.value, action.id, { action: value, fields: {} })}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Aktion auswählen" />
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

                                    {/* Action fields */}
                                    {actionDef && actionDef.fields.length > 0 && (
                                      <div className="space-y-4 pt-2 border-t">
                                        {actionDef.fields.map((field) => (
                                          <OutcomeActionFieldInput
                                            key={field.key}
                                            field={field}
                                            value={action.fields[field.key]}
                                            onChange={(value) => {
                                              updateAction(outcome.value, action.id, {
                                                fields: { ...action.fields, [field.key]: value },
                                              })
                                            }}
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

                        {/* Add action button */}
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => addAction(outcome.value)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Aktion hinzufügen
                        </Button>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Simplified field input component for outcome actions
interface OutcomeActionFieldInputProps {
  field: ActionField
  value: unknown
  onChange: (value: unknown) => void
}

function OutcomeActionFieldInput({
  field,
  value,
  onChange,
}: OutcomeActionFieldInputProps) {
  const renderInput = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        return (
          <Input
            type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
            placeholder={field.placeholder}
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        )

      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder}
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
          />
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
          return (
            <Input
              placeholder={field.placeholder || 'ID eingeben...'}
              value={(value as string) || ''}
              onChange={(e) => onChange(e.target.value)}
            />
          )
        }
        return (
          <Select
            value={(value as string) || ''}
            onValueChange={onChange}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || 'Auswählen...'} />
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
          <Input
            placeholder={field.placeholder}
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
          />
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
