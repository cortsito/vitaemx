import { useEffect, useState } from 'react'

export interface Loaded<T> {
  data: T | null
  error: string | null
  loading: boolean
}

interface Settled<T> {
  key: string
  data: T | null
  error: string | null
}

// Small fetch-on-change hook; `deps` decide when to refetch. "Loading" is
// derived by comparing the deps that produced the last result with the
// current ones, so the effect never has to call setState synchronously.
export function useLoad<T>(load: () => Promise<T>, deps: unknown[]): Loaded<T> {
  const key = JSON.stringify(deps)
  const [settled, setSettled] = useState<Settled<T> | null>(null)

  useEffect(() => {
    let cancelled = false
    load().then(
      (data) => {
        if (!cancelled) setSettled({ key, data, error: null })
      },
      (error: Error) => {
        if (!cancelled) setSettled({ key, data: null, error: error.message })
      },
    )
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  if (settled === null || settled.key !== key) {
    return { data: null, error: null, loading: true }
  }
  return { data: settled.data, error: settled.error, loading: false }
}
