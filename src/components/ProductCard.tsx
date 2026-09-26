import { Link } from 'react-router-dom'
import { useDeleteProduct, useUpdateProduct } from '../api/products'
import type { Product } from '../api/types'
import { expiryLabel, expiryLevel } from '../lib/expiry'

export default function ProductCard({ product }: { product: Product }) {
  const update = useUpdateProduct()
  const remove = useDeleteProduct()
  const busy = update.isPending || remove.isPending
  const offline = typeof navigator !== 'undefined' && !navigator.onLine

  function onDelete() {
    if (window.confirm(`Supprimer « ${product.name} » ?`)) remove.mutate(product.id)
  }

  const error = update.error ?? remove.error

  return (
    <li className={`card ${product.consumed ? 'consumed' : expiryLevel(product)}`}>
      <div className="card-main">
        <Link to={`/products/${product.id}`} className="card-title">
          {product.name}
        </Link>
        <span className="muted">
          {product.quantity} {product.unit ?? ''}
          {product.category ? ` · ${product.category}` : ''}
        </span>
        <span className="badge">
          {product.consumed ? 'Consommé' : expiryLabel(product)} ({product.expiry_date})
        </span>
        {error && (
          <span role="alert" className="error small">
            {error.message}
          </span>
        )}
      </div>
      <div className="card-actions">
        <button
          disabled={busy || offline}
          onClick={() =>
            update.mutate({ id: product.id, patch: { consumed: !product.consumed } })
          }
        >
          {product.consumed ? 'Remettre' : '✓ Consommé'}
        </button>
        <button className="danger" disabled={busy || offline} onClick={onDelete}>
          Supprimer
        </button>
      </div>
    </li>
  )
}
