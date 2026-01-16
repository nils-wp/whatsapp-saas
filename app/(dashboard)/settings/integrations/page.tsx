'use client'

import { useState } from 'react'
import {
  Webhook,
  ArrowDownToLine,
  ArrowUpFromLine,
  Copy,
  Check,
  ExternalLink,
  Key,
  RefreshCw,
  Settings2,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  useIntegrations,
  useUpdateIntegrations,
  useTestClose,
  useTestActiveCampaign,
  useTestPipedrive,
  useTestHubSpot,
  useTestMonday,
  useCloseStatuses,
  usePipedrivePipelines,
  useHubSpotPipelines,
  useMondayBoards,
  useMondayBoardDetails,
  type TenantIntegrations,
} from '@/lib/hooks/use-integrations'

export default function IntegrationsPage() {
  const { data: integrations, isLoading } = useIntegrations()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integrationen</h1>
        <p className="text-muted-foreground">
          Verbinde CRM-Systeme und automatisiere deine Workflows.
        </p>
      </div>

      <Tabs defaultValue="crm" className="space-y-6">
        <TabsList className="bg-secondary">
          <TabsTrigger value="crm">CRM</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="crm" className="space-y-6">
          <CRMSection integrations={integrations} />
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <WebhooksSection integrations={integrations} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ===========================================
// CRM Section
// ===========================================

function CRMSection({ integrations }: { integrations: TenantIntegrations | null | undefined }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <CloseCard integrations={integrations} />
        <ActiveCampaignCard integrations={integrations} />
        <PipedriveCard integrations={integrations} />
        <HubSpotCard integrations={integrations} />
        <MondayCard integrations={integrations} />
      </div>
    </div>
  )
}

// ===========================================
// Close CRM Card
// ===========================================

