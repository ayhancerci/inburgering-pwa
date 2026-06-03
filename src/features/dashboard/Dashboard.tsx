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

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000)
}

function currentWeekNumber(startDate: string, weeks: PlanWeek[]): number {
  if (weeks.length === 0) return 1
  const start = new Date(startDate + 'T00:00:00')
  const wk = Math.floor(daysBetween(start, new Date()) / 7) + 1
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
}

export function Dashboard() {
  const { planMeta } = loadContent()
  const { activeId } = useActiveProfile()

  const weeks = useLiveQuery(() => db.planWeeks.orderBy('weekNumber').toArray(), [], [] as PlanWeek[])
  const progressRows = useLiveQuery(
    () => db.planProgress.where('profileId').equals(activeId).toArray(),
    [activeId],
    [],
  )
  const due = useLiveQuery(() => dueCount(activeId), [activeId], 0)

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

  const examDays = planMeta.examDate
    ? daysBetween(new Date(), new Date(planMeta.examDate + 'T00:00:00'))
    : null

  return (
    <div className="space-y-4">
      <Panel className="overflow-hidden">
        <div className="bg-yellow-400 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Week {weekNo}</p>
              <h1 className="text-xl font-extrabold text-slate-900">{week?.theme ?? 'Studieplan'}</h1>
              {week?.dateLabel && <p className="text-xs font-medium text-slate-700">{week.dateLabel}</p>}
            </div>
            {examDays != null && (
              <div className="text-right">
                <p className="text-3xl font-black leading-none text-slate-900">{examDays}</p>
                <p className="text-[10px] font-bold uppercase text-slate-700">dagen tot examen</p>
              </div>
            )}
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
        <Link to="/quiz">
          <Panel className="flex h-full flex-col justify-between gap-3 p-4">
            <span className="text-2xl">✍️</span>
            <div>
              <p className="font-bold text-slate-900">Oefenen</p>
              <p className="text-xs text-slate-500">Grammatica &amp; woorden</p>
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
                  {t.kind === 'flashcards' && (
                    <Link
                      to="/flashcards"
                      className="font-semibold text-sky-600 underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      start ↗
                    </Link>
                  )}
                  {t.kind === 'quiz' && (
                    <Link
                      to="/quiz"
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
