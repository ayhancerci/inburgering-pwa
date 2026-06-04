import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { loadContent } from '../../content'
import { db } from '../../db/database'
import { useActiveProfile } from '../../store/profile'
import { setExamDate } from '../../db/repo'
import { Panel, Badge, ProgressBar } from '../../components/ui'
import { Mock } from './Mock'

export function Examens() {
  const { exams } = loadContent()
  const { activeId } = useActiveProfile()
  const dates = useLiveQuery(
    () => db.examDates.where('profileId').equals(activeId).toArray(),
    [activeId],
    [],
  )
  const dateMap = new Map((dates ?? []).map((d) => [d.component, d.date]))
  const attempts = useLiveQuery(
    () => db.quizAttempts.where('profileId').equals(activeId).toArray(),
    [activeId],
    [],
  )
  const bestByQuiz = new Map<string, number>()
  for (const a of attempts ?? []) {
    if (a.quizId) {
      bestByQuiz.set(a.quizId, Math.max(bestByQuiz.get(a.quizId) ?? 0, Math.round(a.scorePct)))
    }
  }
  const [mock, setMock] = useState<{ quizId: string; durationMin: number; title: string } | null>(
    null,
  )
  const [params, setParams] = useSearchParams()

  // Deep-link: /examens?mock=<examId> starts that practice exam straight away (from the dashboard).
  useEffect(() => {
    const id = params.get('mock')
    if (!id) return
    const ex = exams.find((e) => e.id === id && e.mockQuizId)
    if (ex)
      setMock({
        quizId: ex.mockQuizId!,
        durationMin: ex.durationMin,
        title: `${ex.titleNl} — oefenexamen`,
      })
  }, [params, exams])

  if (mock) {
    return (
      <Mock
        quizId={mock.quizId}
        durationMin={mock.durationMin}
        title={mock.title}
        onExit={() => {
          setMock(null)
          if (params.get('mock')) setParams({}, { replace: true })
        }}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">Examens</h1>
        <p className="mt-1 text-sm text-slate-500">
          Set a date for each exam (you can pick a different one per exam), open the free official
          practice, or do an in-app timed practice exam.
        </p>
      </div>

      {exams.map((ex) => {
        const mid = ex.mockQuizId
        return (
          <Panel key={ex.id} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-slate-900">
                  {ex.titleNl}{' '}
                  <span className="text-sm font-normal text-slate-400">— {ex.titleEn}</span>
                </p>
                {ex.info && <p className="mt-0.5 text-xs text-slate-500">{ex.info}</p>}
              </div>
              <Badge>{ex.durationMin} min</Badge>
            </div>

            <label className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
              <span className="text-sm font-semibold text-slate-700">📅 Mijn examendatum</span>
              <input
                type="date"
                value={dateMap.get(ex.id) ?? ''}
                onChange={(e) => setExamDate(activeId, ex.id, e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm"
              />
            </label>

            {mid && bestByQuiz.has(mid) && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Beste oefenscore</span>
                  <span>
                    {bestByQuiz.get(mid)}% {(bestByQuiz.get(mid) ?? 0) >= 60 ? '· klaar ✓' : ''}
                  </span>
                </div>
                <ProgressBar value={bestByQuiz.get(mid) ?? 0} />
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <a
                href={ex.officialUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
              >
                Gratis officieel oefenexamen ↗
              </a>
              {mid && (
                <button
                  onClick={() =>
                    setMock({
                      quizId: mid,
                      durationMin: ex.durationMin,
                      title: `${ex.titleNl} — oefenexamen`,
                    })
                  }
                  className="rounded-xl bg-yellow-400 px-3 py-2 text-xs font-semibold text-slate-900"
                >
                  ▶ Oefen in de app (met timer)
                </button>
              )}
              {ex.id === 'schrijven' && (
                <Link
                  to="/schrijven"
                  className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"
                >
                  ✨ AI Schrijftutor
                </Link>
              )}
            </div>
          </Panel>
        )
      })}

      <p className="px-1 text-center text-xs text-slate-400">
        The official practice exams (with real audio for Listening) are the most realistic — use
        those too. In-app timed practice is available for KNM and Reading.
      </p>
    </div>
  )
}
