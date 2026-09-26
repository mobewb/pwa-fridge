import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { request } from './client'
import type { Product, ProductInput, ProductPatch } from './types'

export const EXPIRING_DAYS = 3

export interface ProductFilters {
  consumed?: boolean
  category?: string
}

const keys = {
  all: ['products'] as const,
  list: (filters: ProductFilters) => ['products', 'list', filters] as const,
  expiring: ['products', 'expiring'] as const,
  detail: (id: number) => ['products', 'detail', id] as const,
}

export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: keys.list(filters),
    queryFn: () => {
      const params = new URLSearchParams({ limit: '200' })
      if (filters.consumed !== undefined) params.set('consumed', String(filters.consumed))
      if (filters.category) params.set('category', filters.category)
      return request<Product[]>(`/products?${params}`)
    },
  })
}

export function useExpiringProducts() {
  return useQuery({
    queryKey: keys.expiring,
    queryFn: () => request<Product[]>(`/products/expiring?days=${EXPIRING_DAYS}`),
  })
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: keys.detail(id),
    queryFn: () => request<Product>(`/products/${id}`),
  })
}

function useInvalidate() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: keys.all })
}

export function useCreateProduct() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (input: ProductInput) =>
      request<Product>('/products', { method: 'POST', json: input }),
    onSuccess: invalidate,
  })
}

export function useUpdateProduct() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: ProductPatch }) =>
      request<Product>(`/products/${id}`, { method: 'PATCH', json: patch }),
    onSuccess: invalidate,
  })
}

export function useDeleteProduct() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: number) => request<void>(`/products/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  })
}
