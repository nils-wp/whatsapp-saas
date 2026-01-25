'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, X, CheckCircle, Clock, AlertCircle, Wifi, WifiOff, RefreshCw, Zap } from 'lucide-react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { PageLoader } from '@/components/shared/loading-spinner'
import { WebhookGenerator } from '@/components/triggers/webhook-generator'
import { TriggerTest } from '@/components/triggers/trigger-test'
import { WebhookTestMode } from '@/components/triggers/webhook-test-mode'
import { useTrigger, useUpdateTrigger } from '@/lib/hooks/use-triggers'
import { useAccounts } from '@/lib/hooks/use-accounts'
import { useAgents } from '@/lib/hooks/use-agents'
import {
  useIntegrations,
  useCloseStatuses,
  usePipedrivePipelines,
  useHubSpotPipelines,
  useActiveCampaignMetadata,
  useHubSpotMetadata,
} from '@/lib/hooks/use-integrations'
import {
  triggerSchema,
  type TriggerFormData,
  type TriggerType,
  CRM_EVENTS,
  EVENT_FILTERS,
} from '@/lib/utils/validation'
import { toast } from 'sonner'

// CRM-Kategorien für unterschiedliche Behandlung
const NATIVE_WEBHOOK_CRMS: TriggerType[] = ['pipedrive', 'monday']
const POLLING_CRMS: TriggerType[] = ['hubspot', 'close', 'activecampaign']
const ALL_CRM_TYPES: TriggerType[] = [...NATIVE_WEBHOOK_CRMS, ...POLLING_CRMS]

function getCRMDisplayName(type: TriggerType): string {
  const names: Record<TriggerType, string> = {
    webhook: 'Webhook',
    close: 'Close CRM',
    activecampaign: 'ActiveCampaign',
    pipedrive: 'Pipedrive',
    hubspot: 'HubSpot',
    monday: 'Monday.com',
  }
  return names[type] || type
}

// CRM type options with labels
const CRM_OPTIONS: Array<{ value: TriggerType; label: string; requiresConnection: boolean }> = [
  { value: 'webhook', label: 'Webhook', requiresConnection: false },
  { value: 'close', label: 'Close CRM', requiresConnection: true },
  { value: 'activecampaign', label: 'ActiveCampaign', requiresConnection: true },
  { value: 'pipedrive', label: 'Pipedrive', requiresConnection: true },
  { value: 'hubspot', label: 'HubSpot', requiresConnection: true },
  { value: 'monday', label: 'Monday.com', requiresConnection: true },
]

