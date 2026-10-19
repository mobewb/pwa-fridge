import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useClearChecked, useHousehold } from './shopList'

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client }, children)
}

function mockFetch(status: number, body: unknown) {
  const fn = vi.fn().mockResolvedValue(
    new Response(status === 204 ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
  vi.stubGlobal('fetch', fn)
  return fn
}

beforeEach(() => localStorage.clear())
afterEach(() => vi.unstubAllGlobals())

describe('shopList api', () => {
  it("renvoie null quand l'utilisateur n'a pas de foyer (404)", async () => {
    mockFetch(404, { detail: 'Not found' })
    const { result } = renderHook(() => useHousehold(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
  })

  it('vide les articles cochés via DELETE ?checked=true', async () => {
    const fetchMock = mockFetch(204, null)
    const { result } = renderHook(() => useClearChecked(), { wrapper })
    result.current.mutate()
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toContain('/shop-items?checked=true')
    expect(init.method).toBe('DELETE')
  })
})
