import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { loadContent } from '../../content'
import { Panel } from '../../components/ui'
import { SpeakButton } from '../../components/SpeakButton'
import { assignVoices } from '../../lib/audio'
import { useTranslationPref } from '../../store/prefs'
import type { Lesson as LessonType, Theme } from '../../content/schemas'

function ModelAnswer({ model }: { model: string }) {
  const [show, setShow] = useState(false)
  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="text-xs font-semibold text-sky-600 underline"
      >
        Toon voorbeeldantwoord
      </button>
    )
  }
  return (
    <div className="rounded-xl bg-emerald-50 p-3">
      <p className="mb-1 text-xs font-bold uppercase text-emerald-700">Voorbeeldantwoord</p>
      <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{model}</p>
    </div>
  )
}

/** Tappable, collapsible section so a lesson reads as a clean menu, not a wall of text. */
function Collapsible({
  title,
  subtitle,
  defaultOpen,
  children,
}: {
  title: string
  subtitle?: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(!!defaultOpen)
  return (
    <Panel className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        <span className="flex-1 text-sm font-bold text-slate-900">{title}</span>
        {subtitle && <span className="text-xs text-slate-400">{subtitle}</span>}
        <span className="text-slate-300">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="space-y-3 border-t border-slate-100 px-4 py-3">{children}</div>}
    </Panel>
  )
}

