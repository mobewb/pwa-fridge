import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Product } from '../api/types'
import { expiryLabel } from '../lib/expiry'
import ProductCard from './ProductCard'

const base: Product = {
  id: 1,
  name: 'Yaourt',
  quantity: 4,
  unit: 'pots',
  category: 'Laitier',
  purchase_date: '2026-09-20',
  expiry_date: '2026-09-28',
  consumed: false,
  notes: null,
  days_left: 2,
  expired: false,
  created_at: '',
  updated_at: '',
}

function renderCard(product: Product) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ul>
          <ProductCard product={product} />
        </ul>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('expiryLabel', () => {
  it.each([
    [-3, 'Périmé depuis 3 j'],
    [0, "Expire aujourd'hui"],
    [1, 'Expire demain'],
    [5, 'Expire dans 5 j'],
  ])('days_left=%i', (days, label) => {
    expect(expiryLabel({ ...base, days_left: days, expired: days < 0 })).toBe(label)
  })
})

describe('ProductCard', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('affiche le produit et marque comme consommé via PATCH', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ ...base, consumed: true }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    renderCard(base)

    expect(screen.getByText('Yaourt')).toBeInTheDocument()
    expect(screen.getByText(/Expire dans 2 j/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Consommé/ }))
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/v1/products/1')
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body)).toEqual({ consumed: true })
  })
})
