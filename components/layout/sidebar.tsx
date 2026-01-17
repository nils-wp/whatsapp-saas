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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/providers/locale-provider'
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
          <div className="h-10 w-10 rounded-full bg-[#00a884] flex items-center justify-center">
            <svg
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
            >
              <path
                d="M16 4C9.373 4 4 9.373 4 16C4 18.251 4.632 20.35 5.73 22.15L4 28L10.05 26.34C11.78 27.34 13.82 27.92 16 27.92C22.627 27.92 28 22.547 28 15.92C28 9.373 22.627 4 16 4Z"
                fill="white"
              />
              <path
                d="M21.5 18.5C21.2 19.4 19.8 20.2 18.7 20.4C17.9 20.5 16.9 20.6 14.3 19.5C11.1 18.1 9.1 14.8 8.9 14.5C8.7 14.2 7.3 12.3 7.3 10.4C7.3 8.5 8.3 7.5 8.7 7.1C9.1 6.7 9.5 6.6 9.8 6.6C10 6.6 10.2 6.6 10.4 6.6C10.6 6.6 10.9 6.5 11.2 7.2C11.5 7.9 12.2 9.8 12.3 10C12.4 10.2 12.4 10.4 12.3 10.6C12.2 10.8 12.1 11 11.9 11.2C11.7 11.4 11.5 11.7 11.3 11.9C11.1 12.1 10.9 12.3 11.1 12.6C11.3 13 12.2 14.5 13.5 15.6C15.2 17 16.6 17.5 17 17.7C17.4 17.9 17.6 17.9 17.8 17.6C18 17.4 18.9 16.3 19.2 15.9C19.5 15.5 19.8 15.6 20.1 15.7C20.4 15.8 22.3 16.7 22.6 16.9C23 17.1 23.2 17.2 23.3 17.4C23.4 17.6 23.4 18.4 21.5 18.5Z"
                fill="#00a884"
              />
            </svg>
          </div>
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
