'use client'

import { useState } from 'react'
import {
  Check,
  ChevronsUpDown,
  Plus,
  Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTenant } from '@/providers/tenant-provider'

type Project = {
  id: string
  name: string
  slug: string
}

export function ProjectSelector() {
  const [open, setOpen] = useState(false)
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const { currentTenant, tenants, setCurrentTenant, createTenant, isLoading } = useTenant()

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return

    await createTenant(newProjectName)
    setNewProjectName('')
    setShowNewProjectDialog(false)
  }

  if (isLoading) {
    return (
      <Button variant="outline" className="w-[200px] justify-start" disabled>
        <Building2 className="mr-2 h-4 w-4" />
        <span className="text-muted-foreground">Laden...</span>
      </Button>
    )
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Projekt auswählen"
            className="w-[200px] justify-between bg-secondary/50 border-border hover:bg-accent"
          >
            <div className="flex items-center gap-2 truncate">
              <Building2 className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">
                {currentTenant?.name || 'Projekt wählen'}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Projekt suchen..." />
            <CommandList>
              <CommandEmpty>Keine Projekte gefunden.</CommandEmpty>
              <CommandGroup heading="Projekte">
                {tenants.map((project) => (
                  <CommandItem
                    key={project.id}
                    onSelect={() => {
                      setCurrentTenant(project)
                      setOpen(false)
                    }}
                    className="cursor-pointer"
                  >
                    <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{project.name}</span>
                    <Check
                      className={cn(
                        'ml-auto h-4 w-4',
                        currentTenant?.id === project.id
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            <CommandSeparator />
            <CommandList>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false)
                    setShowNewProjectDialog(true)
                  }}
                  className="cursor-pointer"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Neues Projekt
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neues Projekt erstellen</DialogTitle>
            <DialogDescription>
              Erstelle ein neues Projekt um deine WhatsApp-Automatisierungen zu organisieren.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Projektname</Label>
              <Input
                id="name"
                placeholder="z.B. Wachstumspartner"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateProject()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewProjectDialog(false)}
            >
              Abbrechen
            </Button>
            <Button onClick={handleCreateProject} disabled={!newProjectName.trim()}>
              Erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
