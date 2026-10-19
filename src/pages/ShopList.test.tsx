import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ShopList from './ShopList'

function routeFetch(routes: Record<string, [number, unknown]>) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const key = Object.keys(routes).find((k) => String(url).includes(k))
      const [status, body] = key ? routes[key] : [404, {}]
      return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      })
    }),
  )
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ShopList />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

afterEach(() => vi.unstubAllGlobals())

describe('ShopList', () => {
  it("propose de créer ou rejoindre un foyer s'il n'y en a pas", async () => {
    routeFetch({ '/household': [404, { detail: 'none' }], '/categories': [200, []] })
    renderPage()
    expect(await screen.findByLabelText("Code d'invitation")).toBeInTheDocument()
  })

  it('affiche les articles groupés par catégorie', async () => {
    routeFetch({
      '/household': [200, { id: 1, name: 'Maison', invite_code: 'ABC12345', members: [] }],
      '/shop-items': [
        200,
        [
          {
            id: 1, household_id: 1, name: 'Pommes', quantity: '2', category: 'Fruits',
            checked: false, added_by: 1, created_at: '',
          },
        ],
      ],
      '/categories': [
        200,
        [{ id: 1, user_id: null, name: 'Fruits', emoji: '🍎', default_expiry_days: 5, created_at: '', is_default: true }],
      ],
    })
    renderPage()
    expect(await screen.findByText('Pommes')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Fruits/ })).toBeInTheDocument()
    expect(screen.getByText('ABC12345')).toBeInTheDocument()
  })
})
