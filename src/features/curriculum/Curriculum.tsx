import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { loadContent } from '../../content'
import { Panel, cx } from '../../components/ui'
import { Lesson } from './Lesson'
import { Basics } from './Basics'
import type { Theme, BasicsChapter, Lesson as LessonType } from '../../content/schemas'

// Which Basis chapters support each course theme (so you can follow the Basis while doing the
// theme in the book + app). A chapter may support several themes. Keep ids in sync.
const THEME_BASIS: Record<string, string[]> = {
  'thema-01': ['basis-begroeten', 'basis-beschrijf-ik', 'basis-voornaamwoorden'],
  'thema-02': ['basis-boodschappen', 'basis-geld'],
  'thema-03': ['basis-gevoelens', 'basis-begroeten'],
  'thema-04': ['basis-favorieten', 'basis-woorden-dagelijks'],
  'thema-05': ['basis-huren', 'basis-woorden-dagelijks'],
  'thema-06': ['basis-vervoer', 'basis-ov', 'basis-de-weg'],
  'thema-07': ['basis-gezondheid', 'basis-woorden-mensen'],
  'thema-08': ['basis-begroeten', 'basis-de-weg'],
  'thema-09': ['basis-kleuren-kleding', 'basis-geld', 'basis-internet-digid'],
  'thema-10': ['basis-noodgevallen'],
  'thema-11': ['basis-plannen', 'basis-vrije-tijd'],
  'thema-12': ['basis-inburgering', 'basis-vertellen'],
  'thema-13': ['basis-huren', 'basis-internet-digid'],
  'thema-14': ['basis-woorden-mensen', 'basis-telefoneren'],
  'thema-15': ['basis-vrije-tijd', 'basis-kleuren-kleding'],
  'thema-16': ['basis-inburgering', 'basis-internet-digid', 'basis-bank-post', 'basis-noodgevallen'],
  'thema-17': ['basis-brieven', 'basis-beschrijf-ik'],
  'thema-18': ['basis-natuur-landschap', 'basis-getallen'],
  'thema-19': ['basis-geld', 'basis-bank-post'],
  'thema-20': ['basis-mening', 'basis-vertellen', 'basis-internet-digid'],
}

// General Basis groups (foundational chapters that apply to every theme), shown below the themes.
const BASIS_GROUPS: { label: string; ids: string[] }[] = [
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
  relatedBasis,
  onOpenBasics,
}: {
  t: Theme
  isOpen: boolean
  onToggle: () => void
  lesson?: LessonType
  onOpenLesson: () => void
  relatedBasis: BasicsChapter[]
  onOpenBasics: (c: BasicsChapter) => void
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

          {relatedBasis.length > 0 && (
            <div className="space-y-1.5 rounded-xl bg-indigo-50/60 p-3">
              <p className="text-xs font-bold uppercase text-indigo-500">📚 Basis bij dit thema</p>
              <p className="text-xs text-slate-500">
                Volg deze Basis-hoofdstukken terwijl je dit thema doet (in de app én het boek).
              </p>
              {relatedBasis.map((b) => (
                <button
                  key={b.id}
                  onClick={() => onOpenBasics(b)}
                  className="flex w-full items-center gap-2 rounded-lg bg-white px-3 py-2 text-left ring-1 ring-indigo-100"
                >
                  <span className="text-base">{b.icon ?? '📐'}</span>
                  <span className="flex-1 text-xs font-semibold text-slate-800">{b.titleNl}</span>
                  <span className="text-slate-300">›</span>
                </button>
              ))}
            </div>
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
  const byId = useMemo(() => new Map(basics.map((c) => [c.id, c])), [basics])
  const [open, setOpen] = useState<string | null>(null)
  const [lessonTheme, setLessonTheme] = useState<Theme | null>(null)
  const [basicsChapter, setBasicsChapter] = useState<BasicsChapter | null>(null)

  const themeBasis = useMemo(() => {
    const m = new Map<string, BasicsChapter[]>()
    for (const [themeId, ids] of Object.entries(THEME_BASIS)) {
      m.set(themeId, ids.map((id) => byId.get(id)).filter((c): c is BasicsChapter => !!c))
    }
    return m
  }, [byId])

  const { basisGroups, examen } = useMemo(() => {
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
  }, [basics, byId])

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
        <h1 className="text-xl font-extrabold text-slate-900">Cursus — 0 → A2</h1>
        <p className="mt-1 text-sm text-slate-500">
          Open een thema om de les én de <span className="font-semibold text-indigo-600">Basis bij dit thema</span> te
          zien — die volg je ernaast in de app en in het boek. Daaronder staan de algemene Basis-onderwerpen en de
          <span className="font-semibold text-rose-600"> Examen</span>-gidsen.
        </p>
      </div>

      <GroupSection label="📖 Cursusthema's (0 → A2)" count={themes.length} defaultOpen>
        {themes.map((t) => (
          <ThemePanel
            key={t.id}
            t={t}
            isOpen={open === t.id}
            onToggle={() => setOpen(open === t.id ? null : t.id)}
            lesson={lessonMap.get(t.id)}
            onOpenLesson={() => setLessonTheme(t)}
            relatedBasis={themeBasis.get(t.id) ?? []}
            onOpenBasics={setBasicsChapter}
          />
        ))}
      </GroupSection>

      <p className="px-1 pt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Algemene Basis (voor alle thema's)
      </p>
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
