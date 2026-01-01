'use client'

import { useState } from 'react'
import { Plus, GripVertical, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import type { ScriptStep } from '@/types'

interface ScriptBuilderProps {
  steps: ScriptStep[]
  onChange: (steps: ScriptStep[]) => void
}

export function ScriptBuilder({ steps, onChange }: ScriptBuilderProps) {
  const [openSteps, setOpenSteps] = useState<Set<number>>(new Set([1]))

  function addStep() {
    const newStep: ScriptStep = {
      step: steps.length + 1,
      name: '',
      goal: '',
      template: '',
    }
    onChange([...steps, newStep])
    setOpenSteps(new Set([...openSteps, newStep.step]))
  }

  function updateStep(index: number, updates: Partial<ScriptStep>) {
    const newSteps = [...steps]
    newSteps[index] = { ...newSteps[index], ...updates }
    onChange(newSteps)
  }

  function removeStep(index: number) {
    const newSteps = steps.filter((_, i) => i !== index)
    // Renumber steps
    const renumbered = newSteps.map((step, i) => ({
      ...step,
      step: i + 1,
    }))
    onChange(renumbered)
  }

  function moveStep(fromIndex: number, direction: 'up' | 'down') {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1
    if (toIndex < 0 || toIndex >= steps.length) return

    const newSteps = [...steps]
    const [removed] = newSteps.splice(fromIndex, 1)
    newSteps.splice(toIndex, 0, removed)

    // Renumber steps
    const renumbered = newSteps.map((step, i) => ({
      ...step,
      step: i + 1,
    }))
    onChange(renumbered)
  }

  function toggleStep(step: number) {
    const newOpen = new Set(openSteps)
    if (newOpen.has(step)) {
      newOpen.delete(step)
    } else {
      newOpen.add(step)
    }
    setOpenSteps(newOpen)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Konversations-Skript</h3>
          <p className="text-sm text-muted-foreground">
            Definiere die Schritte, die der Agent durchlaufen soll
          </p>
        </div>
        <Button onClick={addStep} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Schritt hinzufügen
        </Button>
      </div>

      <div className="space-y-2">
        {steps.map((step, index) => (
          <Collapsible
            key={step.step}
            open={openSteps.has(step.step)}
            onOpenChange={() => toggleStep(step.step)}
          >
            <Card>
              <CardHeader className="py-3">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Schritt {step.step}
                  </span>
                  <span className="font-semibold flex-1">
                    {step.name || 'Unbenannt'}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveStep(index, 'up')}
                      disabled={index === 0}
                      className="h-8 w-8"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveStep(index, 'down')}
                      disabled={index === steps.length - 1}
                      className="h-8 w-8"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeStep(index)}
                      className="h-8 w-8 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        {openSteps.has(step.step) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </div>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={step.name}
                        onChange={(e) =>
                          updateStep(index, { name: e.target.value })
                        }
                        placeholder="z.B. greeting"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ziel</Label>
                      <Input
                        value={step.goal}
                        onChange={(e) =>
                          updateStep(index, { goal: e.target.value })
                        }
                        placeholder="z.B. Rapport aufbauen"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Nachrichtenvorlage</Label>
                    <Textarea
                      value={step.template}
                      onChange={(e) =>
                        updateStep(index, { template: e.target.value })
                      }
                      placeholder="Hey {{contact_name}}, schön dass du schreibst!"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Verfügbare Variablen: {'{{contact_name}}'}, {'{{booking_cta}}'}, {'{{calendly_link}}'}
                    </p>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>

      {steps.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground mb-4">
              Noch keine Skript-Schritte definiert
            </p>
            <Button onClick={addStep} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Ersten Schritt hinzufügen
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
