import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCreateProduct, useProduct, useUpdateProduct } from '../api/products'
import { fetchProductByBarcode } from '../api/openFoodFacts'
import type { Product, ProductInput } from '../api/types'
import BarcodeScanner from '../components/BarcodeScanner'

function Form({ product }: { product?: Product }) {
  const navigate = useNavigate()
  const create = useCreateProduct()
  const update = useUpdateProduct()
  const [name, setName] = useState(product?.name ?? '')
  const [quantity, setQuantity] = useState(String(product?.quantity ?? 1))
  const [unit, setUnit] = useState(product?.unit ?? '')
  const [category, setCategory] = useState(product?.category ?? '')
  const [expiry, setExpiry] = useState(product?.expiry_date ?? '')
  const [notes, setNotes] = useState(product?.notes ?? '')

  const [scanning, setScanning] = useState(false)
  const [scanStatus, setScanStatus] = useState<string | null>(null)
  const expiryRef = useRef<HTMLInputElement>(null)

  const mutation = product ? update : create

  async function onBarcode(ean: string) {
    setScanning(false)
    setScanStatus('Recherche du produit…')
    try {
      const found = await fetchProductByBarcode(ean)
      if (!found) {
        setScanStatus('Produit introuvable, saisissez-le à la main.')
        return
      }
      setName(found.name.slice(0, 200))
      if (found.category) setCategory(found.category.slice(0, 100))
      setScanStatus(null)
      expiryRef.current?.focus()
    } catch (e) {
      setScanStatus(e instanceof Error ? e.message : 'Recherche du produit impossible')
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const input: ProductInput = {
      name: name.trim(),
      quantity: Number(quantity),
      // Le PATCH ignore null pour les champs requis mais accepte null pour les optionnels.
      unit: unit.trim() || null,
      category: category.trim() || null,
      expiry_date: expiry,
      notes: notes.trim() || null,
    }
    const done = { onSuccess: () => navigate('/', { replace: true }) }
    if (product) update.mutate({ id: product.id, patch: input }, done)
    else create.mutate(input, done)
  }

  return (
    <div className="page">
      <header className="topbar">
        <h1>{product ? 'Modifier' : 'Nouveau produit'}</h1>
        <Link to="/">Annuler</Link>
      </header>
      {scanning && <BarcodeScanner onDetect={onBarcode} onClose={() => setScanning(false)} />}
      <form onSubmit={onSubmit}>
        {!product && (
          <>
            <button type="button" onClick={() => setScanning(true)}>
              Scanner un code-barres
            </button>
            {scanStatus && <p role="status" className="muted">{scanStatus}</p>}
          </>
        )}
        <label>
          Nom
          <input required maxLength={200} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="row">
          <label>
            Quantité
            <input
              type="number"
              inputMode="decimal"
              required
              min="0.01"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </label>
          <label>
            Unité
            <input
              maxLength={50}
              placeholder="kg, L, pièces…"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </label>
        </div>
        <label>
          Catégorie
          <input maxLength={100} value={category} onChange={(e) => setCategory(e.target.value)} />
        </label>
        <label>
          Date de péremption
          <input ref={expiryRef} type="date" required value={expiry} onChange={(e) => setExpiry(e.target.value)} />
        </label>
        <label>
          Notes
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        {mutation.error && (
          <p role="alert" className="error">
            {mutation.error.message}
          </p>
        )}
        <button type="submit" className="primary" disabled={mutation.isPending}>
          {mutation.isPending ? '…' : 'Enregistrer'}
        </button>
      </form>
    </div>
  )
}

function EditProduct({ id }: { id: number }) {
  const { data, isPending, isError, error } = useProduct(id)
  if (isPending) return <p className="center muted">Chargement…</p>
  if (isError) return <p role="alert" className="error center">{error.message}</p>
  return <Form product={data} />
}

export default function ProductForm() {
  const { id } = useParams()
  return id ? <EditProduct id={Number(id)} /> : <Form />
}
