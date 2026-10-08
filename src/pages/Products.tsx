import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCategories } from '../api/categories'
import { EXPIRING_DAYS, useExpiringProducts, useProducts } from '../api/products'
import { useAuth } from '../auth/AuthContext'
import ProductCard from '../components/ProductCard'

type Tab = 'expiring' | 'all'
type Status = 'active' | 'consumed' | 'any'

export default function Products() {
  const { user, logout } = useAuth()
  const [tab, setTab] = useState<Tab>('expiring')
  const [status, setStatus] = useState<Status>('active')
  const [category, setCategory] = useState('')
  const categories = useCategories()

  const expiring = useExpiringProducts()
  const all = useProducts({
    consumed: status === 'any' ? undefined : status === 'consumed',
    category: category.trim() || undefined,
  })
  const query = tab === 'expiring' ? expiring : all
  const products = query.data ?? []

  return (
    <div className="page">
      <header className="topbar">
        <h1>🧊 Fridge</h1>
        <button onClick={logout} title={user?.email}>
          Déconnexion
        </button>
      </header>

      <nav className="tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === 'expiring'}
          onClick={() => setTab('expiring')}
        >
          Bientôt périmés
        </button>
        <button role="tab" aria-selected={tab === 'all'} onClick={() => setTab('all')}>
          Tous
        </button>
      </nav>

      {tab === 'all' && (
        <div className="filters">
          <select value={status} onChange={(e) => setStatus(e.target.value as Status)}>
            <option value="active">À consommer</option>
            <option value="consumed">Consommés</option>
            <option value="any">Tous</option>
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Toutes les catégories</option>
            {categories.data?.map((c) => (
              <option key={c.id} value={c.name}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {query.isPending && <p className="center muted">Chargement…</p>}
      {query.isError && (
        <p role="alert" className="error center">
          {query.error.message}
        </p>
      )}
      {query.isSuccess && products.length === 0 && (
        <p className="center muted">
          {tab === 'expiring'
            ? `Rien n'expire dans les ${EXPIRING_DAYS} prochains jours 🎉`
            : 'Aucun produit.'}
        </p>
      )}

      <ul className="list">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ul>

      <Link to="/products/new" className="fab" aria-label="Ajouter un produit">
        +
      </Link>
    </div>
  )
}
