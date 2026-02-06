'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  MessageSquare,
  Bot,
  Users,
  Phone,
  Plug,
  Settings,
  ChevronDown,
  Check,
  Plus,
  Building2,
  LogOut,
  User,
  CreditCard,
  PhoneCall,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/providers/locale-provider'
import { ChatsetterLogo } from '@/components/shared/chatsetter-logo'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

// Navigation structure with groups
const navigationGroups = [
  {
    label: 'HAUPTMENU',
    items: [
      { key: 'dashboard', href: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { key: 'conversations', href: '/conversations', icon: MessageSquare, label: 'Konversationen' },
      { key: 'contacts', href: '/contacts', icon: Users, label: 'Kontakte' },
      { key: 'agents', href: '/agents', icon: Bot, label: 'Agenten' },
    ],
  },
  {
    label: 'TOOLS',
    items: [
      { key: 'numberCheck', href: '/tools', icon: PhoneCall, label: 'Nummer-Check' },
    ],
  },
  {
    label: 'EINSTELLUNGEN',
    items: [
      { key: 'phoneNumbers', href: '/accounts', icon: Phone, label: 'Accounts' },
      { key: 'integrations', href: '/integrations', icon: Plug, label: 'Integrationen' },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const { currentTenant, tenants, setCurrentTenant, createTenant, user } = useTenant()
  const tCommon = useTranslations('common')
  const tProjects = useTranslations('projects')

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return
    await createTenant(newProjectName)
    setNewProjectName('')
    setShowNewProjectDialog(false)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const userInitials = user?.user_metadata?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || user?.email?.[0].toUpperCase() || 'U'

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const userEmail = user?.email || ''

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 h-screen w-[240px] bg-slate-950 border-r border-slate-800/50 flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800/50">
          <ChatsetterLogo size={32} showText />
        </div>

        {/* Project Selector */}
        <div className="px-3 py-3 border-b border-slate-800/50">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-slate-900/50 hover:bg-slate-900 border border-slate-800/50 transition-all duration-200"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="text-sm font-medium text-white truncate">
                    {currentTenant?.name || tProjects('selectProject')}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[216px] p-0 bg-slate-900 border-slate-700" align="start">
              <Command className="bg-transparent">
                <CommandInput
                  placeholder={tProjects('searchProjects')}
                  className="border-slate-700 text-white placeholder:text-slate-400"
                />
                <CommandList>
                  <CommandEmpty className="text-slate-400 py-4 text-center text-sm">
                    {tProjects('noProjectsFound')}
                  </CommandEmpty>
                  <CommandGroup>
                    {tenants.map((project) => (
                      <CommandItem
                        key={project.id}
                        onSelect={() => {
                          setCurrentTenant(project)
                          setOpen(false)
                        }}
                        className="cursor-pointer text-white hover:bg-slate-800 aria-selected:bg-slate-800"
                      >
                        <Building2 className="mr-2 h-4 w-4 text-slate-400" />
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
                <CommandSeparator className="bg-slate-700" />
                <CommandList>
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setOpen(false)
                        setShowNewProjectDialog(true)
                      }}
                      className="cursor-pointer text-white hover:bg-slate-800 aria-selected:bg-slate-800"
                    >
                      <Plus className="mr-2 h-4 w-4 text-emerald-500" />
                      {tProjects('newProject')}
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navigationGroups.map((group, groupIndex) => (
            <div key={group.label} className={cn(groupIndex > 0 && 'mt-6')}>
              <div className="px-3 mb-2">
                <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                  {group.label}
                </span>
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href ||
                    (item.href !== '/' && pathname.startsWith(item.href))

                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={cn(
                        'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-emerald-500 rounded-r-full" />
                      )}
                      <item.icon className={cn(
                        'h-5 w-5 shrink-0',
                        isActive ? 'text-emerald-500' : 'text-slate-400'
                      )} />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile */}
        <div className="border-t border-slate-800/50 p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-white/5 transition-all duration-200">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                  {userInitials}
                </div>
                <div className="flex flex-col items-start min-w-0 flex-1">
                  <span className="text-sm font-medium text-white truncate w-full text-left">
                    {userName}
                  </span>
                  <span className="text-xs text-slate-400 truncate w-full text-left">
                    {userEmail}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[216px] bg-slate-900 border-slate-700"
              align="end"
              side="top"
              sideOffset={8}
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-white">{userName}</p>
                  <p className="text-xs text-slate-400">{userEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem
                onClick={() => router.push('/settings')}
                className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push('/settings/billing')}
                className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Abrechnung</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push('/settings')}
                className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Einstellungen</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-400 hover:text-red-300 hover:bg-slate-800 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Abmelden</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* New Project Dialog */}
      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">{tProjects('createNewProject')}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {tProjects('createDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">{tProjects('projectName')}</Label>
              <Input
                id="name"
                placeholder={tProjects('projectNamePlaceholder')}
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateProject()
                }}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewProjectDialog(false)}
              className="border-slate-700 text-white hover:bg-slate-800"
            >
              {tCommon('cancel')}
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!newProjectName.trim()}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {tCommon('create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
