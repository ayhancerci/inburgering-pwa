import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Panel } from '../../components/ui'
import { SpeakButton } from '../../components/SpeakButton'
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
      <p className="text-sm leading-relaxed text-slate-700">{model}</p>
    </div>
  )
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="px-1 text-sm font-bold uppercase tracking-wide text-slate-500">{children}</h2>
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
  const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `Nederlands leren ${theme.titleNl} A2`,
  )}`

  return (
    <div className="space-y-5">
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

      <section className="space-y-2">
        <SectionTitle>📘 Grammatica</SectionTitle>
        {lesson.grammar.map((g, i) => (
          <Panel key={i} className="space-y-2 p-4">
            <h3 className="font-bold text-slate-900">{g.title}</h3>
            {show && <p className="text-sm leading-relaxed text-slate-700">{g.explanation}</p>}
            {g.examples && g.examples.length > 0 && (
              <div className="space-y-1.5 rounded-xl bg-slate-50 p-3">
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
          </Panel>
        ))}
      </section>

      <section className="space-y-2">
        <SectionTitle>🗣️ Handige zinnen</SectionTitle>
        <Panel className="divide-y divide-slate-100">
          {lesson.phrases.map((p, i) => (
            <div key={i} className="flex items-center gap-2 px-4 py-2">
              <SpeakButton text={p.nl} />
              <span className="flex-1">
                <span className="block text-sm font-semibold text-slate-800">{p.nl}</span>
                {show && <span className="block text-xs text-slate-400">{p.en}</span>}
              </span>
            </div>
          ))}
        </Panel>
      </section>

      <section className="space-y-2">
        <SectionTitle>💬 Voorbeelddialoog</SectionTitle>
        <Panel className="space-y-3 p-4">
          {show && lesson.dialogue.title && (
            <p className="text-xs italic text-slate-400">{lesson.dialogue.title}</p>
          )}
          {lesson.dialogue.lines.map((l, i) => (
            <div key={i} className="flex items-start gap-2">
              <SpeakButton text={l.nl} className="mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-slate-800">
                  <span className="font-bold text-yellow-700">{l.speaker}: </span>
                  {l.nl}
                </p>
                {show && <p className="text-xs text-slate-400">{l.en}</p>}
              </div>
            </div>
          ))}
        </Panel>
      </section>

      <section className="space-y-2">
        <SectionTitle>✍️ Schrijfoefening</SectionTitle>
        <Panel className="space-y-3 p-4">
          <p className="text-sm leading-relaxed text-slate-700">{lesson.writing.prompt}</p>
          {lesson.writing.tips.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-xs text-slate-500">
              {lesson.writing.tips.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          )}
          {lesson.writing.model && <ModelAnswer model={lesson.writing.model} />}
        </Panel>
      </section>

      <section className="space-y-2">
        <SectionTitle>📺 Meer over dit thema</SectionTitle>
        <Panel className="divide-y divide-slate-100">
          <a href={ytUrl} target="_blank" rel="noreferrer" className="block px-4 py-3">
            <span className="flex items-center gap-1 text-sm font-semibold text-slate-900">
              🎬 Video's zoeken: {theme.titleNl} <span className="text-sky-500">↗</span>
            </span>
            <span className="text-xs text-slate-400">YouTube — Nederlands op A2-niveau</span>
          </a>
          <Link to="/quiz" className="block px-4 py-3">
            <span className="flex items-center gap-1 text-sm font-semibold text-slate-900">
              📚 Alle bronnen <span className="text-sky-500">›</span>
            </span>
            <span className="text-xs text-slate-400">video's, lezen, luisteren &amp; oefenexamens</span>
          </Link>
        </Panel>
      </section>

      <div className="flex flex-wrap gap-2">
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
