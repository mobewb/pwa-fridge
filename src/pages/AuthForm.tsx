import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const { token, login, register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const isLogin = mode === 'login'

  if (token) return <Navigate to="/" replace />

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await (isLogin ? login : register)(email.trim(), password)
      navigate('/', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth">
      <h1>🧊 Fridge</h1>
      <form onSubmit={onSubmit}>
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Mot de passe
          <input
            type="password"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            required
            minLength={isLogin ? undefined : 8}
            maxLength={128}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {!isLogin && <p className="muted small">8 caractères minimum.</p>}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button type="submit" className="primary" disabled={busy}>
          {busy ? '…' : isLogin ? 'Se connecter' : 'Créer mon compte'}
        </button>
      </form>
      <p className="center">
        {isLogin ? (
          <>
            Pas de compte ? <Link to="/register">Créer un compte</Link>
          </>
        ) : (
          <>
            Déjà inscrit ? <Link to="/login">Se connecter</Link>
          </>
        )}
      </p>
    </main>
  )
}
