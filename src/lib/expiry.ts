import type { Product } from '../api/types'

export function expiryLabel(product: Product): string {
  const d = product.days_left
  if (d < 0) return `Périmé depuis ${-d} j`
  if (d === 0) return "Expire aujourd'hui"
  if (d === 1) return 'Expire demain'
  return `Expire dans ${d} j`
}

export function expiryLevel(product: Product): 'expired' | 'soon' | 'ok' {
  if (product.expired) return 'expired'
  return product.days_left <= 3 ? 'soon' : 'ok'
}
