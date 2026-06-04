import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/database'
import { loadContent } from '../../content'
import { useActiveProfile } from '../../store/profile'
import { setPlanTask } from '../../db/repo'
import { dueCount } from '../../srs/queue'
import { Panel, ProgressBar, Badge, cx } from '../../components/ui'
import type { PlanWeek, PlanTask } from '../../content/schemas'
import { currentStreak } from '../../lib/stats'

function localISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function daysFromTodayTo(iso: string): number {
  const start = new Date(localISODate(new Date()) + 'T00:00:00')
  const end = new Date(iso + 'T00:00:00')
  return Math.round((end.getTime() - start.getTime()) / 86_400_000)
}

function currentWeekNumber(startDate: string, weeks: PlanWeek[]): number {
  if (weeks.length === 0) return 1
  const start = new Date(startDate + 'T00:00:00')
  const wk = Math.floor((Date.now() - start.getTime()) / (7 * 86_400_000)) + 1
  const max = Math.max(...weeks.map((w) => w.weekNumber))
  return Math.min(Math.max(wk, 1), max)
}

const KIND_ICON: Record<PlanTask['kind'], string> = {
  book: '📖',
  flashcards: '🃏',
  quiz: '✍️',
  mock: '⏱️',
  duo_link: '🔗',
  knm: '🇳🇱',
  admin: '🏛️',
  speaking: '🗣️',
  listening: '🎧',
  writing: '📝',
  review: '♻️',
}

function taskLink(t: PlanTask): string | null {
  switch (t.kind) {
    case 'flashcards':
      return t.ref ? `/flashcards?deck=${t.ref}` : '/flashcards'
    case 'quiz':
      return t.ref ? `/quiz?quiz=${t.ref}` : '/quiz'
    case 'review':
      return '/quiz'
    case 'knm':
      return '/flashcards'
    case 'mock':
    case 'listening':
      return '/examens'
    case 'speaking':
      return '/gesprekken'
    case 'book':
      return '/cursus'
    default:
      return null
  }
}

