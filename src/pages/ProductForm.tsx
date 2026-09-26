import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCreateProduct, useProduct, useUpdateProduct } from '../api/products'
import type { Product, ProductInput } from '../api/types'

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

  const mutation = product ? update : create

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
      <form onSubmit={onSubmit}>
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
          <input type="date" required value={expiry} onChange={(e) => setExpiry(e.target.value)} />
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
