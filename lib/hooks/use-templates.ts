'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/types/database'

type Template = Tables<'templates'>

export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('active_users', { ascending: false })

      if (error) throw error
      return data as Template[]
    },
  })
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: ['templates', id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Template
    },
    enabled: !!id,
  })
}

export function useTemplateCategories() {
  return useQuery({
    queryKey: ['template-categories'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('templates')
        .select('category')
        .eq('is_active', true)

      if (error) throw error

      // Extract unique categories
      const categories = [...new Set(data.map(t => t.category))]
      return ['All', ...categories]
    },
  })
}
