'use client'

import { useState } from 'react'
import { Save, Building2, Clock, Globe } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { useTenant } from '@/providers/tenant-provider'

const TIMEZONES = [
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Europe/Vienna', label: 'Wien (CET/CEST)' },
  { value: 'Europe/Zurich', label: 'Zürich (CET/CEST)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'America/New_York', label: 'New York (EST/EDT)' },
]

const WEEKDAYS = [
  { value: 1, label: 'Montag' },
  { value: 2, label: 'Dienstag' },
  { value: 3, label: 'Mittwoch' },
  { value: 4, label: 'Donnerstag' },
  { value: 5, label: 'Freitag' },
  { value: 6, label: 'Samstag' },
  { value: 0, label: 'Sonntag' },
]

export default function SettingsPage() {
  const { currentTenant } = useTenant()
  const [tenantName, setTenantName] = useState(currentTenant?.name || '')
  const [officeHoursEnabled, setOfficeHoursEnabled] = useState(true)
  const [officeStart, setOfficeStart] = useState('08:00')
  const [officeEnd, setOfficeEnd] = useState('18:00')
  const [timezone, setTimezone] = useState('Europe/Berlin')
  const [workDays, setWorkDays] = useState([1, 2, 3, 4, 5])

  const toggleWorkDay = (day: number) => {
    setWorkDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const handleSave = () => {
    toast.success('Einstellungen gespeichert')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Einstellungen</h1>
          <p className="text-muted-foreground">
            Verwalte deine Projekt-Einstellungen.
          </p>
        </div>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Speichern
        </Button>
      </div>

      <div className="grid gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Allgemein</CardTitle>
                <CardDescription>
                  Grundlegende Projekt-Einstellungen
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Projektname</Label>
              <Input
                id="name"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                placeholder="z.B. Wachstumspartner"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Zeitzone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Office Hours */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Geschäftszeiten</CardTitle>
                <CardDescription>
                  Wann soll der Agent automatisch antworten?
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-medium">Geschäftszeiten aktivieren</div>
                <div className="text-sm text-muted-foreground">
                  Nachrichten außerhalb der Geschäftszeiten werden in die Queue gestellt
                </div>
              </div>
              <Switch
                checked={officeHoursEnabled}
                onCheckedChange={setOfficeHoursEnabled}
              />
            </div>

            {officeHoursEnabled && (
              <>
                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="start">Start</Label>
                    <Input
                      id="start"
                      type="time"
                      value={officeStart}
                      onChange={(e) => setOfficeStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end">Ende</Label>
                    <Input
                      id="end"
                      type="time"
                      value={officeEnd}
                      onChange={(e) => setOfficeEnd(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Arbeitstage</Label>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map((day) => (
                      <label
                        key={day.value}
                        className="flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer hover:bg-accent"
                      >
                        <Checkbox
                          checked={workDays.includes(day.value)}
                          onCheckedChange={() => toggleWorkDay(day.value)}
                        />
                        <span className="text-sm">{day.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
