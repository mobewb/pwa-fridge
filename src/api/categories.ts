import { useQuery } from '@tanstack/react-query'
import { request } from './client'
import type { Category } from './types'

/** Catégories prédéfinies + catégories de l'utilisateur, en lecture seule côté PWA. */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'] as const,
    queryFn: () => request<Category[]>('/categories'),
    staleTime: 5 * 60 * 1000,
  })
}
