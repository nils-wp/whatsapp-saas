'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/types/database'
import { toast } from 'sonner'

type Tenant = Tables<'tenants'>
type TenantMember = Tables<'tenant_members'>

interface TenantContextType {
  user: User | null
  currentTenant: Tenant | null
  tenants: Tenant[]
  member: TenantMember | null
  isLoading: boolean
  setCurrentTenant: (tenant: Tenant) => void
  createTenant: (name: string) => Promise<Tenant | null>
  refetch: () => Promise<void>
}

const TenantContext = createContext<TenantContextType | undefined>(undefined)

const CURRENT_TENANT_KEY = 'chatsetter_current_tenant_id'

export function TenantProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [currentTenant, setCurrentTenantState] = useState<Tenant | null>(null)
  const [member, setMember] = useState<TenantMember | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchTenantData = useCallback(async () => {
    const supabase = createClient()

    // Get current user
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    setUser(currentUser)

    if (!currentUser) {
      setTenants([])
      setCurrentTenantState(null)
      setMember(null)
      setIsLoading(false)
      return
    }

    // Get all tenant memberships
    const { data: membersData } = await supabase
      .from('tenant_members')
      .select('*, tenants(*)')
      .eq('user_id', currentUser.id)

    if (membersData && membersData.length > 0) {
      const tenantsList = membersData
        .map((m) => m.tenants as unknown as Tenant)
        .filter(Boolean)

      setTenants(tenantsList)

      // Get saved tenant ID from localStorage
      const savedTenantId = typeof window !== 'undefined'
        ? localStorage.getItem(CURRENT_TENANT_KEY)
        : null

      // Find saved tenant or use first one
      let selectedTenant = tenantsList.find((t) => t.id === savedTenantId)
      if (!selectedTenant) {
        selectedTenant = tenantsList[0]
      }

      setCurrentTenantState(selectedTenant)

      // Set current member
      const currentMember = membersData.find(
        (m) => (m.tenants as unknown as Tenant)?.id === selectedTenant?.id
      )
      setMember(currentMember || null)
    } else {
      // New user without tenant - redirect to onboarding
      router.push('/onboarding')
    }

    setIsLoading(false)
  }, [router])

  const setCurrentTenant = useCallback((tenant: Tenant) => {
    setCurrentTenantState(tenant)
    if (typeof window !== 'undefined') {
      localStorage.setItem(CURRENT_TENANT_KEY, tenant.id)
    }
    toast.success(`Projekt gewechselt zu "${tenant.name}"`)
  }, [])

  const createTenant = useCallback(async (name: string): Promise<Tenant | null> => {
    if (!user) return null

    const supabase = createClient()
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Create tenant
    const { data: newTenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name,
        slug: `${slug}-${Date.now()}`,
        owner_id: user.id,
      })
      .select()
      .single()

    if (tenantError || !newTenant) {
      toast.error('Fehler beim Erstellen des Projekts')
      return null
    }

    // Create membership
    const { error: memberError } = await supabase
      .from('tenant_members')
      .insert({
        tenant_id: newTenant.id,
        user_id: user.id,
        role: 'owner',
        accepted_at: new Date().toISOString(),
      })

    if (memberError) {
      toast.error('Fehler beim Erstellen der Mitgliedschaft')
      return null
    }

    // Create default settings
    await supabase
      .from('tenant_settings')
      .insert({
        tenant_id: newTenant.id,
      })

    // Update local state
    setTenants((prev) => [...prev, newTenant])
    setCurrentTenant(newTenant)

    toast.success(`Projekt "${name}" erstellt`)
    return newTenant
  }, [user, setCurrentTenant])

  useEffect(() => {
    fetchTenantData()

    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchTenantData()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchTenantData])

  return (
    <TenantContext.Provider
      value={{
        user,
        currentTenant,
        tenants,
        member,
        isLoading,
        setCurrentTenant,
        createTenant,
        refetch: fetchTenantData,
      }}
    >
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return context
}
