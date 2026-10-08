import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, request } from './client'
import type { Household, ShopItem, ShopItemInput, ShopItemPatch } from './types'

const keys = {
  household: ['household'] as const,
  items: ['shop-items'] as const,
}

/** Foyer de l'utilisateur ; `null` s'il n'en a pas (404 côté API). */
export function useHousehold() {
  return useQuery({
    queryKey: keys.household,
    queryFn: async () => {
      try {
        return await request<Household>('/household')
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return null
        throw e
      }
    },
  })
}

export function useShopItems(enabled: boolean) {
  return useQuery({
    queryKey: keys.items,
    queryFn: () => request<ShopItem[]>('/shop-items'),
    enabled,
    refetchInterval: 15_000,
  })
}

function useInvalidateAll() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: keys.household }),
      queryClient.invalidateQueries({ queryKey: keys.items }),
    ])
}

export function useCreateHousehold() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: (name: string) =>
      request<Household>('/household', { method: 'POST', json: { name } }),
    onSuccess: invalidate,
  })
}

export function useJoinHousehold() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: (invite_code: string) =>
      request<Household>('/household/join', { method: 'POST', json: { invite_code } }),
    onSuccess: invalidate,
  })
}

export function useLeaveHousehold() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: () => request<void>('/household/leave', { method: 'POST' }),
    onSuccess: invalidate,
  })
}

export function useAddShopItem() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: (input: ShopItemInput) =>
      request<ShopItem>('/shop-items', { method: 'POST', json: input }),
    onSuccess: invalidate,
  })
}

export function useUpdateShopItem() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: ShopItemPatch }) =>
      request<ShopItem>(`/shop-items/${id}`, { method: 'PATCH', json: patch }),
    onSuccess: invalidate,
  })
}

export function useDeleteShopItem() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: (id: number) => request<void>(`/shop-items/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  })
}

export function useClearChecked() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: () => request<void>('/shop-items?checked=true', { method: 'DELETE' }),
    onSuccess: invalidate,
  })
}
