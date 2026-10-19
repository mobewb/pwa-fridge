import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ShopList from './ShopList'

type Route = [status: number, body: unknown]
type Routes = Record<string, Route | ((init?: RequestInit) => Route)>

const maison = { id: 1, name: 'Maison', invite_code: 'ABC12345', members: [] }
const bureau = { id: 2, name: 'Bureau', invite_code: 'XYZ98765', members: [] }

function item(id: number, householdId: number, name: string, checked = false) {
  return {
    id, household_id: householdId, name, quantity: '1', category: null,
    checked, added_by: 1, created_at: '',
  }
}

/** Les clés les plus longues sont testées en premier : `/households/1/shop-items` avant `/households`. */
function routeFetch(routes: Routes) {
  const keys = Object.keys(routes).sort((a, b) => b.length - a.length)
  const fn = vi.fn(async (url: string, init?: RequestInit) => {
    const key = keys.find((k) => String(url).includes(k))
    const route: Routes[string] = key ? routes[key] : [404, {}]
    const [status, body] = typeof route === 'function' ? route(init) : route
    return new Response(status === 204 ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  })
  vi.stubGlobal('fetch', fn)
  return fn
}

function calls(fn: ReturnType<typeof routeFetch>, method: string) {
  return fn.mock.calls
    .filter(([, init]) => (init?.method ?? 'GET') === method)
    .map(([url]) => String(url))
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

beforeEach(() => localStorage.clear())
afterEach(() => vi.unstubAllGlobals())

describe('ShopList – plusieurs foyers', () => {
  it("n'affiche pas le sélecteur sans foyer et propose créer / rejoindre", async () => {
    routeFetch({ '/households': [200, []], '/categories': [200, []] })
    renderPage()
    expect(await screen.findByLabelText('Nom du foyer')).toBeInTheDocument()
    expect(screen.getByLabelText("Code d'invitation")).toBeInTheDocument()
    expect(screen.queryByLabelText('Foyer')).not.toBeInTheDocument()
  })

  it('liste tous les foyers dans le sélecteur et affiche le premier par défaut', async () => {
    routeFetch({
      '/households/1/shop-items': [200, [item(1, 1, 'Pommes')]],
      '/households': [200, [maison, bureau]],
      '/categories': [200, []],
    })
    renderPage()
    expect(await screen.findByText('Pommes')).toBeInTheDocument()
    const options = Array.from(screen.getByLabelText('Foyer').querySelectorAll('option')).map(
      (o) => o.textContent,
    )
    expect(options).toEqual(['Maison', 'Bureau', '＋ Créer / rejoindre'])
    expect(screen.getByLabelText('Foyer')).toHaveValue('1')
  })

  it("charge les articles du foyer choisi, sans mélanger avec l'autre", async () => {
    const user = userEvent.setup()
    routeFetch({
      '/households/1/shop-items': [200, [item(1, 1, 'Pommes')]],
      '/households/2/shop-items': [200, [item(2, 2, 'Café')]],
      '/households': [200, [maison, bureau]],
      '/categories': [200, []],
    })
    renderPage()
    await screen.findByText('Pommes')
    await user.selectOptions(screen.getByLabelText('Foyer'), 'Bureau')
    expect(await screen.findByText('Café')).toBeInTheDocument()
    expect(screen.queryByText('Pommes')).not.toBeInTheDocument()
  })

  it('mémorise le foyer choisi et le restaure au rechargement', async () => {
    const user = userEvent.setup()
    const routes: Routes = {
      '/households/1/shop-items': [200, [item(1, 1, 'Pommes')]],
      '/households/2/shop-items': [200, [item(2, 2, 'Café')]],
      '/households': [200, [maison, bureau]],
      '/categories': [200, []],
    }
    routeFetch(routes)
    const first = renderPage()
    await screen.findByText('Pommes')
    await user.selectOptions(screen.getByLabelText('Foyer'), 'Bureau')
    await screen.findByText('Café')
    first.unmount()

    renderPage()
    expect(await screen.findByText('Café')).toBeInTheDocument()
    expect(screen.getByLabelText('Foyer')).toHaveValue('2')
  })

  it("retombe sur le premier foyer si celui mémorisé n'existe plus", async () => {
    localStorage.setItem('activeHouseholdId', '99')
    routeFetch({
      '/households/1/shop-items': [200, [item(1, 1, 'Pommes')]],
      '/households': [200, [maison, bureau]],
      '/categories': [200, []],
    })
    renderPage()
    expect(await screen.findByText('Pommes')).toBeInTheDocument()
    expect(screen.getByLabelText('Foyer')).toHaveValue('1')
  })

  it('« Créer / rejoindre » ouvre le formulaire même avec des foyers existants', async () => {
    const user = userEvent.setup()
    routeFetch({
      '/households/1/shop-items': [200, []],
      '/households': [200, [maison]],
      '/categories': [200, []],
    })
    renderPage()
    await user.selectOptions(await screen.findByLabelText('Foyer'), '＋ Créer / rejoindre')
    expect(screen.getByLabelText('Nom du foyer')).toBeInTheDocument()
    expect(screen.getByLabelText("Code d'invitation")).toBeInTheDocument()
  })

  it('rejoint un second foyer par son code et bascule dessus', async () => {
    const user = userEvent.setup()
    let joined = false
    const fetchMock = routeFetch({
      '/households/join': () => {
        joined = true
        return [200, bureau]
      },
      '/households/1/shop-items': [200, []],
      '/households/2/shop-items': [200, [item(2, 2, 'Café')]],
      '/households': () => [200, joined ? [maison, bureau] : [maison]],
      '/categories': [200, []],
    })
    renderPage()
    await user.selectOptions(await screen.findByLabelText('Foyer'), '＋ Créer / rejoindre')
    await user.type(screen.getByLabelText("Code d'invitation"), 'XYZ98765')
    await user.click(screen.getByRole('button', { name: 'Rejoindre' }))

    expect(await screen.findByText('Café')).toBeInTheDocument()
    expect(screen.getByLabelText('Foyer')).toHaveValue('2')
    const join = fetchMock.mock.calls.find(([url]) => String(url).includes('/households/join'))
    expect(JSON.parse(join![1]!.body as string)).toEqual({ invite_code: 'XYZ98765' })
  })

  it('crée un foyer et bascule dessus', async () => {
    const user = userEvent.setup()
    let created = false
    routeFetch({
      '/households/2/shop-items': [200, []],
      '/households': (init) => {
        if (init?.method === 'POST') {
          created = true
          return [201, bureau]
        }
        return [200, created ? [bureau] : []]
      },
      '/categories': [200, []],
    })
    renderPage()
    await user.type(await screen.findByLabelText('Nom du foyer'), 'Bureau')
    await user.click(screen.getByRole('button', { name: 'Créer' }))
    await waitFor(() => expect(screen.getByLabelText('Foyer')).toHaveValue('2'))
    expect(screen.getByText('La liste est vide.')).toBeInTheDocument()
  })

  it("affiche l'erreur du backend quand le foyer est déjà rejoint (409)", async () => {
    const user = userEvent.setup()
    routeFetch({
      '/households/join': [409, { detail: 'Déjà membre de ce foyer' }],
      '/households/1/shop-items': [200, []],
      '/households': [200, [maison]],
      '/categories': [200, []],
    })
    renderPage()
    await user.selectOptions(await screen.findByLabelText('Foyer'), '＋ Créer / rejoindre')
    await user.type(screen.getByLabelText("Code d'invitation"), 'ABC12345')
    await user.click(screen.getByRole('button', { name: 'Rejoindre' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Déjà membre de ce foyer')
  })

  it('quitte uniquement le foyer affiché puis passe au suivant', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('confirm', vi.fn(() => true))
    let left = false
    const fetchMock = routeFetch({
      '/households/1/leave': () => {
        left = true
        return [204, null]
      },
      '/households/1/shop-items': [200, [item(1, 1, 'Pommes')]],
      '/households/2/shop-items': [200, [item(2, 2, 'Café')]],
      '/households': () => [200, left ? [bureau] : [maison, bureau]],
      '/categories': [200, []],
    })
    renderPage()
    await screen.findByText('Pommes')
    await user.click(screen.getByRole('button', { name: 'Quitter le foyer' }))

    expect(await screen.findByText('Café')).toBeInTheDocument()
    expect(calls(fetchMock, 'POST')).toContain('/api/v1/households/1/leave')
    expect(calls(fetchMock, 'POST').some((u) => u.includes('/households/2/leave'))).toBe(false)
  })

  it("ne quitte pas le foyer si l'utilisateur annule la confirmation", async () => {
    const user = userEvent.setup()
    vi.stubGlobal('confirm', vi.fn(() => false))
    const fetchMock = routeFetch({
      '/households/1/shop-items': [200, []],
      '/households': [200, [maison]],
      '/categories': [200, []],
    })
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Quitter le foyer' }))
    expect(calls(fetchMock, 'POST')).toEqual([])
  })

  it("envoie les modifications d'articles vers le foyer actif", async () => {
    const user = userEvent.setup()
    const fetchMock = routeFetch({
      '/households/2/shop-items': [200, [item(2, 2, 'Café', true)]],
      '/households': [200, [maison, bureau]],
      '/categories': [200, []],
    })
    localStorage.setItem('activeHouseholdId', '2')
    renderPage()
    await screen.findByText('Café')

    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Supprimer Café' }))
    await user.click(screen.getByRole('button', { name: 'Vider les articles cochés' }))

    expect(calls(fetchMock, 'PATCH')).toEqual(['/api/v1/households/2/shop-items/2'])
    expect(calls(fetchMock, 'DELETE')).toEqual([
      '/api/v1/households/2/shop-items/2',
      '/api/v1/households/2/shop-items?checked=true',
    ])
  })
})

describe('ShopList – code d’invitation', () => {
  function setup() {
    const user = userEvent.setup()
    routeFetch({
      '/households/1/shop-items': [200, []],
      '/households': [200, [maison]],
      '/categories': [200, []],
    })
    renderPage()
    return user
  }

  it('est masqué par défaut', async () => {
    setup()
    await screen.findByLabelText("Afficher le code d'invitation")
    expect(screen.queryByText('ABC12345')).not.toBeInTheDocument()
    expect(screen.getByText('••••••••')).toBeInTheDocument()
  })

  it('peut être affiché puis re-masqué', async () => {
    const user = setup()
    const toggle = await screen.findByLabelText("Afficher le code d'invitation")
    await user.click(toggle)
    expect(screen.getByText('ABC12345')).toBeInTheDocument()
    await user.click(toggle)
    expect(screen.queryByText('ABC12345')).not.toBeInTheDocument()
  })

  it('se copie sans être affiché et montre un toast', async () => {
    const user = setup()
    await user.click(await screen.findByLabelText('Copier le code'))
    expect(await navigator.clipboard.readText()).toBe('ABC12345')
    expect(screen.getByRole('status')).toHaveTextContent('Code copié')
    expect(screen.queryByText('ABC12345')).not.toBeInTheDocument()
  })

  it('le toast disparaît après quelques secondes', async () => {
    const user = setup()
    await user.click(await screen.findByLabelText('Copier le code'))
    expect(screen.getByRole('status')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument(), {
      timeout: 3000,
    })
  })

  it("affiche le code du foyer sélectionné, pas celui d'un autre", async () => {
    const user = userEvent.setup()
    routeFetch({
      '/households/1/shop-items': [200, []],
      '/households/2/shop-items': [200, []],
      '/households': [200, [maison, bureau]],
      '/categories': [200, []],
    })
    renderPage()
    await user.selectOptions(await screen.findByLabelText('Foyer'), 'Bureau')
    await user.click(await screen.findByLabelText("Afficher le code d'invitation"))
    expect(screen.getByText('XYZ98765')).toBeInTheDocument()
  })
})
