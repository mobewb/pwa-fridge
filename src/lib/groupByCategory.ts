import type { Category, ShopItem } from '../api/types'

export const OTHER_CATEGORY = 'Autres'

export interface ShopGroup {
  name: string
  emoji: string
  items: ShopItem[]
}

/** Regroupe par catégorie (ordre de `categories`), « Autres » en dernier, articles cochés en fin de groupe. */
export function groupByCategory(items: ShopItem[], categories: Category[]): ShopGroup[] {
  const known = new Map(categories.map((c) => [c.name, c]))
  const buckets = new Map<string, ShopItem[]>()
  for (const item of items) {
    const key = item.category && known.has(item.category) ? item.category : OTHER_CATEGORY
    buckets.set(key, [...(buckets.get(key) ?? []), item])
  }
  const order = [...categories.map((c) => c.name), OTHER_CATEGORY]
  return order
    .filter((name) => buckets.has(name))
    .map((name) => ({
      name,
      emoji: known.get(name)?.emoji ?? '🛒',
      // tri stable : non cochés d'abord
      items: [...buckets.get(name)!].sort((a, b) => Number(a.checked) - Number(b.checked)),
    }))
}
