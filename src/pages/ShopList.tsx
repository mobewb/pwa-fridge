import { useState, type FormEvent, type ReactNode } from 'react'
import { useCategories } from '../api/categories'
import {
  useAddShopItem,
  useClearChecked,
  useCreateHousehold,
  useDeleteShopItem,
  useHouseholds,
  useJoinHousehold,
  useLeaveHousehold,
  useShopItems,
  useUpdateShopItem,
} from '../api/shopList'
import BottomNav from '../components/BottomNav'
import { groupByCategory } from '../lib/groupByCategory'
import type { Household } from '../api/types'

function HouseholdSetup({ onDone }: { onDone: (id: number) => void }) {
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
          if (name.trim()) create.mutate(name.trim(), { onSuccess: (h) => onDone(h.id) })
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
          if (code.trim()) join.mutate(code.trim(), { onSuccess: (h) => onDone(h.id) })
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

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

function InviteCode({ code }: { code: string }) {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      code d'invitation : <strong>{visible ? code : '••••••••'}</strong>{' '}
      <button
        className="icon-btn"
        onClick={() => setVisible(!visible)}
        aria-label="Afficher le code d'invitation"
      >
        <Icon>
          {visible ? (
            <>
              <path d="M3 3l18 18" />
              <path d="M10.6 6.1A10.9 10.9 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3.2 3.8M6.5 7.6A17 17 0 0 0 2 12s4 6 10 6c1.5 0 2.8-.4 4-.9" />
            </>
          ) : (
            <>
              <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z" />
              <circle cx="12" cy="12" r="3" />
            </>
          )}
        </Icon>
      </button>{' '}
      <button
        className="icon-btn"
        onClick={copy}
        aria-label="Copier le code"
      >
        <Icon>
          <rect x="9" y="9" width="12" height="12" rx="2" />
          <path d="M5 15V5a2 2 0 0 1 2-2h10" />
        </Icon>
      </button>
      {copied && (
        <div role="status" className="toast">
          Code copié
        </div>
      )}
    </>
  )
}

const ACTIVE_KEY = 'activeHouseholdId'
const NEW_HOUSEHOLD = 'new'

function ShopListBody({ household, onLeft }: { household: Household; onLeft: () => void }) {
  const items = useShopItems(household.id)
  const categories = useCategories()
  const add = useAddShopItem(household.id)
  const update = useUpdateShopItem(household.id)
  const remove = useDeleteShopItem(household.id)
  const clear = useClearChecked(household.id)
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
    <>
      <p className="muted center">
        <InviteCode code={household.invite_code} />
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
              <option value="">Sans catégorie</option>
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
                if (confirm('Quitter ce foyer ?')) leave.mutate(household.id, { onSuccess: onLeft })
              }}
            >
              Quitter le foyer
            </button>
          </div>
</>
  )
}

function readActiveId(): number | null {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY)
    return raw ? Number(raw) : null
  } catch {
    return null
  }
}

export default function ShopList() {
  const households = useHouseholds()
  const [selected, setSelected] = useState<number | typeof NEW_HOUSEHOLD | null>(readActiveId)

  const list = households.data ?? []
  const active =
    selected === NEW_HOUSEHOLD ? undefined : (list.find((h) => h.id === selected) ?? list[0])

  function select(value: string) {
    const next = value === NEW_HOUSEHOLD ? NEW_HOUSEHOLD : Number(value)
    setSelected(next)
    try {
      if (next === NEW_HOUSEHOLD) localStorage.removeItem(ACTIVE_KEY)
      else localStorage.setItem(ACTIVE_KEY, String(next))
    } catch {
      // stockage indisponible : le choix reste valable pour la session
    }
  }

  return (
    <div className="page">
      <header className="topbar">
        <h1>🛒 Courses</h1>
        {list.length > 0 && (
          <select
            value={active ? active.id : NEW_HOUSEHOLD}
            onChange={(e) => select(e.target.value)}
            aria-label="Foyer"
          >
            {list.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
            <option value={NEW_HOUSEHOLD}>＋ Créer / rejoindre</option>
          </select>
        )}
      </header>

      {households.isPending && <p className="center muted">Chargement…</p>}
      {households.isError && (
        <p role="alert" className="error center">
          {households.error.message}
        </p>
      )}
      {households.isSuccess && !active && (
        <HouseholdSetup onDone={(id) => select(String(id))} />
      )}
      {active && (
        <ShopListBody key={active.id} household={active} onLeft={() => setSelected(null)} />
      )}
      <BottomNav />
    </div>
  )
}
