import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/database'
import { useActiveProfile } from '../../store/profile'
import { buildQueue } from '../../srs/queue'
import type { QueueItem } from '../../srs/queue'
import { rateCard } from '../../db/repo'
import { Rating } from '../../srs/scheduler'
import type { Grade } from '../../srs/scheduler'
import { Panel, Button, ProgressBar, cx } from '../../components/ui'
import { SpeakButton } from '../../components/SpeakButton'

type Phase = 'select' | 'review' | 'done'

const RATINGS: { grade: Grade; label: string; cls: string }[] = [
  { grade: Rating.Again, label: 'Opnieuw', cls: 'bg-rose-500 hover:bg-rose-600' },
  { grade: Rating.Hard, label: 'Moeilijk', cls: 'bg-orange-400 hover:bg-orange-500' },
  { grade: Rating.Good, label: 'Goed', cls: 'bg-emerald-500 hover:bg-emerald-600' },
  { grade: Rating.Easy, label: 'Makkelijk', cls: 'bg-sky-500 hover:bg-sky-600' },
]

export function Flashcards() {
  const { activeId } = useActiveProfile()
  const decks = useLiveQuery(async () => {
    const ds = await db.decks.toArray()
    return Promise.all(
      ds.map(async (d) => ({ ...d, count: await db.cards.where('deckId').equals(d.id).count() })),
    )
  }, [])

  const [phase, setPhase] = useState<Phase>('select')
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [idx, setIdx] = useState(0)
  const [showBack, setShowBack] = useState(false)
  const [reviewed, setReviewed] = useState(0)

  const start = useCallback(
    async (deckId?: string) => {
      const q = await buildQueue(activeId, { deckId })
      setQueue(q)
      setIdx(0)
      setShowBack(false)
      setReviewed(0)
      setPhase(q.length ? 'review' : 'done')
    },
    [activeId],
  )

  // Deep link: /flashcards?deck=<id> auto-starts that deck.
  const [searchParams, setSearchParams] = useSearchParams()
  useEffect(() => {
    const deckId = searchParams.get('deck')
    if (deckId) {
      setSearchParams({}, { replace: true })
      void start(deckId)
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const current = queue[idx]

  const rate = async (grade: Grade) => {
    if (!current) return
    await rateCard(activeId, current.card, current.state?.fsrs, grade)
    setReviewed((n) => n + 1)
    const next = idx + 1
    if (next >= queue.length) {
      setPhase('done')
    } else {
      setIdx(next)
      setShowBack(false)
    }
  }

  if (phase === 'select') {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-extrabold text-slate-900">Flashcards</h1>
        <Button className="w-full" onClick={() => start()}>
          ▶ Alles wat vandaag moet
        </Button>
        <Panel className="divide-y divide-slate-100">
          {(decks ?? []).map((d) => (
            <button
              key={d.id}
              onClick={() => start(d.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50"
            >
              <span>
                <span className="block text-sm font-semibold text-slate-800">{d.title}</span>
                <span className="text-xs text-slate-400">
                  {d.type === 'knm' ? 'KNM' : 'Woorden'} · {d.count} kaarten
                </span>
              </span>
              <span className="text-slate-300">›</span>
            </button>
          ))}
          {(decks ?? []).length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-slate-400">Nog geen kaarten.</p>
          )}
        </Panel>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div className="space-y-4 pt-10 text-center">
        <p className="text-5xl">🎉</p>
        <h1 className="text-xl font-extrabold text-slate-900">Klaar!</h1>
        <p className="text-sm text-slate-500">
          {reviewed} {reviewed === 1 ? 'kaart' : 'kaarten'} herhaald. Goed bezig.
        </p>
        <Button className="w-full" onClick={() => setPhase('select')}>
          Terug naar de kaarten
        </Button>
      </div>
    )
  }

  // review
  const progress = queue.length ? (idx / queue.length) * 100 : 0
  return (
    <div className="flex min-h-[60vh] flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setPhase('select')} className="text-sm text-slate-400">
          ✕
        </button>
        <div className="flex-1">
          <ProgressBar value={progress} />
        </div>
        <span className="text-xs font-semibold text-slate-400">
          {idx + 1}/{queue.length}
        </span>
      </div>

      <Panel className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex items-center justify-center gap-3">
          <p className="text-2xl font-bold text-slate-900">{current?.card.front}</p>
          {current && <SpeakButton text={current.card.front} />}
        </div>
        {showBack && (
          <>
            <hr className="w-12 border-slate-200" />
            <p className="text-xl text-slate-700">{current?.card.back}</p>
            {current?.card.examples?.map((ex, i) => (
              <p key={i} className="text-sm italic text-slate-400">
                {ex}
              </p>
            ))}
          </>
        )}
        {!showBack && current?.card.hints?.length ? (
          <p className="text-xs text-slate-300">{current.card.hints.join(' · ')}</p>
        ) : null}
      </Panel>

      {!showBack ? (
        <Button className="w-full" onClick={() => setShowBack(true)}>
          Toon antwoord
        </Button>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {RATINGS.map((r) => (
            <button
              key={r.grade}
              onClick={() => rate(r.grade)}
              className={cx('rounded-xl py-3 text-xs font-bold text-white transition', r.cls)}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
