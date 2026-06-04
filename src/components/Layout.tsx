import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { useActiveProfile } from '../store/profile'
import { cx } from './ui'
import { Guide } from '../features/help/Guide'

const NAV = [
  { to: '/', label: 'Plan', icon: '🗓️' },
  { to: '/flashcards', label: 'Kaarten', icon: '🃏' },
  { to: '/quiz', label: 'Oefenen', icon: '✍️' },
  { to: '/checklist', label: 'Checklist', icon: '✅' },
]

const INTRO_KEY = 'intro-seen-v1'

export function Layout() {
  const profiles = useLiveQuery(() => db.profiles.toArray(), [], [])
  const { activeId, setActive } = useActiveProfile()
  const [guideOpen, setGuideOpen] = useState(false)

  // Auto-open the English how-to on first run.
  useEffect(() => {
    if (!localStorage.getItem(INTRO_KEY)) setGuideOpen(true)
  }, [])

  const closeGuide = () => {
    localStorage.setItem(INTRO_KEY, '1')
    setGuideOpen(false)
  }

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col">
      <header className="safe-top sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-yellow-500/30 bg-yellow-400/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="text-base font-extrabold tracking-tight text-slate-900">
            Inburgering B1
          </span>
          <button
            onClick={() => setGuideOpen(true)}
            aria-label="How to use this app"
            className="grid size-6 place-items-center rounded-full bg-white/70 text-sm font-bold text-slate-800 transition hover:bg-white"
          >
            ?
          </button>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-white/70 p-1 text-xs font-semibold">
          {(profiles ?? []).map((p) => (
            <button
              key={p.id}
              onClick={() => setActive(p.id)}
              className={cx(
                'rounded-full px-3 py-1 transition',
                activeId === p.id ? 'bg-slate-900 text-white' : 'text-slate-700',
              )}
            >
              {p.displayName}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 px-4 py-4 pb-24">
        <Outlet />
      </main>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-2xl justify-around border-t border-slate-200 bg-white/95 backdrop-blur">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === '/'}
            className={({ isActive }) =>
              cx(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-semibold transition',
                isActive ? 'text-slate-900' : 'text-slate-400',
              )
            }
          >
            <span className="text-xl">{n.icon}</span>
            {n.label}
          </NavLink>
        ))}
      </nav>

      <Guide open={guideOpen} onClose={closeGuide} />
    </div>
  )
}
