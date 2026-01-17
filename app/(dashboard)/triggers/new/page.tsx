'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useCreateTrigger } from '@/lib/hooks/use-triggers'
import { useAccounts } from '@/lib/hooks/use-accounts'
import { useAgents } from '@/lib/hooks/use-agents'
import { useIntegrations } from '@/lib/hooks/use-integrations'
import { triggerSchema, type TriggerFormData, type TriggerType, CRM_EVENTS, EVENT_FILTERS, type EventFilterValues } from '@/lib/utils/validation'
import { ActionConfig } from '@/components/triggers/action-config'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

// CRM type options with labels
const CRM_OPTIONS: Array<{ value: TriggerType; label: string; requiresConnection: boolean }> = [
  { value: 'webhook', label: 'Webhook', requiresConnection: false },
  { value: 'close', label: 'Close CRM', requiresConnection: true },
  { value: 'activecampaign', label: 'ActiveCampaign', requiresConnection: true },
  { value: 'pipedrive', label: 'Pipedrive', requiresConnection: true },
  { value: 'hubspot', label: 'HubSpot', requiresConnection: true },
  { value: 'monday', label: 'Monday.com', requiresConnection: true },
]

export default function NewTriggerPage() {
  const router = useRouter()
  const createTrigger = useCreateTrigger()
  const { data: accounts } = useAccounts()
  const { data: agents } = useAgents()
  const { data: integrations } = useIntegrations()

  // Check which CRMs are connected
  const connectedCRMs = {
    close: integrations?.close_enabled ?? false,
    activecampaign: integrations?.activecampaign_enabled ?? false,
    pipedrive: integrations?.pipedrive_enabled ?? false,
    hubspot: integrations?.hubspot_enabled ?? false,
    monday: integrations?.monday_enabled ?? false,
  }

  // Filter available CRM options based on connection status
  const availableCRMOptions = CRM_OPTIONS.filter(
    option => !option.requiresConnection || connectedCRMs[option.value as keyof typeof connectedCRMs]
  )

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TriggerFormData>({
    resolver: zodResolver(triggerSchema),
    defaultValues: {
      type: 'webhook',
      first_message_delay_seconds: 30,
    },
  })

  const selectedType = watch('type')
  const selectedEvent = watch('trigger_event')
  const eventFilters = watch('event_filters')

  // Actions state
  const [actions, setActions] = useState<Array<{
    id: string
    crm_type: TriggerType
    action: string
    fields: Record<string, unknown>
    enabled: boolean
  }>>([])

  // Get available events for the selected CRM type
  const availableEvents = selectedType ? CRM_EVENTS[selectedType] || [] : []

  // Get filter configuration for the selected event
  const filterConfig = selectedType && selectedEvent
    ? EVENT_FILTERS[selectedType]?.[selectedEvent]
    : null

  // Reset event and filters when type changes
  const handleTypeChange = (value: TriggerType) => {
    setValue('type', value)
    setValue('trigger_event', '')
    setValue('event_filters', {})
  }

  // Reset filters when event changes
  const handleEventChange = (value: string) => {
    setValue('trigger_event', value)
    setValue('event_filters', {})
  }

  // Update a single filter value (text or single select)
  const handleFilterChange = (key: string, value: string) => {
    const currentFilters = eventFilters || {}
    if (value) {
      setValue('event_filters', { ...currentFilters, [key]: value })
    } else {
      const { [key]: _, ...rest } = currentFilters
      setValue('event_filters', rest)
    }
  }

  // Update multi-select filter value
  const handleMultiSelectChange = (key: string, value: string, checked: boolean) => {
    const currentFilters = eventFilters || {}
    const currentValues = (currentFilters[key] as string[]) || []

    if (checked) {
      setValue('event_filters', { ...currentFilters, [key]: [...currentValues, value] })
    } else {
      const newValues = currentValues.filter(v => v !== value)
      if (newValues.length > 0) {
        setValue('event_filters', { ...currentFilters, [key]: newValues })
      } else {
        const { [key]: _, ...rest } = currentFilters
        setValue('event_filters', rest)
      }
    }
  }

  // Remove a value from multi-select
  const removeMultiSelectValue = (key: string, value: string) => {
    handleMultiSelectChange(key, value, false)
  }

  async function onSubmit(data: TriggerFormData) {
    try {
      // Build external_config with trigger_event, event_filters, and actions
      const external_config = {
        trigger_event: data.trigger_event,
        event_filters: data.event_filters,
        actions: actions.filter(a => a.enabled).map(a => ({
          crm_type: a.crm_type as string,
          action: a.action,
          fields: a.fields as Record<string, string | number | boolean | null>,
        })),
      }

      // Create trigger with external_config
      const triggerData = {
        name: data.name,
        type: data.type,
        whatsapp_account_id: data.whatsapp_account_id,
        agent_id: data.agent_id,
        first_message: data.first_message,
        first_message_delay_seconds: data.first_message_delay_seconds,
        external_config,
      }

      const trigger = await createTrigger.mutateAsync(triggerData)
      toast.success('Trigger erfolgreich erstellt')
      router.push(`/triggers/${trigger.id}`)
    } catch (error) {
      toast.error('Fehler beim Erstellen')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/triggers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Neuen Trigger erstellen</h1>
          <p className="text-muted-foreground">
            Konfiguriere einen neuen Automatisierungs-Trigger
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Grundeinstellungen</CardTitle>
            <CardDescription>
              Name und Typ des Triggers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="z.B. Lead aus Webinar"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Quelle *</Label>
              <Select
                value={selectedType}
                onValueChange={(value) => handleTypeChange(value as TriggerType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Quelle auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {availableCRMOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableCRMOptions.length === 1 && (
                <p className="text-xs text-muted-foreground">
                  Verbinde CRMs unter Einstellungen → Integrationen um mehr Optionen zu sehen.
                </p>
              )}
            </div>

            {selectedType && availableEvents.length > 0 && (
              <div className="space-y-2">
                <Label>Event *</Label>
                <Select
                  value={selectedEvent || ''}
                  onValueChange={handleEventChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Event auswählen" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {/* Group events by category */}
                    {(() => {
                      const categories = [...new Set(availableEvents.map(e => e.category || 'Allgemein'))]
                      return categories.map(category => (
                        <div key={category}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                            {category}
                          </div>
                          {availableEvents
                            .filter(e => (e.category || 'Allgemein') === category)
                            .map((event) => (
                              <SelectItem key={event.value} value={event.value}>
                                {event.label}
                              </SelectItem>
                            ))}
                        </div>
                      ))
                    })()}
                  </SelectContent>
                </Select>
                {selectedEvent && (
                  <p className="text-xs text-muted-foreground">
                    {availableEvents.find(e => e.value === selectedEvent)?.description}
                  </p>
                )}
              </div>
            )}

            {/* Event-specific filters */}
            {filterConfig && filterConfig.filters.length > 0 && (
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <Label className="text-sm font-medium">Filter-Bedingungen</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Optional: Schränke ein, wann der Trigger ausgelöst wird
                  </p>
                </div>
                {filterConfig.filters.map((filter) => (
                  <div key={filter.key} className="space-y-2">
                    <Label htmlFor={`filter-${filter.key}`}>{filter.label}</Label>

                    {/* Multi-select filter (e.g., Source for ActiveCampaign) */}
                    {filter.type === 'multi_select' && Array.isArray(filter.options) && (
                      <div className="space-y-3">
                        {/* Selected values as badges */}
                        {((eventFilters?.[filter.key] as string[]) || []).length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {((eventFilters?.[filter.key] as string[]) || []).map((value) => {
                              const option = filter.options && Array.isArray(filter.options)
                                ? filter.options.find(o => o.value === value)
                                : null
                              return (
                                <Badge
                                  key={value}
                                  variant="secondary"
                                  className="flex items-center gap-1 pr-1"
                                >
                                  {option?.label || value}
                                  <button
                                    type="button"
                                    onClick={() => removeMultiSelectValue(filter.key, value)}
                                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              )
                            })}
                          </div>
                        )}
                        {/* Checkbox options */}
                        <div className="grid grid-cols-2 gap-2 p-3 bg-muted/50 rounded-lg border">
                          {filter.options.map((option) => {
                            const isChecked = ((eventFilters?.[filter.key] as string[]) || []).includes(option.value)
                            return (
                              <label
                                key={option.value}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={(checked) =>
                                    handleMultiSelectChange(filter.key, option.value, !!checked)
                                  }
                                />
                                <span className="text-sm">{option.label}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Select filter (dynamic or static options) */}
                    {filter.type === 'select' && (
                      <Select
                        value={(eventFilters?.[filter.key] as string) || ''}
                        onValueChange={(value) => handleFilterChange(filter.key, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={filter.placeholder || 'Auswählen...'} />
                        </SelectTrigger>
                        <SelectContent>
                          {filter.options === 'dynamic' ? (
                            <SelectItem value="_dynamic" disabled>
                              Wird dynamisch geladen...
                            </SelectItem>
                          ) : (
                            Array.isArray(filter.options) && filter.options.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    )}

                    {/* Text filter */}
                    {filter.type === 'text' && (
                      <Input
                        id={`filter-${filter.key}`}
                        placeholder={filter.placeholder}
                        value={(eventFilters?.[filter.key] as string) || ''}
                        onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                      />
                    )}

                    {filter.description && (
                      <p className="text-xs text-muted-foreground">{filter.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verknüpfungen</CardTitle>
            <CardDescription>
              WhatsApp-Account und Agent für diesen Trigger
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>WhatsApp Account *</Label>
              <Select
                onValueChange={(value) => setValue('whatsapp_account_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Account auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.display_name || account.instance_name}
                      {account.phone_number && ` (${account.phone_number})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.whatsapp_account_id && (
                <p className="text-sm text-destructive">{errors.whatsapp_account_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Agent *</Label>
              <Select
                onValueChange={(value) => setValue('agent_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Agent auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {agents?.filter(a => a.is_active).map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.agent_id && (
                <p className="text-sm text-destructive">{errors.agent_id.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Erste Nachricht</CardTitle>
            <CardDescription>
              Diese Nachricht wird automatisch gesendet, wenn der Trigger ausgelöst wird
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="first_message">Nachricht *</Label>
              <Textarea
                id="first_message"
                placeholder="Hey {{name}}, danke für dein Interesse! 👋"
                rows={4}
                {...register('first_message')}
              />
              {errors.first_message && (
                <p className="text-sm text-destructive">{errors.first_message.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Verfügbare Variablen: {'{{name}}'}, {'{{email}}'}, {'{{phone}}'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="first_message_delay_seconds">Verzögerung (Sekunden)</Label>
              <Input
                id="first_message_delay_seconds"
                type="number"
                min={0}
                max={300}
                {...register('first_message_delay_seconds', { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">
                Zeit zwischen Trigger und erster Nachricht
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions Configuration */}
        <ActionConfig
          actions={actions}
          onChange={setActions}
          connectedCRMs={connectedCRMs}
        />

        <div className="flex justify-end gap-4">
          <Link href="/triggers">
            <Button type="button" variant="outline">
              Abbrechen
            </Button>
          </Link>
          <Button type="submit" disabled={createTrigger.isPending}>
            Trigger erstellen
          </Button>
        </div>
      </form>
    </div>
  )
}
