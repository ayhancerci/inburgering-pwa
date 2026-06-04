import { useState } from 'react'
import { Link } from 'react-router-dom'
import { loadContent } from '../../content'
import { Panel, Badge } from '../../components/ui'

export function Curriculum() {
  const { themes } = loadContent()
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">Cursus — LINK 0 → A2</h1>
        <p className="mt-1 text-sm text-slate-500">
          Tap a chapter to see — in English — what it's about, its lessons, and to start its
          exercises.
        </p>
      </div>

      <div className="space-y-2">
        {themes.map((t) => {
          const isOpen = open === t.id
          return (
            <Panel key={t.id} className="overflow-hidden">
              <button
                onClick={() => setOpen(isOpen ? null : t.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-yellow-400 text-sm font-extrabold text-slate-900">
                  {t.number}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-bold text-slate-900">{t.titleNl}</span>
                  <span className="block text-xs text-slate-500">{t.titleEn}</span>
                </span>
                <span className="text-slate-300">{isOpen ? '▾' : '▸'}</span>
              </button>

              {isOpen && (
                <div className="space-y-3 border-t border-slate-100 px-4 py-3">
                  <p className="rounded-lg bg-yellow-50 px-3 py-2 text-sm text-slate-700">
                    💡 {t.tip}
                  </p>
                  <ol className="space-y-2">
                    {t.tasks.map((task) => (
                      <li key={task.n} className="flex gap-2 text-sm">
                        <span className="font-semibold text-slate-400">{task.n}.</span>
                        <span>
                          <span className="font-medium text-slate-800">{task.titleNl}</span>
                          <span className="block text-xs text-slate-500">{task.tip}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {t.deckId && (
                      <Link
                        to={`/flashcards?deck=${t.deckId}`}
                        className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                      >
                        🃏 Woorden oefenen
                      </Link>
                    )}
                    {t.quizId && (
                      <Link
                        to={`/quiz?quiz=${t.quizId}`}
                        className="rounded-xl bg-yellow-400 px-3 py-2 text-xs font-semibold text-slate-900"
                      >
                        ✍️ Quiz
                      </Link>
                    )}
                    {t.page && <Badge>p. {t.page}</Badge>}
                  </div>
                </div>
              )}
            </Panel>
          )
        })}
      </div>
    </div>
  )
}
