import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { request, setUnauthorizedHandler, tokenStore } from '../api/client'
import type { Token, User } from '../api/types'

interface AuthState {
  token: string | null
  user: User | null
  /** true tant que /auth/me n'a pas confirmé la session au démarrage */
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState<string | null>(() => tokenStore.get())
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(() => tokenStore.get() !== null)

  const logout = useCallback(() => {
    tokenStore.clear()
    setToken(null)
    setUser(null)
    queryClient.clear()
  }, [queryClient])

  useEffect(() => {
    setUnauthorizedHandler(logout)
  }, [logout])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    request<User>('/auth/me')
      .then((me) => {
        if (!cancelled) setUser(me)
      })
      .catch(() => {
        // 401 → logout déjà déclenché. Hors-ligne : on garde la session, le cache reste lisible.
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const login = useCallback(async (email: string, password: string) => {
    const data = await request<Token>('/auth/login', {
      method: 'POST',
      form: { username: email, password },
    })
    tokenStore.set(data.access_token)
    setLoading(true)
    setToken(data.access_token)
  }, [])

  const register = useCallback(
    async (email: string, password: string) => {
      await request<User>('/auth/register', { method: 'POST', json: { email, password } })
      await login(email, password)
    },
    [login],
  )

  const value = useMemo(
    () => ({ token, user, loading, login, register, logout }),
    [token, user, loading, login, register, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>')
  return ctx
}