export function Dashboard() {
  const { planMeta, exams } = loadContent()
  const { activeId } = useActiveProfile()

  const weeks = useLiveQuery(() => db.planWeeks.orderBy('weekNumber').toArray(), [], [] as PlanWeek[])
  const progressRows = useLiveQuery(
    () => db.planProgress.where('profileId').equals(activeId).toArray(),
    [activeId],
    [],
  )
  const due = useLiveQuery(() => dueCount(activeId), [activeId], 0)
  const examDates = useLiveQuery(
    () => db.examDates.where('profileId').equals(activeId).toArray(),
    [activeId],
    [],
  )
  const reviewLogs = useLiveQuery(
    () => db.reviewLogs.where('profileId').equals(activeId).toArray(),
    [activeId],
    [],
  )
  const attempts = useLiveQuery(
    () => db.quizAttempts.where('profileId').equals(activeId).toArray(),
    [activeId],
    [],
  )

  const doneSet = useMemo(
    () => new Set((progressRows ?? []).filter((r) => r.status === 'done').map((r) => r.taskId)),
    [progressRows],
  )

  const weekNo = currentWeekNumber(planMeta.startDate, weeks)
  const week = weeks.find((w) => w.weekNumber === weekNo)
  const weekTasks = week?.tasks ?? []
  const weekDone = weekTasks.filter((t) => doneSet.has(t.id)).length
  const weekPct = weekTasks.length ? (weekDone / weekTasks.length) * 100 : 0

  const allTasks = weeks.flatMap((w) => w.tasks)
  const overallPct = allTasks.length
    ? (allTasks.filter((t) => doneSet.has(t.id)).length / allTasks.length) * 100
    : 0

  // Next upcoming exam from the user's own per-exam dates.
  const todayISO = localISODate(new Date())
  const nextExam = useMemo(() => {
    const upcoming = (examDates ?? [])
      .filter((d) => d.date && d.date >= todayISO)
      .sort((a, b) => a.date.localeCompare(b.date))
    return upcoming[0] ?? null
  }, [examDates, todayISO])
  const nextExamTitle = nextExam ? exams.find((e) => e.id === nextExam.component)?.titleNl : null
  const nextExamDays = nextExam ? daysFromTodayTo(nextExam.date) : null

  const DAILY_GOAL = 20
  const reviewedToday = useMemo(
    () => (reviewLogs ?? []).filter((r) => localISODate(new Date(r.reviewedAt)) === todayISO).length,
    [reviewLogs, todayISO],
  )
  const streak = useMemo(() => {
    const dates = new Set<string>()
    for (const r of reviewLogs ?? []) dates.add(localISODate(new Date(r.reviewedAt)))
    for (const a of attempts ?? []) if (a.finishedAt) dates.add(localISODate(new Date(a.finishedAt)))
    return currentStreak(dates)
  }, [reviewLogs, attempts])

  // In-app practice exams (KNM, Reading, Listening) and your best score so far.
  const mockExams = exams.filter((e) => e.mockQuizId)
  const bestByMock = useMemo(() => {
    const m = new Map<string, number>()
    for (const a of attempts ?? [])
      if (a.quizId) m.set(a.quizId, Math.max(m.get(a.quizId) ?? 0, Math.round(a.scorePct)))
    return m
  }, [attempts])

  return (
    <div className="space-y-4">
      <Panel className="overflow-hidden">
        <div className="bg-yellow-400 px-5 py-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Week {weekNo}</p>
              <h1 className="text-xl font-extrabold text-slate-900">{week?.theme ?? 'Studieplan'}</h1>
              {week?.dateLabel && <p className="text-xs font-medium text-slate-700">{week.dateLabel}</p>}
            </div>
            <Link to="/examens" className="shrink-0 text-right">
              {nextExamDays != null ? (
                <>
                  <p className="text-3xl font-black leading-none text-slate-900">{nextExamDays}</p>
                  <p className="text-[10px] font-bold uppercase text-slate-700">
                    dagen — {nextExamTitle}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-extrabold text-slate-900">📅 Examens</p>
                  <p className="text-[10px] font-bold uppercase text-slate-700">stel data in →</p>
                </>
              )}
            </Link>
          </div>
        </div>
        <div className="space-y-1 px-5 py-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Deze week</span>
            <span>
              {weekDone}/{weekTasks.length}
            </span>
          </div>
          <ProgressBar value={weekPct} />
          <div className="flex items-center justify-between pt-2 text-xs font-semibold text-slate-500">
            <span>Hele plan</span>
            <span>{Math.round(overallPct)}%</span>
          </div>
          <ProgressBar value={overallPct} />
        </div>
      </Panel>

      <Panel className="space-y-3 p-4 ring-1 ring-yellow-200">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-bold text-slate-900">🎓 Jouw examen</h2>
          <Link to="/examens" className="text-xs font-semibold text-sky-600">
            Alle examens &amp; data →
          </Link>
        </div>
        {nextExamDays != null ? (
          <p className="text-sm text-slate-700">
            Nog <span className="text-lg font-black text-slate-900">{nextExamDays}</span> dagen tot
            je <span className="font-semibold">{nextExamTitle}</span>-examen.
          </p>
        ) : (
          <p className="text-sm text-slate-500">
            Nog geen datum ingesteld.{' '}
            <Link to="/examens" className="font-semibold text-sky-600">
              Stel je examendata in →
            </Link>
          </p>
        )}
        <div>
          <p className="mb-1.5 text-xs font-semibold text-slate-500">Oefenexamen (met timer)</p>
          <div className="flex flex-wrap gap-2">
            {mockExams.map((ex) => {
              const best = ex.mockQuizId ? bestByMock.get(ex.mockQuizId) : undefined
              return (
                <Link
                  key={ex.id}
                  to={`/examens?mock=${ex.id}`}
                  className="rounded-xl bg-yellow-400 px-3 py-2 text-xs font-semibold text-slate-900"
                >
                  ▶ {ex.titleNl}
                  {best != null ? ` · ${best}%` : ''}
                </Link>
              )
            })}
          </div>
        </div>
      </Panel>

      <Link to="/schrijven">
        <Panel className="flex items-center gap-3 p-4 ring-1 ring-indigo-100">
          <span className="text-2xl">✍️</span>
          <span className="flex-1">
            <span className="block font-bold text-slate-900">AI Schrijftutor</span>
            <span className="block text-xs text-slate-500">Laat je Nederlandse tekst nakijken (A2)</span>
          </span>
          <span className="text-slate-300">›</span>
        </Panel>
      </Link>

      <Panel className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          <div>
            <p className="text-sm font-bold text-slate-900">
              {streak} {streak === 1 ? 'dag' : 'dagen'} op rij
            </p>
            <p className="text-xs text-slate-500">
              Vandaag: {reviewedToday}/{DAILY_GOAL} kaarten
            </p>
          </div>
        </div>
        <div className="w-24 shrink-0">
          <ProgressBar value={(reviewedToday / DAILY_GOAL) * 100} />
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/flashcards">
          <Panel className="flex h-full flex-col justify-between gap-3 p-4">
            <span className="text-2xl">🃏</span>
            <div>
              <p className="font-bold text-slate-900">Kaarten</p>
              <p className="text-xs text-slate-500">{due} te herhalen</p>
            </div>
          </Panel>
        </Link>
        <Link to="/examens">
          <Panel className="flex h-full flex-col justify-between gap-3 p-4">
            <span className="text-2xl">⏱️</span>
            <div>
              <p className="font-bold text-slate-900">Examens</p>
              <p className="text-xs text-slate-500">Data + oefenexamens</p>
            </div>
          </Panel>
        </Link>
      </div>

      <Panel className="divide-y divide-slate-100">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="font-bold text-slate-900">Taken — week {weekNo}</h2>
          <Badge tone={weekTasks.length > 0 && weekPct === 100 ? 'green' : 'yellow'}>
            {Math.round(weekPct)}%
          </Badge>
        </div>
        {weekTasks.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-slate-400">Nog geen taken voor deze week.</p>
        )}
        {weekTasks.map((t) => {
          const done = doneSet.has(t.id)
          return (
            <label key={t.id} className="flex cursor-pointer items-start gap-3 px-4 py-3">
              <input
                type="checkbox"
                checked={done}
                onChange={(e) => setPlanTask(activeId, t.id, e.target.checked)}
                className="mt-1 size-5 shrink-0 accent-yellow-500"
              />
              <span className="flex-1">
                <span
                  className={cx(
                    'block text-sm font-medium',
                    done ? 'text-slate-400 line-through' : 'text-slate-800',
                  )}
                >
                  <span className="mr-1">{KIND_ICON[t.kind]}</span>
                  {t.label}
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  {t.estMinutes && <span>{t.estMinutes} min</span>}
                  {t.assignee && t.assignee !== 'both' && <Badge tone="blue">{t.assignee}</Badge>}
                  {t.kind === 'duo_link' && t.ref && (
                    <a
                      href={t.ref}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-sky-600 underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      oefenexamen ↗
                    </a>
                  )}
                  {taskLink(t) && (
                    <Link
                      to={taskLink(t)!}
                      className="font-semibold text-sky-600 underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      start ↗
                    </Link>
                  )}
                </span>
              </span>
            </label>
          )
        })}
      </Panel>

      <p className="px-1 pb-2 text-center text-xs text-slate-400">
        Tip: doe elke dag je kaarten — dat is de motor van je woordenschat.
      </p>
    </div>
  )
}
