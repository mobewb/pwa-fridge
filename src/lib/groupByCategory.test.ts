import { describe, expect, it } from 'vitest'
import type { Category, ShopItem } from '../api/types'
import { groupByCategory } from './groupByCategory'

const cat = (id: number, name: string, emoji: string): Category => ({
  id,
  user_id: null,
  name,
  emoji,
  default_expiry_days: 5,
  created_at: '',
  is_default: true,
})
const item = (id: number, category: string | null, checked = false): ShopItem => ({
  id,
  household_id: 1,
  name: `a${id}`,
  quantity: '1',
  category,
  checked,
  added_by: 1,
  created_at: '',
})

const categories = [cat(1, 'Laitier', '🥛'), cat(2, 'Fruits', '🍎')]

describe('groupByCategory', () => {
  it("respecte l'ordre des catégories", () => {
    const groups = groupByCategory([item(1, 'Fruits'), item(2, 'Laitier')], categories)
    expect(groups.map((g) => g.name)).toEqual(['Laitier', 'Fruits'])
  })

  it('range les catégories inconnues ou vides dans Autres, en dernier', () => {
    const groups = groupByCategory([item(1, null), item(2, 'Inconnue'), item(3, 'Fruits')], categories)
    expect(groups.map((g) => g.name)).toEqual(['Fruits', 'Autres'])
    expect(groups[1].items).toHaveLength(2)
  })

  it('place les articles cochés en fin de groupe', () => {
    const [group] = groupByCategory([item(1, 'Fruits', true), item(2, 'Fruits')], categories)
    expect(group.items.map((i) => i.id)).toEqual([2, 1])
  })

  it('omet les catégories vides', () => {
    expect(groupByCategory([], categories)).toEqual([])
  })
})