export default function EditTriggerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: trigger, isLoading } = useTrigger(id)
  const updateTrigger = useUpdateTrigger()
  const { data: accounts } = useAccounts()
  const { data: agents } = useAgents()
  const { data: integrations } = useIntegrations()

  // Fetch dynamic options for filters - Close
  const { data: closeStatuses, isLoading: closeStatusesLoading } = useCloseStatuses(
    integrations?.close_api_key ?? null
  )

  // Fetch dynamic options for filters - Pipedrive
  const { data: pipedrivePipelines, isLoading: pipedrivePipelinesLoading } = usePipedrivePipelines(
    integrations?.pipedrive_api_token ?? null
  )

  // Fetch dynamic options for filters - HubSpot (basic)
  const { data: hubspotPipelines, isLoading: hubspotPipelinesLoading } = useHubSpotPipelines(
    integrations?.hubspot_access_token ?? null
  )

  // Fetch dynamic options for filters - ActiveCampaign (all metadata)
  const { data: acMetadata, isLoading: acMetadataLoading } = useActiveCampaignMetadata(
    integrations?.activecampaign_api_url ?? null,
    integrations?.activecampaign_api_key ?? null
  )

  // Fetch dynamic options for filters - HubSpot (extended metadata)
  const { data: hubspotMetadata, isLoading: hubspotMetadataLoading } = useHubSpotMetadata(
    integrations?.hubspot_access_token ?? null
  )

  // Helper to get dynamic options for a filter
  const getDynamicOptions = (
    crmType: TriggerType,
    filterKey: string
  ): { options: Array<{ value: string; label: string }>; isLoading: boolean } => {
    // Close CRM
    if (crmType === 'close') {
      if (filterKey === 'target_status' || filterKey === 'lead_status') {
        return {
          options: closeStatuses?.leadStatuses?.map(s => ({ value: s.label, label: s.label })) ?? [],
          isLoading: closeStatusesLoading,
        }
      }
      if (filterKey === 'pipeline') {
        const pipelines = closeStatuses?.pipelines ?? []
        if (pipelines.length > 0) {
          return {
            options: pipelines.map(p => ({ value: p.id, label: p.name })),
            isLoading: closeStatusesLoading,
          }
        }
        return {
          options: closeStatuses?.opportunityStatuses?.map(s => ({ value: s.id, label: s.label })) ?? [],
          isLoading: closeStatusesLoading,
        }
      }
      if (filterKey === 'activity_type') {
        return {
          options: closeStatuses?.customActivityTypes?.map(a => ({ value: a.id, label: a.name })) ?? [],
          isLoading: closeStatusesLoading,
        }
      }
    }

    // ActiveCampaign
    if (crmType === 'activecampaign') {
      if (filterKey === 'list_id') {
        return {
          options: acMetadata?.lists?.map(l => ({ value: l.id, label: l.name })) ?? [],
          isLoading: acMetadataLoading,
        }
      }
      if (filterKey === 'pipeline_id') {
        return {
          options: acMetadata?.pipelines?.map(p => ({ value: p.id, label: p.title })) ?? [],
          isLoading: acMetadataLoading,
        }
      }
      if (filterKey === 'target_stage') {
        return {
          options: acMetadata?.stages?.map(s => ({ value: s.id, label: s.title })) ?? [],
          isLoading: acMetadataLoading,
        }
      }
      if (filterKey === 'form_id') {
        return {
          options: acMetadata?.forms?.map(f => ({ value: f.id, label: f.name })) ?? [],
          isLoading: acMetadataLoading,
        }
      }
      if (filterKey === 'automation_id') {
        return {
          options: acMetadata?.automations?.map(a => ({ value: a.id, label: a.name })) ?? [],
          isLoading: acMetadataLoading,
        }
      }
      if (filterKey === 'campaign_id') {
        return {
          options: acMetadata?.campaigns?.map(c => ({ value: c.id, label: c.name })) ?? [],
          isLoading: acMetadataLoading,
        }
      }
      if (filterKey === 'tag_name') {
        return {
          options: acMetadata?.tags?.map(t => ({ value: t.tag, label: t.tag })) ?? [],
          isLoading: acMetadataLoading,
        }
      }
    }

    // Pipedrive
    if (crmType === 'pipedrive') {
      if (filterKey === 'pipeline_id') {
        return {
          options: pipedrivePipelines?.pipelines?.map(p => ({ value: String(p.id), label: p.name })) ?? [],
          isLoading: pipedrivePipelinesLoading,
        }
      }
      if (filterKey === 'target_stage_id') {
        return {
          options: pipedrivePipelines?.stages?.map(s => ({ value: String(s.id), label: s.name })) ?? [],
          isLoading: pipedrivePipelinesLoading,
        }
      }
    }

    // HubSpot
    if (crmType === 'hubspot') {
      if (filterKey === 'pipeline') {
        return {
          options: hubspotPipelines?.pipelines?.map(p => ({ value: p.id, label: p.label })) ?? [],
          isLoading: hubspotPipelinesLoading,
        }
      }
      if (filterKey === 'target_stage') {
        return {
          options: hubspotMetadata?.stages?.map(s => ({ value: s.id, label: `${s.pipelineLabel} → ${s.label}` })) ?? [],
          isLoading: hubspotMetadataLoading,
        }
      }
      if (filterKey === 'form_id') {
        return {
          options: hubspotMetadata?.forms?.map(f => ({ value: f.id, label: f.name })) ?? [],
          isLoading: hubspotMetadataLoading,
        }
      }
      if (filterKey === 'property_name') {
        return {
          options: hubspotMetadata?.contactProperties?.map(p => ({ value: p.name, label: p.label })) ?? [],
          isLoading: hubspotMetadataLoading,
        }
      }
      if (filterKey === 'target_status') {
        return {
          options: hubspotMetadata?.ticketStages?.map(s => ({ value: s.id, label: `${s.pipelineLabel} → ${s.label}` })) ?? [],
          isLoading: hubspotMetadataLoading,
        }
      }
    }

    return { options: [], isLoading: false }
  }

  // Check which CRMs are connected
  const connectedCRMs = {
    close: integrations?.close_enabled ?? false,
    activecampaign: integrations?.activecampaign_enabled ?? false,
    pipedrive: integrations?.pipedrive_enabled ?? false,
    hubspot: integrations?.hubspot_enabled ?? false,
    monday: integrations?.monday_enabled ?? false,
  }

  // Filter available CRM options - include current type even if not connected
  const availableCRMOptions = CRM_OPTIONS.filter(
    option => !option.requiresConnection ||
              connectedCRMs[option.value as keyof typeof connectedCRMs] ||
              trigger?.type === option.value
  )

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TriggerFormData>({
    resolver: zodResolver(triggerSchema),
    values: trigger ? {
      name: trigger.name,
      type: trigger.type as TriggerType,
      whatsapp_account_id: trigger.whatsapp_account_id || '',
      agent_id: trigger.agent_id || '',
      first_message: trigger.first_message,
      // Convert seconds to minutes for display
      first_message_delay_minutes: Math.round(trigger.first_message_delay_seconds / 60),
      trigger_event: (trigger.external_config as { trigger_event?: string })?.trigger_event || '',
      event_filters: ((trigger.external_config as { event_filters?: Record<string, string | string[]> })?.event_filters || {}) as Record<string, string | string[]>,
    } : undefined,
  })

  const selectedType = watch('type')
  const selectedEvent = watch('trigger_event')
  const eventFilters = watch('event_filters')
  const isActive = trigger?.is_active ?? true

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

  // Update a single filter value
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

  const onSubmit: SubmitHandler<TriggerFormData> = async (data) => {
    try {
      // Build external_config with trigger_event and event_filters only
      // Actions are configured on the Agent, not the Trigger
      const external_config = {
        trigger_event: data.trigger_event,
        event_filters: data.event_filters,
      }

      await updateTrigger.mutateAsync({
        id,
        name: data.name,
        type: data.type,
        whatsapp_account_id: data.whatsapp_account_id,
        // Only include agent_id if selected (optional)
        agent_id: data.agent_id || null,
        first_message: data.first_message,
        // Convert minutes back to seconds for storage
        first_message_delay_seconds: data.first_message_delay_minutes * 60,
        external_config,
      })
      toast.success('Trigger gespeichert')
    } catch (error) {
      toast.error('Fehler beim Speichern')
    }
  }

  async function toggleActive() {
    try {
      await updateTrigger.mutateAsync({ id, is_active: !isActive })
      toast.success(isActive ? 'Trigger deaktiviert' : 'Trigger aktiviert')
    } catch (error) {
      toast.error('Fehler beim Aktualisieren')
    }
  }

  if (isLoading) {
    return <PageLoader />
  }

  if (!trigger) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Trigger nicht gefunden</p>
        <Link href="/triggers">
          <Button variant="outline" className="mt-4">
            Zurück zur Übersicht
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/triggers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{trigger.name}</h1>
            <p className="text-muted-foreground">
              Trigger bearbeiten
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={isActive}
              onCheckedChange={toggleActive}
              id="is_active"
            />
            <Label htmlFor="is_active">
              {isActive ? 'Aktiv' : 'Inaktiv'}
            </Label>
          </div>
          <Button onClick={handleSubmit(onSubmit)} disabled={updateTrigger.isPending}>
            <Save className="mr-2 h-4 w-4" />
            Speichern
          </Button>
        </div>
      </div>

      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">Einstellungen</TabsTrigger>
          <TabsTrigger value="webhook">
            {selectedType === 'webhook' ? 'Webhook' : 'Integration & Test'}
          </TabsTrigger>
          <TabsTrigger value="stats">Statistiken</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Grundeinstellungen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register('name')} />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Quelle</Label>
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
              </div>

              {selectedType && availableEvents.length > 0 && (
                <div className="space-y-2">
                  <Label>Event</Label>
                  <Select
                    value={selectedEvent || ''}
                    onValueChange={handleEventChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Event auswählen" />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
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

                      {/* Multi-select filter */}
                      {filter.type === 'multi_select' && Array.isArray(filter.options) && (
                        <div className="space-y-3">
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
                      {filter.type === 'select' && (() => {
                        const isDynamic = filter.options === 'dynamic'
                        const dynamicData = isDynamic && selectedType
                          ? getDynamicOptions(selectedType, filter.key)
                          : { options: [], isLoading: false }
                        const options = isDynamic ? dynamicData.options : (Array.isArray(filter.options) ? filter.options : [])
                        const isFilterLoading = isDynamic && dynamicData.isLoading

                        return (
                          <Select
                            value={(eventFilters?.[filter.key] as string) || ''}
                            onValueChange={(value) => handleFilterChange(filter.key, value)}
                            disabled={isFilterLoading}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={isFilterLoading ? 'Wird geladen...' : (filter.placeholder || 'Auswählen...')} />
                            </SelectTrigger>
                            <SelectContent>
                              {isFilterLoading ? (
                                <SelectItem value="_loading" disabled>
                                  Wird geladen...
                                </SelectItem>
                              ) : options.length === 0 ? (
                                <SelectItem value="_empty" disabled>
                                  Keine Optionen verfügbar
                                </SelectItem>
                              ) : (
                                options.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        )
                      })()}

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

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>WhatsApp Account</Label>
                  <Select
                    value={watch('whatsapp_account_id')}
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
                  <Label>Agent (Optional)</Label>
                  <Select
                    value={watch('agent_id') || '_none'}
                    onValueChange={(value) => setValue('agent_id', value === '_none' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kein Agent (nur Erstnachricht)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Kein Agent (nur Erstnachricht)</SelectItem>
                      {agents?.filter(a => a.is_active).map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Ohne Agent wird nur die Erstnachricht gesendet.
                  </p>
                </div>
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
                <Label>Nachricht</Label>
                <Textarea
                  {...register('first_message')}
                  rows={4}
                  placeholder="Hey {{name}}, danke für dein Interesse! 👋"
                />
                {errors.first_message && (
                  <p className="text-sm text-destructive">{errors.first_message.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Verfügbare Variablen: {'{{name}}'}, {'{{email}}'}, {'{{phone}}'}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Verzögerung (Minuten)</Label>
                <Input
                  type="number"
                  min={0}
                  max={60}
                  {...register('first_message_delay_minutes', { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">
                  Zeit zwischen Trigger und erster Nachricht (0 = sofort)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhook" className="space-y-6">
          {/* ===== CRM TRIGGER MIT NATIVEN WEBHOOKS (Pipedrive, Monday) ===== */}
          {NATIVE_WEBHOOK_CRMS.includes(selectedType) && (
            <>
              {/* Status-Karte für native Webhooks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Native Webhook-Integration
                  </CardTitle>
                  <CardDescription>
                    Der Webhook wurde automatisch bei {getCRMDisplayName(selectedType)} registriert
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Webhook Status */}
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {(trigger as { crm_webhook_status?: string }).crm_webhook_status === 'active' ? (
                        <>
                          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                            <Wifi className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="font-medium text-green-600 dark:text-green-400">Webhook aktiv</p>
                            <p className="text-sm text-muted-foreground">
                              Events werden in Echtzeit empfangen
                            </p>
                          </div>
                        </>
                      ) : (trigger as { crm_webhook_status?: string }).crm_webhook_status === 'failed' ? (
                        <>
                          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <WifiOff className="h-5 w-5 text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <p className="font-medium text-red-600 dark:text-red-400">Webhook-Fehler</p>
                            <p className="text-sm text-muted-foreground">
                              {(trigger as { crm_webhook_error?: string }).crm_webhook_error || 'Registrierung fehlgeschlagen'}
                            </p>
                          </div>
                        </>
                      ) : (trigger as { crm_webhook_status?: string }).crm_webhook_status === 'pending' ? (
                        <>
                          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                            <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                          </div>
                          <div>
                            <p className="font-medium text-yellow-600 dark:text-yellow-400">Wird registriert...</p>
                            <p className="text-sm text-muted-foreground">
                              Webhook wird bei {getCRMDisplayName(selectedType)} eingerichtet
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="p-2 bg-muted rounded-full">
                            <AlertCircle className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">Nicht konfiguriert</p>
                            <p className="text-sm text-muted-foreground">
                              Webhook muss noch registriert werden
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                    {(trigger as { crm_webhook_id?: string }).crm_webhook_id && (
                      <Badge variant="outline" className="font-mono text-xs">
                        ID: {(trigger as { crm_webhook_id?: string }).crm_webhook_id}
                      </Badge>
                    )}
                  </div>

                  {/* Info */}
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Automatische Konfiguration</AlertTitle>
                    <AlertDescription>
                      Der Webhook wurde automatisch bei {getCRMDisplayName(selectedType)} registriert.
                      Sie m&uuml;ssen keine URLs kopieren oder manuell konfigurieren.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Test Mode für native Webhooks */}
              <WebhookTestMode
                triggerId={trigger.id}
                webhookId={trigger.webhook_id}
                webhookSecret={trigger.webhook_secret}
                triggerType={trigger.type}
              />
            </>
          )}

          {/* ===== CRM TRIGGER MIT POLLING (HubSpot, Close, ActiveCampaign) ===== */}
          {POLLING_CRMS.includes(selectedType) && (
            <>
              {/* Status-Karte für Polling */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    API-Polling Integration
                  </CardTitle>
                  <CardDescription>
                    Events werden automatisch über die {getCRMDisplayName(selectedType)} API abgefragt
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Polling Status */}
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {(trigger as { polling_enabled?: boolean }).polling_enabled !== false ? (
                        <>
                          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                            <RefreshCw className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="font-medium text-green-600 dark:text-green-400">Polling aktiv</p>
                            <p className="text-sm text-muted-foreground">
                              Events werden alle 30-60 Sekunden abgefragt
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="p-2 bg-muted rounded-full">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">Polling inaktiv</p>
                            <p className="text-sm text-muted-foreground">
                              Trigger muss aktiviert werden
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                    {(trigger as { last_polled_at?: string }).last_polled_at && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Letzte Abfrage</p>
                        <p className="text-sm font-mono">
                          {new Date((trigger as { last_polled_at: string }).last_polled_at).toLocaleTimeString('de-DE')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Automatisches Event-Polling</AlertTitle>
                    <AlertDescription>
                      Da {getCRMDisplayName(selectedType)} keine nativen Webhooks unterst&uuml;tzt, werden
                      Events automatisch &uuml;ber die API abgefragt. Dies geschieht alle 30-60 Sekunden -
                      keine manuelle Konfiguration erforderlich.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Test Mode für Polling CRMs */}
              <WebhookTestMode
                triggerId={trigger.id}
                webhookId={trigger.webhook_id}
                webhookSecret={trigger.webhook_secret}
                triggerType={trigger.type}
              />
            </>
          )}

          {/* ===== GENERISCHER WEBHOOK (kein CRM) ===== */}
          {selectedType === 'webhook' && (
            <>
              {/* Webhook Test Mode - Listen for real events */}
              <WebhookTestMode
                triggerId={trigger.id}
                webhookId={trigger.webhook_id}
                webhookSecret={trigger.webhook_secret}
                triggerType={trigger.type}
              />

              {/* Webhook URL and Secret - nur für generische Webhooks */}
              <WebhookGenerator
                webhookId={trigger.webhook_id}
                webhookSecret={trigger.webhook_secret}
              />

              {/* Webhook Trigger Test - manueller Test */}
              <TriggerTest
                webhookId={trigger.webhook_id}
                webhookSecret={trigger.webhook_secret}
                triggerType={trigger.type as TriggerType}
                firstMessage={watch('first_message') || trigger.first_message}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Statistiken</CardTitle>
              <CardDescription>
                Leistung dieses Triggers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-8">
                <div className="text-center">
                  <p className="text-4xl font-bold">{trigger.total_triggered}</p>
                  <p className="text-muted-foreground">Ausgelöst</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold">{trigger.total_conversations}</p>
                  <p className="text-muted-foreground">Konversationen</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold">{trigger.total_bookings}</p>
                  <p className="text-muted-foreground">Buchungen</p>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Konversionsrate:{' '}
                  <span className="font-semibold text-foreground">
                    {trigger.total_triggered > 0
                      ? Math.round((trigger.total_bookings / trigger.total_triggered) * 100)
                      : 0}
                    %
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