function CloseCard({ integrations }: { integrations: TenantIntegrations | null | undefined }) {
  const [showDialog, setShowDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const updateIntegrations = useUpdateIntegrations()
  const testClose = useTestClose()

  const isEnabled = integrations?.close_enabled ?? false

  const handleConnect = async () => {
    if (!apiKey) {
      toast.error('Bitte gib einen API Key ein')
      return
    }

    const result = await testClose.mutateAsync({ apiKey })

    if (result.success) {
      await updateIntegrations.mutateAsync({
        close_enabled: true,
        close_api_key: apiKey,
      })
      toast.success('Close CRM verbunden')
      setShowDialog(false)
      setApiKey('')
    } else {
      toast.error(result.error || 'Verbindung fehlgeschlagen')
    }
  }

  const handleDisconnect = async () => {
    await updateIntegrations.mutateAsync({ close_enabled: false })
    toast.success('Close CRM getrennt')
  }

  return (
    <>
      <CRMCard
        name="Close CRM"
        description="Leads und SMS-Kommunikation synchronisieren"
        isEnabled={isEnabled}
        color="#1C2B3A"
        icon={
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 9h6v6H9z" fill="white" />
          </svg>
        }
        features={[
          'Leads automatisch anlegen',
          'Nachrichten als SMS speichern',
          'Lead-Status synchronisieren',
        ]}
        onConnect={() => setShowDialog(true)}
        onDisconnect={handleDisconnect}
        onSettings={() => setShowSettingsDialog(true)}
      />

      {/* Connect Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close CRM verbinden</DialogTitle>
            <DialogDescription>
              Gib deinen Close API Key ein um die Integration zu aktivieren.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="close-key">API Key</Label>
              <Input
                id="close-key"
                type="password"
                placeholder="api_xxxxxxxxxxxxxxxx"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Findest du unter Settings → API Keys
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleConnect} disabled={testClose.isPending}>
              {testClose.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verbinden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <CloseSettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        integrations={integrations}
      />
    </>
  )
}

function CloseSettingsDialog({
  open,
  onOpenChange,
  integrations,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  integrations: TenantIntegrations | null | undefined
}) {
  const updateIntegrations = useUpdateIntegrations()
  const { data: statuses } = useCloseStatuses(integrations?.close_api_key ?? null)

  const [statusNew, setStatusNew] = useState(integrations?.close_status_new || '')
  const [statusContacted, setStatusContacted] = useState(integrations?.close_status_contacted || '')
  const [statusBooked, setStatusBooked] = useState(integrations?.close_status_booked || '')
  const [statusNotInterested, setStatusNotInterested] = useState(integrations?.close_status_not_interested || '')

  const handleSave = async () => {
    await updateIntegrations.mutateAsync({
      close_status_new: statusNew || null,
      close_status_contacted: statusContacted || null,
      close_status_booked: statusBooked || null,
      close_status_not_interested: statusNotInterested || null,
    })
    toast.success('Einstellungen gespeichert')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Close CRM Einstellungen</DialogTitle>
          <DialogDescription>
            Ordne die Lead-Status den Conversation-Outcomes zu.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Status für neue Leads</Label>
            <Select value={statusNew} onValueChange={setStatusNew}>
              <SelectTrigger>
                <SelectValue placeholder="Status wählen" />
              </SelectTrigger>
              <SelectContent>
                {statuses?.leadStatuses?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status für kontaktierte Leads</Label>
            <Select value={statusContacted} onValueChange={setStatusContacted}>
              <SelectTrigger>
                <SelectValue placeholder="Status wählen" />
              </SelectTrigger>
              <SelectContent>
                {statuses?.leadStatuses?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status für gebuchte Termine</Label>
            <Select value={statusBooked} onValueChange={setStatusBooked}>
              <SelectTrigger>
                <SelectValue placeholder="Status wählen" />
              </SelectTrigger>
              <SelectContent>
                {statuses?.leadStatuses?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status für kein Interesse</Label>
            <Select value={statusNotInterested} onValueChange={setStatusNotInterested}>
              <SelectTrigger>
                <SelectValue placeholder="Status wählen" />
              </SelectTrigger>
              <SelectContent>
                {statuses?.leadStatuses?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={updateIntegrations.isPending}>
            {updateIntegrations.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ===========================================
// ActiveCampaign Card
// ===========================================

function ActiveCampaignCard({ integrations }: { integrations: TenantIntegrations | null | undefined }) {
  const [showDialog, setShowDialog] = useState(false)
  const [apiUrl, setApiUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const updateIntegrations = useUpdateIntegrations()
  const testAC = useTestActiveCampaign()

  const isEnabled = integrations?.activecampaign_enabled ?? false

  const handleConnect = async () => {
    if (!apiUrl || !apiKey) {
      toast.error('Bitte fülle alle Felder aus')
      return
    }

    const result = await testAC.mutateAsync({ apiUrl, apiKey })

    if (result.success) {
      await updateIntegrations.mutateAsync({
        activecampaign_enabled: true,
        activecampaign_api_url: apiUrl,
        activecampaign_api_key: apiKey,
      })
      toast.success('ActiveCampaign verbunden')
      setShowDialog(false)
      setApiUrl('')
      setApiKey('')
    } else {
      toast.error(result.error || 'Verbindung fehlgeschlagen')
    }
  }

  const handleDisconnect = async () => {
    await updateIntegrations.mutateAsync({ activecampaign_enabled: false })
    toast.success('ActiveCampaign getrennt')
  }

  return (
    <>
      <CRMCard
        name="ActiveCampaign"
        description="Kontakte und Tags synchronisieren"
        isEnabled={isEnabled}
        color="#356AE6"
        icon={
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        }
        features={[
          'Kontakte automatisch anlegen',
          'Tags für Status-Updates',
          'Custom Fields synchronisieren',
        ]}
        onConnect={() => setShowDialog(true)}
        onDisconnect={handleDisconnect}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ActiveCampaign verbinden</DialogTitle>
            <DialogDescription>
              Gib deine ActiveCampaign API-Daten ein.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ac-url">Account URL</Label>
              <Input
                id="ac-url"
                placeholder="https://yourname.api-us1.com"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ac-key">API Key</Label>
              <Input
                id="ac-key"
                type="password"
                placeholder="Dein ActiveCampaign API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleConnect} disabled={testAC.isPending}>
              {testAC.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verbinden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ===========================================
// Pipedrive Card
// ===========================================

function PipedriveCard({ integrations }: { integrations: TenantIntegrations | null | undefined }) {
  const [showDialog, setShowDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [apiToken, setApiToken] = useState('')
  const updateIntegrations = useUpdateIntegrations()
  const testPipedrive = useTestPipedrive()

  const isEnabled = integrations?.pipedrive_enabled ?? false

  const handleConnect = async () => {
    if (!apiToken) {
      toast.error('Bitte gib einen API Token ein')
      return
    }

    const result = await testPipedrive.mutateAsync({ apiToken })

    if (result.success) {
      await updateIntegrations.mutateAsync({
        pipedrive_enabled: true,
        pipedrive_api_token: apiToken,
      })
      toast.success('Pipedrive verbunden')
      setShowDialog(false)
      setApiToken('')
    } else {
      toast.error(result.error || 'Verbindung fehlgeschlagen')
    }
  }

  const handleDisconnect = async () => {
    await updateIntegrations.mutateAsync({ pipedrive_enabled: false })
    toast.success('Pipedrive getrennt')
  }

  return (
    <>
      <CRMCard
        name="Pipedrive"
        description="Deals und Aktivitäten synchronisieren"
        isEnabled={isEnabled}
        color="#017737"
        icon={
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
          </svg>
        }
        features={[
          'Personen automatisch anlegen',
          'Deals erstellen und tracken',
          'Aktivitäten loggen',
        ]}
        onConnect={() => setShowDialog(true)}
        onDisconnect={handleDisconnect}
        onSettings={() => setShowSettingsDialog(true)}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pipedrive verbinden</DialogTitle>
            <DialogDescription>
              Gib deinen Pipedrive API Token ein.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pipedrive-token">API Token</Label>
              <Input
                id="pipedrive-token"
                type="password"
                placeholder="Dein Pipedrive API Token"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Findest du unter Einstellungen → Persönliche Einstellungen → API
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleConnect} disabled={testPipedrive.isPending}>
              {testPipedrive.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verbinden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PipedriveSettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        integrations={integrations}
      />
    </>
  )
}

function PipedriveSettingsDialog({
  open,
  onOpenChange,
  integrations,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  integrations: TenantIntegrations | null | undefined
}) {
  const updateIntegrations = useUpdateIntegrations()
  const { data: pipelineData } = usePipedrivePipelines(integrations?.pipedrive_api_token ?? null)

  const [pipelineId, setPipelineId] = useState(integrations?.pipedrive_pipeline_id || '')
  const [stageNew, setStageNew] = useState(integrations?.pipedrive_stage_new || '')
  const [stageContacted, setStageContacted] = useState(integrations?.pipedrive_stage_contacted || '')
  const [stageBooked, setStageBooked] = useState(integrations?.pipedrive_stage_booked || '')
  const [stageLost, setStageLost] = useState(integrations?.pipedrive_stage_lost || '')

  const filteredStages = pipelineData?.stages?.filter(s => s.pipeline_id === pipelineId) || []

  const handleSave = async () => {
    await updateIntegrations.mutateAsync({
      pipedrive_pipeline_id: pipelineId || null,
      pipedrive_stage_new: stageNew || null,
      pipedrive_stage_contacted: stageContacted || null,
      pipedrive_stage_booked: stageBooked || null,
      pipedrive_stage_lost: stageLost || null,
    })
    toast.success('Einstellungen gespeichert')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Pipedrive Einstellungen</DialogTitle>
          <DialogDescription>
            Ordne Pipeline-Stages den Conversation-Outcomes zu.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Pipeline</Label>
            <Select value={pipelineId} onValueChange={setPipelineId}>
              <SelectTrigger>
                <SelectValue placeholder="Pipeline wählen" />
              </SelectTrigger>
              <SelectContent>
                {pipelineData?.pipelines?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {pipelineId && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>Stage für neue Deals</Label>
                <Select value={stageNew} onValueChange={setStageNew}>
                  <SelectTrigger>
                    <SelectValue placeholder="Stage wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStages.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Stage für kontaktierte Leads</Label>
                <Select value={stageContacted} onValueChange={setStageContacted}>
                  <SelectTrigger>
                    <SelectValue placeholder="Stage wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStages.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Stage für gebuchte Termine</Label>
                <Select value={stageBooked} onValueChange={setStageBooked}>
                  <SelectTrigger>
                    <SelectValue placeholder="Stage wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStages.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Stage für verlorene Deals</Label>
                <Select value={stageLost} onValueChange={setStageLost}>
                  <SelectTrigger>
                    <SelectValue placeholder="Stage wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStages.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={updateIntegrations.isPending}>
            {updateIntegrations.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ===========================================
// HubSpot Card
// ===========================================

function HubSpotCard({ integrations }: { integrations: TenantIntegrations | null | undefined }) {
  const [showDialog, setShowDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [accessToken, setAccessToken] = useState('')
  const updateIntegrations = useUpdateIntegrations()
  const testHubSpot = useTestHubSpot()

  const isEnabled = integrations?.hubspot_enabled ?? false

  const handleConnect = async () => {
    if (!accessToken) {
      toast.error('Bitte gib einen Access Token ein')
      return
    }

    const result = await testHubSpot.mutateAsync({ accessToken })

    if (result.success) {
      await updateIntegrations.mutateAsync({
        hubspot_enabled: true,
        hubspot_access_token: accessToken,
        hubspot_portal_id: result.portalId || null,
      })
      toast.success('HubSpot verbunden')
      setShowDialog(false)
      setAccessToken('')
    } else {
      toast.error(result.error || 'Verbindung fehlgeschlagen')
    }
  }

  const handleDisconnect = async () => {
    await updateIntegrations.mutateAsync({ hubspot_enabled: false })
    toast.success('HubSpot getrennt')
  }

  return (
    <>
      <CRMCard
        name="HubSpot"
        description="Kontakte und Deals synchronisieren"
        isEnabled={isEnabled}
        color="#FF7A59"
        icon={
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
            <path d="M18.164 7.93V5.084a2.198 2.198 0 001.267-1.984 2.21 2.21 0 00-4.42 0c0 .873.52 1.626 1.266 1.976v2.848a5.673 5.673 0 00-3.03 1.306L6.857 4.394a2.25 2.25 0 00.076-.559 2.2 2.2 0 10-2.21 2.21c.344 0 .668-.086.962-.23l6.486 4.907a5.675 5.675 0 00.006 4.398l-2.156 1.63a2.197 2.197 0 00-1.319-.437 2.21 2.21 0 100 4.42 2.21 2.21 0 002.133-2.82l2.063-1.559a5.714 5.714 0 10-.02-7.424z"/>
          </svg>
        }
        features={[
          'Kontakte synchronisieren',
          'Deals und Pipeline-Status',
          'Notizen für Aktivitäten',
        ]}
        onConnect={() => setShowDialog(true)}
        onDisconnect={handleDisconnect}
        onSettings={() => setShowSettingsDialog(true)}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>HubSpot verbinden</DialogTitle>
            <DialogDescription>
              Gib deinen HubSpot Private App Access Token ein.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="hubspot-token">Access Token</Label>
              <Input
                id="hubspot-token"
                type="password"
                placeholder="pat-xxx-xxxxxxxx-xxxx"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Erstelle eine Private App unter Settings → Integrations → Private Apps
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleConnect} disabled={testHubSpot.isPending}>
              {testHubSpot.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verbinden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <HubSpotSettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        integrations={integrations}
      />
    </>
  )
}

function HubSpotSettingsDialog({
  open,
  onOpenChange,
  integrations,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  integrations: TenantIntegrations | null | undefined
}) {
  const updateIntegrations = useUpdateIntegrations()
  const { data: pipelineData } = useHubSpotPipelines(integrations?.hubspot_access_token ?? null)

  const [pipelineId, setPipelineId] = useState(integrations?.hubspot_pipeline_id || '')
  const [stageNew, setStageNew] = useState(integrations?.hubspot_stage_new || '')
  const [stageContacted, setStageContacted] = useState(integrations?.hubspot_stage_contacted || '')
  const [stageBooked, setStageBooked] = useState(integrations?.hubspot_stage_booked || '')
  const [stageLost, setStageLost] = useState(integrations?.hubspot_stage_lost || '')

  const filteredStages = pipelineData?.stages?.filter(s => s.pipeline_id === pipelineId) || []

  const handleSave = async () => {
    await updateIntegrations.mutateAsync({
      hubspot_pipeline_id: pipelineId || null,
      hubspot_stage_new: stageNew || null,
      hubspot_stage_contacted: stageContacted || null,
      hubspot_stage_booked: stageBooked || null,
      hubspot_stage_lost: stageLost || null,
    })
    toast.success('Einstellungen gespeichert')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>HubSpot Einstellungen</DialogTitle>
          <DialogDescription>
            Ordne Pipeline-Stages den Conversation-Outcomes zu.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Pipeline</Label>
            <Select value={pipelineId} onValueChange={setPipelineId}>
              <SelectTrigger>
                <SelectValue placeholder="Pipeline wählen" />
              </SelectTrigger>
              <SelectContent>
                {pipelineData?.pipelines?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {pipelineId && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>Stage für neue Deals</Label>
                <Select value={stageNew} onValueChange={setStageNew}>
                  <SelectTrigger>
                    <SelectValue placeholder="Stage wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStages.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Stage für kontaktierte Leads</Label>
                <Select value={stageContacted} onValueChange={setStageContacted}>
                  <SelectTrigger>
                    <SelectValue placeholder="Stage wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStages.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Stage für gebuchte Termine</Label>
                <Select value={stageBooked} onValueChange={setStageBooked}>
                  <SelectTrigger>
                    <SelectValue placeholder="Stage wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStages.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Stage für verlorene Deals</Label>
                <Select value={stageLost} onValueChange={setStageLost}>
                  <SelectTrigger>
                    <SelectValue placeholder="Stage wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStages.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={updateIntegrations.isPending}>
            {updateIntegrations.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ===========================================
// Monday.com Card
// ===========================================

function MondayCard({ integrations }: { integrations: TenantIntegrations | null | undefined }) {
  const [showDialog, setShowDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [apiToken, setApiToken] = useState('')
  const updateIntegrations = useUpdateIntegrations()
  const testMonday = useTestMonday()

  const isEnabled = integrations?.monday_enabled ?? false

  const handleConnect = async () => {
    if (!apiToken) {
      toast.error('Bitte gib einen API Token ein')
      return
    }

    const result = await testMonday.mutateAsync({ apiToken })

    if (result.success) {
      await updateIntegrations.mutateAsync({
        monday_enabled: true,
        monday_api_token: apiToken,
      })
      toast.success('Monday.com verbunden')
      setShowDialog(false)
      setApiToken('')
    } else {
      toast.error(result.error || 'Verbindung fehlgeschlagen')
    }
  }

  const handleDisconnect = async () => {
    await updateIntegrations.mutateAsync({ monday_enabled: false })
    toast.success('Monday.com getrennt')
  }

  return (
    <>
      <CRMCard
        name="Monday.com"
        description="Items und Updates synchronisieren"
        isEnabled={isEnabled}
        color="#FF3D57"
        icon={
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        }
        features={[
          'Items automatisch anlegen',
          'Updates als Aktivitäten',
          'Gruppen für Status-Tracking',
        ]}
        onConnect={() => setShowDialog(true)}
        onDisconnect={handleDisconnect}
        onSettings={() => setShowSettingsDialog(true)}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Monday.com verbinden</DialogTitle>
            <DialogDescription>
              Gib deinen Monday.com API Token ein.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="monday-token">API Token</Label>
              <Input
                id="monday-token"
                type="password"
                placeholder="Dein Monday.com API Token"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Findest du unter Profilbild → Developers → My Access Tokens
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleConnect} disabled={testMonday.isPending}>
              {testMonday.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verbinden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MondaySettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        integrations={integrations}
      />
    </>
  )
}

function MondaySettingsDialog({
  open,
  onOpenChange,
  integrations,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  integrations: TenantIntegrations | null | undefined
}) {
  const updateIntegrations = useUpdateIntegrations()
  const { data: boardsData } = useMondayBoards(integrations?.monday_api_token ?? null)

  const [boardId, setBoardId] = useState(integrations?.monday_board_id || '')
  const { data: boardDetails } = useMondayBoardDetails(integrations?.monday_api_token ?? null, boardId)

  const [phoneColumnId, setPhoneColumnId] = useState(integrations?.monday_phone_column_id || '')
  const [groupNew, setGroupNew] = useState(integrations?.monday_group_new || '')
  const [groupContacted, setGroupContacted] = useState(integrations?.monday_group_contacted || '')
  const [groupBooked, setGroupBooked] = useState(integrations?.monday_group_booked || '')
  const [groupLost, setGroupLost] = useState(integrations?.monday_group_lost || '')

  const phoneColumns = boardDetails?.columns?.filter(c => c.type === 'phone') || []

  const handleSave = async () => {
    await updateIntegrations.mutateAsync({
      monday_board_id: boardId || null,
      monday_phone_column_id: phoneColumnId || null,
      monday_group_new: groupNew || null,
      monday_group_contacted: groupContacted || null,
      monday_group_booked: groupBooked || null,
      monday_group_lost: groupLost || null,
    })
    toast.success('Einstellungen gespeichert')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Monday.com Einstellungen</DialogTitle>
          <DialogDescription>
            Wähle Board, Spalten und Gruppen für die Synchronisation.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Board</Label>
            <Select value={boardId} onValueChange={setBoardId}>
              <SelectTrigger>
                <SelectValue placeholder="Board wählen" />
              </SelectTrigger>
              <SelectContent>
                {boardsData?.boards?.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {boardId && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>Telefon-Spalte</Label>
                <Select value={phoneColumnId} onValueChange={setPhoneColumnId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Spalte wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {phoneColumns.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />
              <p className="text-sm font-medium">Gruppen-Zuordnung</p>

              <div className="space-y-2">
                <Label>Gruppe für neue Leads</Label>
                <Select value={groupNew} onValueChange={setGroupNew}>
                  <SelectTrigger>
                    <SelectValue placeholder="Gruppe wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {boardDetails?.groups?.map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Gruppe für kontaktierte Leads</Label>
                <Select value={groupContacted} onValueChange={setGroupContacted}>
                  <SelectTrigger>
                    <SelectValue placeholder="Gruppe wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {boardDetails?.groups?.map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Gruppe für gebuchte Termine</Label>
                <Select value={groupBooked} onValueChange={setGroupBooked}>
                  <SelectTrigger>
                    <SelectValue placeholder="Gruppe wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {boardDetails?.groups?.map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Gruppe für verlorene Leads</Label>
                <Select value={groupLost} onValueChange={setGroupLost}>
                  <SelectTrigger>
                    <SelectValue placeholder="Gruppe wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {boardDetails?.groups?.map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={updateIntegrations.isPending}>
            {updateIntegrations.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ===========================================
// Reusable CRM Card Component
// ===========================================

function CRMCard({
  name,
  description,
  isEnabled,
  color,
  icon,
  features,
  onConnect,
  onDisconnect,
  onSettings,
}: {
  name: string
  description: string
  isEnabled: boolean
  color: string
  icon: React.ReactNode
  features: string[]
  onConnect: () => void
  onDisconnect: () => void
  onSettings?: () => void
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${color}20`, color }}
            >
              {icon}
            </div>
            <div>
              <CardTitle className="text-lg">{name}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <Badge variant={isEnabled ? 'default' : 'outline'}>
            {isEnabled ? (
              <><CheckCircle2 className="mr-1 h-3 w-3" /> Verbunden</>
            ) : (
              'Nicht verbunden'
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm text-muted-foreground">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              {feature}
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          {isEnabled ? (
            <>
              {onSettings && (
                <Button variant="outline" className="flex-1" onClick={onSettings}>
                  <Settings2 className="mr-2 h-4 w-4" />
                  Einstellungen
                </Button>
              )}
              <Button variant="destructive" onClick={onDisconnect}>
                <X className="mr-2 h-4 w-4" />
                Trennen
              </Button>
            </>
          ) : (
            <Button className="w-full" onClick={onConnect}>
              <Key className="mr-2 h-4 w-4" />
              Verbinden
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ===========================================
// Webhooks Section (unchanged from before)
// ===========================================

function WebhooksSection({ integrations }: { integrations: TenantIntegrations | null | undefined }) {
  const [copiedIncoming, setCopiedIncoming] = useState(false)

  const incomingWebhookUrl = 'https://app.chatsetter.io/api/webhook/your-trigger-id'

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedIncoming(true)
    setTimeout(() => setCopiedIncoming(false), 2000)
    toast.success('In Zwischenablage kopiert')
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <ArrowDownToLine className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Incoming Webhooks</CardTitle>
              <CardDescription>
                Empfange Daten von externen Tools um Konversationen zu starten
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <div className="flex gap-2">
              <Input
                value={incomingWebhookUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(incomingWebhookUrl)}
              >
                {copiedIncoming ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Erstelle einen Trigger um eine individuelle Webhook-URL zu erhalten
            </p>
          </div>

          <Separator />

          <div className="rounded-lg bg-secondary p-4 font-mono text-sm">
            <pre className="overflow-x-auto text-muted-foreground">
{`POST /api/webhook/[triggerId]
Content-Type: application/json

{
  "phone": "+491512345678",
  "name": "Max Mustermann",
  "email": "max@example.com"
}`}
            </pre>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <ArrowUpFromLine className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Outgoing Webhooks</CardTitle>
              <CardDescription>
                Sende Events an externe Tools bei Konversations-Updates
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Outgoing Webhooks werden automatisch an alle verbundenen CRMs gesendet.
            Zusätzlich kannst du eigene Webhook-Endpoints konfigurieren.
          </p>

          <div className="space-y-3">
            <Label>Unterstützte Events</Label>
            <div className="space-y-2">
              {[
                { name: 'Nachricht empfangen', event: 'message.received' },
                { name: 'Nachricht gesendet', event: 'message.sent' },
                { name: 'Termin gebucht', event: 'booking.created' },
                { name: 'Eskalation', event: 'conversation.escalated' },
                { name: 'Konversation beendet', event: 'conversation.completed' },
              ].map((e) => (
                <div key={e.event} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="text-sm font-medium">{e.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{e.event}</div>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
