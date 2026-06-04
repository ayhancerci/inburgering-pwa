import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { loadContent } from '../../content'
import { Panel, Badge, cx } from '../../components/ui'
import { Lesson } from './Lesson'
import { Basics } from './Basics'
import type { Theme, BasicsChapter, Lesson as LessonType } from '../../content/schemas'

// Which Basis chapters go in which collapsible group (by id). Keep in sync when adding chapters.
const BASIS_GROUPS: { label: string; ids: string[] }[] = [
  {
    label: '🔤 Woordenschat',
    ids: [
      'basis-getallen',
      'basis-woorden-mensen',
      'basis-woorden-dagelijks',
      'basis-kleuren-kleding',
      'basis-boodschappen',
      'basis-natuur-landschap',
      'basis-vervoer',
    ],
  },
  {
    label: '📐 Taal & grammatica',
    ids: [
      'basis-uitspraak',
      'basis-voornaamwoorden',
      'basis-werkwoorden',
      'basis-grammatica',
      'basis-voorzetsels',
      'basis-verbindingswoorden',
      'basis-vergelijken',
      'basis-er',
      'basis-reflexief',
      'basis-bijzinnen',
      'basis-tijdwoorden',
      'basis-werkwoordenlijst',
    ],
  },
  {
    label: '🙋 Jezelf & sociaal',
    ids: [
      'basis-begroeten',
      'basis-beschrijf-ik',
      'basis-vrije-tijd',
      'basis-favorieten',
      'basis-gevoelens',
      'basis-mening',
      'basis-vertellen',
      'basis-plannen',
    ],
  },
  {
    label: '🏛️ Praktisch & instanties',
    ids: [
      'basis-geld',
      'basis-brieven',
      'basis-de-weg',
      'basis-telefoneren',
      'basis-noodgevallen',
      'basis-ov',
      'basis-bank-post',
      'basis-internet-digid',
      'basis-huren',
      'basis-gezondheid',
    ],
  },
  {
    label: '🇳🇱 Nederland: cultuur & geschiedenis',
    ids: [
      'basis-landen',
      'basis-beroemde-nederlanders',
      'basis-geschiedenis',
      'basis-feestdagen',
      'basis-typisch-nl',
      'basis-inburgering',
    ],
  },
]

function GroupSection({
  label,
  count,
  defaultOpen,
  children,
}: {
  label: string
  count: number
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(!!defaultOpen)
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-xl bg-slate-100 px-3 py-2.5 text-left"
      >
        <span className="flex-1 text-sm font-extrabold text-slate-800">{label}</span>
        <span className="text-xs font-semibold text-slate-400">{count}</span>
        <span className="text-slate-400">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="space-y-2">{children}</div>}
    </div>
  )
}

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
      <Panel className={cx('flex items-center gap-3 p-4 ring-1', isExam ? 'ring-rose-100' : 'ring-indigo-100')}>
        <span
          className={cx(
            'grid size-8 shrink-0 place-items-center rounded-full text-base',
            isExam ? 'bg-rose-100' : 'bg-indigo-100',
          )}
        >
          {chapter.icon ?? (isExam ? '🎓' : '📐')}
        </span>
        <span className="flex-1">
          <span className="block text-sm font-bold text-slate-900">{chapter.titleNl}</span>
          <span className="block text-xs text-slate-500">{chapter.titleEn}</span>
        </span>
        <span className="text-slate-300">›</span>
      </Panel>
    </button>
  )
}

export function Curriculum() {
  const { themes, lessons, basics } = loadContent()
  const lessonMap = useMemo(() => new Map(lessons.map((l) => [l.themeId, l])), [lessons])
  const [open, setOpen] = useState<string | null>(null)
  const [lessonTheme, setLessonTheme] = useState<Theme | null>(null)
  const [basicsChapter, setBasicsChapter] = useState<BasicsChapter | null>(null)

  const { basisGroups, examen } = useMemo(() => {
    const byId = new Map(basics.map((c) => [c.id, c]))
    const used = new Set<string>()
    const groups = BASIS_GROUPS.map((g) => {
      const chapters = g.ids.map((id) => byId.get(id)).filter((c): c is BasicsChapter => !!c)
      chapters.forEach((c) => used.add(c.id))
      return { label: g.label, chapters }
    }).filter((g) => g.chapters.length > 0)
    const leftover = basics.filter((c) => c.category !== 'examen' && !used.has(c.id))
    if (leftover.length) groups.push({ label: '🧩 Overig', chapters: leftover })
    const examen = basics.filter((c) => c.category === 'examen')
    return { basisGroups: groups, examen }
  }, [basics])

  if (basicsChapter) {
    return <Basics chapter={basicsChapter} onBack={() => setBasicsChapter(null)} />
  }
  if (lessonTheme) {
    const lesson = lessonMap.get(lessonTheme.id)
    if (lesson) {
      return <Lesson theme={lessonTheme} lesson={lesson} onBack={() => setLessonTheme(null)} />
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">Cursus — LINK 0 → A2</h1>
        <p className="mt-1 text-sm text-slate-500">
          Tik op een categorie om de hoofdstukken te zien. <span className="font-semibold text-indigo-600">Basis</span>{' '}
          = bouwstenen, <span className="font-semibold text-rose-600">Examen</span> = uitleg per examen.
        </p>
      </div>

      <GroupSection label="📖 LINK-thema's (0 → A2)" count={themes.length} defaultOpen>
        {themes.map((t) => (
          <ThemePanel
            key={t.id}
            t={t}
            isOpen={open === t.id}
            onToggle={() => setOpen(open === t.id ? null : t.id)}
            lesson={lessonMap.get(t.id)}
            onOpenLesson={() => setLessonTheme(t)}
          />
        ))}
      </GroupSection>

      {basisGroups.map((g) => (
        <GroupSection key={g.label} label={g.label} count={g.chapters.length}>
          {g.chapters.map((c) => (
            <BasicsRow key={c.id} chapter={c} onOpen={() => setBasicsChapter(c)} />
          ))}
        </GroupSection>
      ))}

      {examen.length > 0 && (
        <GroupSection label="🎓 Examen-gidsen" count={examen.length}>
          {examen.map((c) => (
            <BasicsRow key={c.id} chapter={c} onOpen={() => setBasicsChapter(c)} />
          ))}
        </GroupSection>
      )}
    </div>
  )
}