export function Lesson({
  theme,
  lesson,
  onBack,
}: {
  theme: Theme
  lesson: LessonType
  onBack: () => void
}) {
  const { show, toggle } = useTranslationPref()
  const { roleplays, resources } = loadContent()
  const themeRoleplays = roleplays.filter((r) => r.themeId === theme.id)
  const themeResources = resources.filter((r) => r.themeId === theme.id)

  const speakers: string[] = []
  for (const l of lesson.dialogue.lines) if (!speakers.includes(l.speaker)) speakers.push(l.speaker)
  const voiceMap = assignVoices(speakers)

  const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `Nederlands leren ${theme.titleNl} A2`,
  )}`

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <button onClick={onBack} className="text-sm font-semibold text-slate-500">
          ← Terug naar cursus
        </button>
        <button
          onClick={toggle}
          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
        >
          {show ? '🇳🇱 Verberg Engels' : '🇬🇧 Toon Engels'}
        </button>
      </div>

      <div>
        <p className="text-xs font-bold uppercase text-yellow-600">Thema {theme.number}</p>
        <h1 className="text-2xl font-extrabold text-slate-900">{theme.titleNl}</h1>
        {show && <p className="text-sm text-slate-500">{theme.titleEn}</p>}
      </div>

      {show && (
        <Panel className="p-4">
          <p className="text-sm leading-relaxed text-slate-700">{lesson.intro}</p>
        </Panel>
      )}

      <p className="px-1 text-xs text-slate-400">Tik op een onderdeel om het te openen.</p>

      <Collapsible title="📘 Grammatica" subtitle={`${lesson.grammar.length} punten`} defaultOpen>
        {lesson.grammar.map((g, i) => (
          <div key={i} className="space-y-2 rounded-xl bg-slate-50 p-3">
            <h3 className="font-bold text-slate-900">{g.title}</h3>
            {show && <p className="text-sm leading-relaxed text-slate-700">{g.explanation}</p>}
            {g.examples && g.examples.length > 0 && (
              <div className="space-y-1.5 rounded-xl bg-white p-3">
                {g.examples.map((ex, j) => (
                  <div key={j} className="flex items-start gap-2 text-sm">
                    <SpeakButton text={ex.nl} className="mt-0.5" />
                    <p>
                      <span className="font-semibold text-slate-800">{ex.nl}</span>
                      {show && <span className="text-slate-400"> — {ex.en}</span>}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {show && g.tip && (
              <p className="rounded-xl bg-yellow-50 px-3 py-2 text-xs leading-relaxed text-slate-700">
                💡 {g.tip}
              </p>
            )}
          </div>
        ))}
      </Collapsible>

      {lesson.vocab && lesson.vocab.length > 0 && (
        <Collapsible title="🔑 Kernwoorden" subtitle={`${lesson.vocab.length} woorden`}>
          {lesson.vocab.map((w, i) => (
            <div key={i} className="flex items-center gap-2">
              <SpeakButton text={w.nl} />
              <span className="flex-1">
                <span className="block text-sm font-semibold text-slate-800">{w.nl}</span>
                {show && <span className="block text-xs text-slate-400">{w.en}</span>}
              </span>
            </div>
          ))}
        </Collapsible>
      )}

      <Collapsible title="🗣️ Handige zinnen" subtitle={`${lesson.phrases.length} zinnen`}>
        {lesson.phrases.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <SpeakButton text={p.nl} />
            <span className="flex-1">
              <span className="block text-sm font-semibold text-slate-800">{p.nl}</span>
              {show && <span className="block text-xs text-slate-400">{p.en}</span>}
            </span>
          </div>
        ))}
      </Collapsible>

      {lesson.sayings && lesson.sayings.length > 0 && (
        <Collapsible title="💬 Uitdrukkingen & gezegden" subtitle={`${lesson.sayings.length}`}>
          {lesson.sayings.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <SpeakButton text={s.nl} />
              <span className="flex-1">
                <span className="block text-sm font-semibold text-slate-800">{s.nl}</span>
                {show && <span className="block text-xs text-slate-400">{s.en}</span>}
              </span>
            </div>
          ))}
        </Collapsible>
      )}

      <Collapsible title="🎬 Voorbeelddialoog">
        {show && lesson.dialogue.title && (
          <p className="text-xs italic text-slate-400">{lesson.dialogue.title}</p>
        )}
        {lesson.dialogue.lines.map((l, i) => {
          const voice = voiceMap[l.speaker]
          return (
            <div key={i} className="flex items-start gap-2">
              <SpeakButton text={l.nl} voice={voice} className="mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-slate-800">
                  <span className="font-bold text-yellow-700">{l.speaker}: </span>
                  {l.nl}
                </p>
                {show && <p className="text-xs text-slate-400">{l.en}</p>}
              </div>
            </div>
          )
        })}
      </Collapsible>

      <Collapsible title="✍️ Schrijfoefening">
        <p className="text-sm leading-relaxed text-slate-700">{lesson.writing.prompt}</p>
        {lesson.writing.tips.length > 0 && (
          <ul className="list-disc space-y-1 pl-5 text-xs text-slate-500">
            {lesson.writing.tips.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        )}
        {lesson.writing.model && <ModelAnswer model={lesson.writing.model} />}
        {lesson.writing.examples?.map((ex, i) => (
          <div key={i} className="space-y-2 border-t border-slate-100 pt-3">
            <p className="text-sm text-slate-700">
              <span className="font-bold">Nog een voorbeeld: </span>
              {ex.prompt}
            </p>
            <ModelAnswer model={ex.model} />
          </div>
        ))}
        <Link
          to={`/schrijven?task=${encodeURIComponent(lesson.writing.prompt)}`}
          className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"
        >
          ✨ Laat de AI je tekst nakijken
        </Link>
      </Collapsible>

      {themeRoleplays.length > 0 && (
        <Collapsible title="🎭 Oefen het gesprek">
          {themeRoleplays.map((rp) => (
            <Link key={rp.id} to={`/gesprekken?rp=${rp.id}`} className="block">
              <span className="flex items-center gap-1 text-sm font-semibold text-slate-900">
                💬 {rp.titleNl} <span className="text-sky-500">›</span>
              </span>
              <span className="text-xs text-slate-400">
                {rp.setting}
                {show ? ` · ${rp.titleEn}` : ''}
              </span>
            </Link>
          ))}
        </Collapsible>
      )}

      <Collapsible title="📺 Meer over dit thema">
        {themeResources.map((r) => (
          <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className="block">
            <span className="flex items-center gap-1 text-sm font-semibold text-slate-900">
              {r.title} <span className="text-sky-500">↗</span>
            </span>
            {r.description && <span className="block text-xs text-slate-400">{r.description}</span>}
          </a>
        ))}
        <a href={ytUrl} target="_blank" rel="noreferrer" className="block">
          <span className="flex items-center gap-1 text-sm font-semibold text-slate-900">
            🎬 Video's zoeken: {theme.titleNl} <span className="text-sky-500">↗</span>
          </span>
          <span className="text-xs text-slate-400">YouTube — Nederlands op A2-niveau</span>
        </a>
        <Link to="/quiz" className="block">
          <span className="flex items-center gap-1 text-sm font-semibold text-slate-900">
            📚 Alle bronnen <span className="text-sky-500">›</span>
          </span>
        </Link>
      </Collapsible>

      <div className="flex flex-wrap gap-2 pt-1">
        {theme.deckId && (
          <Link
            to={`/flashcards?deck=${theme.deckId}`}
            className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
          >
            🃏 Woorden oefenen
          </Link>
        )}
        {theme.quizId && (
          <Link
            to={`/quiz?quiz=${theme.quizId}`}
            className="rounded-xl bg-yellow-400 px-3 py-2 text-xs font-semibold text-slate-900"
          >
            ✍️ Quiz
          </Link>
        )}
      </div>
    </div>
  )
}
