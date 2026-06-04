import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadContent } from '../../content'
import { Panel, Badge, cx } from '../../components/ui'
import { Lesson } from './Lesson'
import { Basics } from './Basics'
import type { Theme, BasicsChapter, Lesson as LessonType } from '../../content/schemas'

function ThemePanel({
  t,
  isOpen,
  onToggle,
  lesson,
  onOpenLesson,
}: {
  t: Theme
  isOpen: boolean
  onToggle: () => void
  lesson?: LessonType
  onOpenLesson: () => void
}) {
  return (
    <Panel className="overflow-hidden">
      <button onClick={onToggle} className="flex w-full items-center gap-3 px-4 py-3 text-left">
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
          <p className="rounded-lg bg-yellow-50 px-3 py-2 text-sm text-slate-700">💡 {t.tip}</p>

          {lesson && (
            <button
              onClick={onOpenLesson}
              className="flex w-full items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white"
            >
              <span>📖 Lees de les</span>
              <span className="text-xs font-normal text-slate-300">
                uitleg · grammatica · dialoog · schrijven
              </span>
            </button>
          )}

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
                className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-800"
              >
                🃏 Woorden
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
}

function BasicsRow({ chapter, onOpen }: { chapter: BasicsChapter; onOpen: () => void }) {
  const isExam = chapter.category === 'examen'
  return (
    <button onClick={onOpen} className="w-full text-left">
      <Panel
        className={cx('flex items-center gap-3 p-4 ring-1', isExam ? 'ring-rose-100' : 'ring-indigo-100')}
      >
        <span
          className={cx(
            'grid size-8 shrink-0 place-items-center rounded-full text-base',
            isExam ? 'bg-rose-100' : 'bg-indigo-100',
          )}
        >
          {chapter.icon ?? (isExam ? '🎓' : '📐')}
        </span>
        <span className="flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-slate-900">{chapter.titleNl}</span>
            <span
              className={cx(
                'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                isExam ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600',
              )}
            >
              {isExam ? 'Examen' : 'Basis'}
            </span>
          </span>
          <span className="block text-xs text-slate-500">{chapter.titleEn}</span>
        </span>
        <span className="text-slate-300">›</span>
      </Panel>
    </button>
  )
}

type Row =
  | { kind: 'theme'; sort: number; theme: Theme }
  | { kind: 'basics'; sort: number; chapter: BasicsChapter }

type Filter = 'all' | 'themes' | 'basics' | 'examen'

export function Curriculum() {
  const { themes, lessons, basics } = loadContent()
  const lessonMap = useMemo(() => new Map(lessons.map((l) => [l.themeId, l])), [lessons])
  const [open, setOpen] = useState<string | null>(null)
  const [lessonTheme, setLessonTheme] = useState<Theme | null>(null)
  const [basicsChapter, setBasicsChapter] = useState<BasicsChapter | null>(null)
  const [filter, setFilter] = useState<Filter>('all')

  const rows = useMemo<Row[]>(() => {
    const merged: Row[] = [
      ...themes.map((t) => ({ kind: 'theme' as const, sort: t.number, theme: t })),
      ...basics.map((b) => ({ kind: 'basics' as const, sort: b.sort, chapter: b })),
    ]
    return merged.sort((a, b) => a.sort - b.sort)
  }, [themes, basics])

  if (basicsChapter) {
    return <Basics chapter={basicsChapter} onBack={() => setBasicsChapter(null)} />
  }
  if (lessonTheme) {
    const lesson = lessonMap.get(lessonTheme.id)
    if (lesson) {
      return <Lesson theme={lessonTheme} lesson={lesson} onBack={() => setLessonTheme(null)} />
    }
  }

  const tabs: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Alles' },
    { key: 'themes', label: 'Thema’s' },
    { key: 'basics', label: 'Basis' },
    { key: 'examen', label: 'Examen' },
  ]
  const visible = rows.filter((row) => {
    if (filter === 'all') return true
    if (filter === 'themes') return row.kind === 'theme'
    if (filter === 'basics') return row.kind === 'basics' && row.chapter.category !== 'examen'
    return row.kind === 'basics' && row.chapter.category === 'examen'
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">Cursus — LINK 0 → A2</h1>
        <p className="mt-1 text-sm text-slate-500">
          Tap a chapter for the full lesson. <span className="font-semibold text-indigo-600">Basis</span>{' '}
          chapters teach the building blocks; <span className="font-semibold text-rose-600">Examen</span>{' '}
          chapters explain each exam with tips and example questions.
        </p>
      </div>

      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={cx(
              'flex-1 rounded-lg px-2 py-1.5 transition',
              filter === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {visible.map((row) =>
          row.kind === 'basics' ? (
            <BasicsRow
              key={row.chapter.id}
              chapter={row.chapter}
              onOpen={() => setBasicsChapter(row.chapter)}
            />
          ) : (
            <ThemePanel
              key={row.theme.id}
              t={row.theme}
              isOpen={open === row.theme.id}
              onToggle={() => setOpen(open === row.theme.id ? null : row.theme.id)}
              lesson={lessonMap.get(row.theme.id)}
              onOpenLesson={() => setLessonTheme(row.theme)}
            />
          ),
        )}
      </div>
    </div>
  )
}
