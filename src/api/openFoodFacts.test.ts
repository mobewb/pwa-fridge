import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchProductByBarcode } from './openFoodFacts'

function mockFetch(body: unknown, status = 200) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })))
}

afterEach(() => vi.unstubAllGlobals())

describe('fetchProductByBarcode', () => {
  it('retourne nom, marque et catégorie', async () => {
    mockFetch({
      status: 1,
      product: { product_name: 'Yaourt nature', brands: 'Danone,Autre', categories: 'Produits laitiers, Yaourts' },
    })
    expect(await fetchProductByBarcode('123')).toEqual({
      name: 'Yaourt nature (Danone)',
      category: 'Produits laitiers',
    })
  })

  it('retourne null si le produit est inconnu', async () => {
    mockFetch({ status: 0 }, 404)
    expect(await fetchProductByBarcode('000')).toBeNull()
  })

  it('lève une erreur si le service est indisponible', async () => {
    mockFetch({}, 500)
    await expect(fetchProductByBarcode('123')).rejects.toThrow()
  })
})
