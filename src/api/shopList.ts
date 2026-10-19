import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { request } from './client'
import type { Household, ShopItem, ShopItemInput, ShopItemPatch } from './types'

const keys = {
  households: ['households'] as const,
  items: (householdId: number) => ['shop-items', householdId] as const,
}

/** Foyers de l'utilisateur ; liste vide s'il n'en a aucun. */
export function useHouseholds() {
  return useQuery({
    queryKey: keys.households,
    queryFn: () => request<Household[]>('/households'),
  })
}

export function useShopItems(householdId: number | null) {
  return useQuery({
    queryKey: keys.items(householdId ?? 0),
    queryFn: () => request<ShopItem[]>(`/households/${householdId}/shop-items`),
    enabled: householdId !== null,
    refetchInterval: 15_000,
  })
}

function useInvalidateAll() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: keys.households }),
      queryClient.invalidateQueries({ queryKey: ['shop-items'] }),
    ])
}

export function useCreateHousehold() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: (name: string) =>
      request<Household>('/households', { method: 'POST', json: { name } }),
    onSuccess: invalidate,
  })
}

export function useJoinHousehold() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: (invite_code: string) =>
      request<Household>('/households/join', { method: 'POST', json: { invite_code } }),
    onSuccess: invalidate,
  })
}

export function useLeaveHousehold() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: (householdId: number) =>
      request<void>(`/households/${householdId}/leave`, { method: 'POST' }),
    onSuccess: invalidate,
  })
}

export function useAddShopItem(householdId: number) {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: (input: ShopItemInput) =>
      request<ShopItem>(`/households/${householdId}/shop-items`, {
        method: 'POST',
        json: input,
      }),
    onSuccess: invalidate,
  })
}

export function useUpdateShopItem(householdId: number) {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: ShopItemPatch }) =>
      request<ShopItem>(`/households/${householdId}/shop-items/${id}`, {
        method: 'PATCH',
        json: patch,
      }),
    onSuccess: invalidate,
  })
}

export function useDeleteShopItem(householdId: number) {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: (id: number) =>
      request<void>(`/households/${householdId}/shop-items/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  })
}

export function useClearChecked(householdId: number) {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: () =>
      request<void>(`/households/${householdId}/shop-items?checked=true`, {
        method: 'DELETE',
      }),
    onSuccess: invalidate,
  })
}
