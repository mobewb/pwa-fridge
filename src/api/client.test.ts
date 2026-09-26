import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, request, setUnauthorizedHandler, tokenStore } from './client'

function mockFetch(status: number, body: unknown) {
  const fn = vi.fn().mockResolvedValue(
    new Response(status === 204 ? null : JSON.stringify(body), { status }),
  )
  vi.stubGlobal('fetch', fn)
  return fn
}

describe('request', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.unstubAllGlobals())

  it('envoie le login en x-www-form-urlencoded', async () => {
    const fetchMock = mockFetch(200, { access_token: 't', token_type: 'bearer' })
    await request('/auth/login', { method: 'POST', form: { username: 'a@b.fr', password: 'x' } })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/v1/auth/login')
    expect(init.headers['Content-Type']).toBe('application/x-www-form-urlencoded')
    expect(String(init.body)).toBe('username=a%40b.fr&password=x')
  })

  it('ajoute le header Bearer quand un token existe', async () => {
    tokenStore.set('abc')
    const fetchMock = mockFetch(200, [])
    await request('/products')
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer abc')
  })

  it('renvoie undefined sur 204', async () => {
    mockFetch(204, null)
    await expect(request('/products/1', { method: 'DELETE' })).resolves.toBeUndefined()
  })

  it('lève ApiError avec le detail du serveur', async () => {
    mockFetch(409, { detail: 'Email déjà utilisé' })
    await expect(request('/auth/register', { method: 'POST', json: {} })).rejects.toMatchObject({
      status: 409,
      message: 'Email déjà utilisé',
    })
  })

  it('appelle le handler 401 seulement si une session existait', async () => {
    const handler = vi.fn()
    setUnauthorizedHandler(handler)

    mockFetch(401, { detail: 'Email ou mot de passe incorrect' })
    await expect(request('/auth/login', { method: 'POST', form: {} })).rejects.toBeInstanceOf(
      ApiError,
    )
    expect(handler).not.toHaveBeenCalled()

    tokenStore.set('expired')
    mockFetch(401, { detail: 'Not authenticated' })
    await expect(request('/products')).rejects.toBeInstanceOf(ApiError)
    expect(handler).toHaveBeenCalledOnce()
  })

  it('traduit une panne réseau', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fail')))
    await expect(request('/products')).rejects.toMatchObject({ status: 0 })
  })
})
