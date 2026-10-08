import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useCategories } from '../api/categories'
import {
  useAddShopItem,
  useClearChecked,
  useCreateHousehold,
  useDeleteShopItem,
  useHousehold,
  useJoinHousehold,
  useLeaveHousehold,
  useShopItems,
  useUpdateShopItem,
} from '../api/shopList'
import { groupByCategory } from '../lib/groupByCategory'

function HouseholdSetup() {
  const create = useCreateHousehold()
  const join = useJoinHousehold()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const error = create.error ?? join.error

  return (
    <>
      <p className="center muted">Crée un foyer ou rejoins-en un pour partager la liste.</p>
      <form
        className="shop-form"
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          if (name.trim()) create.mutate(name.trim())
        }}
      >
        <input
          placeholder="Nom du foyer"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Nom du foyer"
        />
        <button type="submit">Créer</button>
      </form>
      <form
        className="shop-form"
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          if (code.trim()) join.mutate(code.trim())
        }}
      >
        <input
          placeholder="Code d'invitation"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          aria-label="Code d'invitation"
        />
        <button type="submit">Rejoindre</button>
      </form>
      {error && (
        <p role="alert" className="error center">
          {error.message}
        </p>
      )}
    </>
  )
}

export default function ShopList() {
  const household = useHousehold()
  const hasHousehold = !!household.data
  const items = useShopItems(hasHousehold)
  const categories = useCategories()
  const add = useAddShopItem()
  const update = useUpdateShopItem()
  const remove = useDeleteShopItem()
  const clear = useClearChecked()
  const leave = useLeaveHousehold()
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [category, setCategory] = useState('')

  const groups = groupByCategory(items.data ?? [], categories.data ?? [])
  const hasChecked = (items.data ?? []).some((i) => i.checked)

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    add.mutate(
      { name: name.trim(), quantity: quantity.trim() || '1', category: category || null },
      { onSuccess: () => setName('') },
    )
  }

  return (
    <div className="page">
      <header className="topbar">
        <h1>🛒 Courses</h1>
        <Link to="/">Frigo</Link>
      </header>

      {household.isPending && <p className="center muted">Chargement…</p>}
      {household.isError && (
        <p role="alert" className="error center">
          {household.error.message}
        </p>
      )}
      {household.isSuccess && !household.data && <HouseholdSetup />}

      {household.data && (
        <>
          <p className="muted center">
            {household.data.name} · code d'invitation : <strong>{household.data.invite_code}</strong>
          </p>

          <form className="shop-form" onSubmit={submit}>
            <input
              placeholder="Article"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Article"
            />
            <input
              className="shop-qty"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              aria-label="Quantité"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Catégorie"
            >
              <option value="">Autres</option>
              {categories.data?.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
            <button type="submit">Ajouter</button>
          </form>
          {add.isError && (
            <p role="alert" className="error center">
              {add.error.message}
            </p>
          )}

          {items.isError && (
            <p role="alert" className="error center">
              {items.error.message}
            </p>
          )}
          {items.isSuccess && groups.length === 0 && (
            <p className="center muted">La liste est vide.</p>
          )}

          {groups.map((group) => (
            <section key={group.name} className="shop-group">
              <h2>
                {group.emoji} {group.name}
              </h2>
              <ul className="list">
                {group.items.map((item) => (
                  <li key={item.id} className={`shop-item${item.checked ? ' checked' : ''}`}>
                    <label>
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() =>
                          update.mutate({ id: item.id, patch: { checked: !item.checked } })
                        }
                      />
                      <span>{item.name}</span>
                      <span className="muted"> × {item.quantity}</span>
                    </label>
                    <button
                      onClick={() => remove.mutate(item.id)}
                      aria-label={`Supprimer ${item.name}`}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <div className="shop-actions">
            {hasChecked && (
              <button onClick={() => clear.mutate()}>Vider les articles cochés</button>
            )}
            <button
              onClick={() => {
                if (confirm('Quitter ce foyer ?')) leave.mutate()
              }}
            >
              Quitter le foyer
            </button>
          </div>
        </>
      )}
    </div>
  )
}
