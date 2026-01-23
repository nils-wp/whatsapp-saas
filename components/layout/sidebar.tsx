'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  Phone,
  Bot,
  Zap,
  Plug,
  FileText,
  Settings,
  ChevronDown,
  Check,
  Plus,
  Building2,
  Wrench,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/providers/locale-provider'
import { ChatsetterIcon } from '@/components/shared/chatsetter-logo'
import { Button } from '@/components/ui/button'
import { useTenant } from '@/providers/tenant-provider'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const navigation = [
  { key: 'dashboard', href: '/', icon: LayoutDashboard },
  { key: 'agents', href: '/agents', icon: Bot },
  { key: 'triggers', href: '/triggers', icon: Zap },
  { key: 'phoneNumbers', href: '/accounts', icon: Phone },
  { key: 'integrations', href: '/integrations', icon: Plug },
  { key: 'tools', href: '/tools', icon: Wrench },
  { key: 'templates', href: '/templates', icon: FileText },
  { key: 'settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const { currentTenant, tenants, setCurrentTenant, createTenant, isLoading, user } = useTenant()
  const t = useTranslations('nav')
  const tCommon = useTranslations('common')
  const tProjects = useTranslations('projects')

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return
    await createTenant(newProjectName)
    setNewProjectName('')
    setShowNewProjectDialog(false)
  }

  const userInitials = user?.user_metadata?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || user?.email?.[0].toUpperCase() || 'U'

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 h-screen w-[72px] bg-[#111b21] border-r border-[#222d34] flex flex-col">
        {/* Logo */}
        <div className="flex items-center justify-center py-4">
          <ChatsetterIcon size={40} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col items-center pt-2 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  'relative flex items-center justify-center w-12 h-12 rounded-xl transition-all group',
                  isActive
                    ? 'bg-[#00a884]/15 text-[#00a884]'
                    : 'text-[#8696a0] hover:bg-[#202c33] hover:text-[#e9edef]'
                )}
                title={t(item.key)}
              >
                <item.icon className="h-5 w-5" />
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#00a884] rounded-r-full" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Project Selector (Compact) */}
        <div className="py-2 flex justify-center">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                className="w-10 h-10 rounded-xl bg-[#202c33] hover:bg-[#2a3942] flex items-center justify-center transition-colors"
                title={currentTenant?.name || tProjects('selectProject')}
              >
                <Building2 className="h-5 w-5 text-[#8696a0]" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0 bg-[#111b21] border-[#222d34] ml-2" align="start" side="right">
              <Command className="bg-transparent">
                <CommandInput placeholder={tProjects('searchProjects')} className="border-[#222d34] text-[#e9edef] placeholder:text-[#8696a0]" />
                <CommandList>
                  <CommandEmpty className="text-[#8696a0] py-4 text-center text-sm">{tProjects('noProjectsFound')}</CommandEmpty>
                  <CommandGroup>
                    {tenants.map((project) => (
                      <CommandItem
                        key={project.id}
                        onSelect={() => {
                          setCurrentTenant(project)
                          setOpen(false)
                        }}
                        className="cursor-pointer text-[#e9edef] hover:bg-[#202c33] aria-selected:bg-[#202c33]"
                      >
                        <Building2 className="mr-2 h-4 w-4 text-[#8696a0]" />
                        <span className="truncate">{project.name}</span>
                        <Check
                          className={cn(
                            'ml-auto h-4 w-4',
                            currentTenant?.id === project.id ? 'opacity-100 text-[#00a884]' : 'opacity-0'
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
                <CommandSeparator className="bg-[#222d34]" />
                <CommandList>
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setOpen(false)
                        setShowNewProjectDialog(true)
                      }}
                      className="cursor-pointer text-[#e9edef] hover:bg-[#202c33] aria-selected:bg-[#202c33]"
                    >
                      <Plus className="mr-2 h-4 w-4 text-[#00a884]" />
                      {tProjects('newProject')}
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* User Profile */}
        <div className="py-3 flex justify-center border-t border-[#222d34]">
          <div
            className="h-10 w-10 rounded-full bg-gradient-to-br from-[#00a884] to-[#02735e] flex items-center justify-center text-white text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity"
            title={userName}
          >
            {userInitials}
          </div>
        </div>
      </aside>

      {/* New Project Dialog */}
      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent className="bg-[#111b21] border-[#222d34]">
          <DialogHeader>
            <DialogTitle className="text-[#e9edef]">{tProjects('createNewProject')}</DialogTitle>
            <DialogDescription className="text-[#8696a0]">
              {tProjects('createDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[#e9edef]">{tProjects('projectName')}</Label>
              <Input
                id="name"
                placeholder={tProjects('projectNamePlaceholder')}
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateProject()
                }}
                className="bg-[#202c33] border-[#2a3942] text-[#e9edef] placeholder:text-[#8696a0] focus:border-[#00a884] focus:ring-[#00a884]/20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewProjectDialog(false)} className="border-[#2a3942] text-[#e9edef] hover:bg-[#202c33]">
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleCreateProject} disabled={!newProjectName.trim()} className="bg-[#00a884] hover:bg-[#02735e] text-white">
              {tCommon('create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
