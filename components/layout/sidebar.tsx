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
  ChevronsUpDown,
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
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-[#0f0f0f] border-r border-[#1f1f1f]">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 px-4 py-5 border-b border-[#1f1f1f]">
            <div className="relative h-9 w-9 shrink-0">
              <svg
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-9 w-9"
              >
                <rect width="32" height="32" rx="8" fill="#22c55e" />
                <path
                  d="M16 7C11.0294 7 7 11.0294 7 16C7 17.6569 7.45587 19.2101 8.25 20.5417L7.25 24.75L11.625 23.7917C12.9149 24.5341 14.4069 25 16 25C20.9706 25 25 20.9706 25 16C25 11.0294 20.9706 7 16 7Z"
                  fill="white"
                />
                <path
                  d="M20.5 18.5C20.25 19.25 19 20 18 20C17 20 14.5 19.5 12.5 17.5C10.5 15.5 10 13 10 12C10 11 10.75 9.75 11.5 9.5C11.75 9.42857 12.25 9.5 12.5 10C12.75 10.5 13.5 12 13.5 12.25C13.5 12.5 13.5 12.75 13.25 13C13 13.25 12.75 13.5 12.75 13.75C12.75 14 12.9107 14.1607 13 14.25C13.5 14.75 14.75 16 15.75 16.5C16.25 16.75 16.5 16.75 16.75 16.5C17 16.25 17.5 15.75 17.75 15.5C18 15.25 18.25 15.25 18.5 15.5C18.75 15.75 20 16.75 20.25 17C20.5 17.25 20.75 17.75 20.5 18.5Z"
                  fill="#22c55e"
                />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-white text-base">Chatsetter</span>
              <span className="text-xs text-gray-500">AI Appointment Setter</span>
            </div>
          </div>

          {/* Project Selector */}
          <div className="px-3 py-3">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between bg-[#1a1a1a] border border-[#2a2a2a] hover:bg-[#252525] h-11"
                >
                  <div className="flex items-center gap-2 truncate">
                    <div className="h-7 w-7 rounded-md bg-[#2a2a2a] flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-gray-400" />
                    </div>
                    <span className="truncate text-sm text-gray-200">
                      {isLoading ? tCommon('loading') : (currentTenant?.name || tProjects('selectProject'))}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[232px] p-0 bg-[#1a1a1a] border-[#2a2a2a]" align="start">
                <Command className="bg-transparent">
                  <CommandInput placeholder={tProjects('searchProjects')} className="border-[#2a2a2a]" />
                  <CommandList>
                    <CommandEmpty>{tProjects('noProjectsFound')}</CommandEmpty>
                    <CommandGroup>
                      {tenants.map((project) => (
                        <CommandItem
                          key={project.id}
                          onSelect={() => {
                            setCurrentTenant(project)
                            setOpen(false)
                          }}
                          className="cursor-pointer"
                        >
                          <Building2 className="mr-2 h-4 w-4 text-gray-500" />
                          <span className="truncate">{project.name}</span>
                          <Check
                            className={cn(
                              'ml-auto h-4 w-4',
                              currentTenant?.id === project.id ? 'opacity-100 text-emerald-500' : 'opacity-0'
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                  <CommandSeparator className="bg-[#2a2a2a]" />
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
                        {tProjects('newProject')}
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-gray-200'
                  )}
                >
                  <item.icon className={cn('h-5 w-5', isActive && 'text-emerald-500')} />
                  <span>{t(item.key)}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Profile */}
          <div className="border-t border-[#1f1f1f] p-3">
            <div className="flex items-center gap-3 rounded-lg px-2 py-2">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-sm font-semibold">
                {userInitials}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-white truncate">{userName}</span>
                <span className="text-xs text-emerald-500">Premium Plan</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* New Project Dialog */}
      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a]">
          <DialogHeader>
            <DialogTitle>{tProjects('createNewProject')}</DialogTitle>
            <DialogDescription>
              {tProjects('createDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{tProjects('projectName')}</Label>
              <Input
                id="name"
                placeholder={tProjects('projectNamePlaceholder')}
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateProject()
                }}
                className="bg-[#0f0f0f] border-[#2a2a2a]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewProjectDialog(false)} className="border-[#2a2a2a]">
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleCreateProject} disabled={!newProjectName.trim()} className="bg-emerald-500 hover:bg-emerald-600">
              {tCommon('create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
