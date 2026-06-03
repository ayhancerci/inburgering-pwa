import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { seed } from '../db/seed'

/** Seeds the local database once, then renders the app. */
export function Boot({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    seed()
      .then(() => setReady(true))
      .catch((e) => {
        console.error('[seed] failed', e)
        setError(e instanceof Error ? e.message : String(e))
        setReady(true)
      })
  }, [])

  if (!ready) {
    return <div className="flex h-full items-center justify-center text-slate-400">Laden…</div>
  }
  if (error) {
    return (
      <div className="m-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
        Kon de app niet laden: {error}
      </div>
    )
  }
  return <>{children}</>
}
