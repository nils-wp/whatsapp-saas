'use client'

import { useQuery } from '@tanstack/react-query'

type UserInfo = {
  name: string | null
  email: string
}

type UsersMap = Record<string, UserInfo>

export function useUserNames(userIds: (string | null | undefined)[]) {
  const validIds = userIds.filter((id): id is string => !!id)

  return useQuery({
    queryKey: ['user-names', validIds.sort().join(',')],
    queryFn: async (): Promise<UsersMap> => {
      if (validIds.length === 0) return {}

      const response = await fetch('/api/users/names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: validIds }),
      })

      if (!response.ok) return {}

      const data = await response.json()
      return data.users || {}
    },
    enabled: validIds.length > 0,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}

export function getUserDisplayName(usersMap: UsersMap | undefined, userId: string | null | undefined): string | null {
  if (!userId || !usersMap) return null
  const user = usersMap[userId]
  if (!user) return null
  return user.name || user.email.split('@')[0]
}
