export interface BarcodeProduct {
  name: string
  category: string | null
}

interface OffResponse {
  status: number
  product?: { product_name?: string; brands?: string; categories?: string }
}

// Appel direct à Open Food Facts : volontairement séparé de `client.ts` pour ne
// pas envoyer le token de l'utilisateur à un service tiers.
export async function fetchProductByBarcode(ean: string): Promise<BarcodeProduct | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(ean)}.json?fields=product_name,brands,categories`
  const res = await fetch(url)
  if (res.status === 404) return null
  if (!res.ok) throw new Error('Recherche du produit impossible')
  const data = (await res.json()) as OffResponse
  const name = data.product?.product_name?.trim()
  if (data.status !== 1 || !name) return null
  const brand = data.product?.brands?.split(',')[0]?.trim()
  // `categories` est une liste séparée par des virgules, de la plus générale à la plus précise.
  const category = data.product?.categories?.split(',')[0]?.trim() || null
  return { name: brand ? `${name} (${brand})` : name, category }
}
