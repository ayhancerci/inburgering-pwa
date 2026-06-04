import { useState } from 'react'
import { Panel, cx } from '../../components/ui'
import { SpeakButton } from '../../components/SpeakButton'
import type { BasicsChapter, BasicsSection } from '../../content/schemas'

type ExampleSection = Extract<BasicsSection, { type: 'example' }>

function ExampleBlock({ s }: { s: ExampleSection }) {
  const [show, setShow] = useState(false)
  return (
    <section className="space-y-2">
      <h2 className="px-1 text-sm font-bold uppercase tracking-wide text-slate-500">
        📝 Voorbeeldvraag
      </h2>
      <Panel className="space-y-3 p-4">
        <div className="flex items-start gap-2">
          <SpeakButton text={s.q} className="mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-800">{s.q}</p>
            {s.qEn && <p className="text-xs text-slate-400">{s.qEn}</p>}
          </div>
        </div>

        {s.options && s.options.length > 0 && (
          <ul className="space-y-1">
            {s.options.map((o, i) => (
              <li
                key={i}
                className={cx(
                  'rounded-lg px-3 py-1.5 text-sm',
                  show && o === s.answer
                    ? 'bg-emerald-100 font-semibold text-emerald-800'
                    : 'bg-slate-50 text-slate-700',
                )}
              >
                {show && o === s.answer ? '✓ ' : ''}
                {o}
              </li>
            ))}
          </ul>
        )}

        {!show ? (
          <button
            onClick={() => setShow(true)}
            className="text-xs font-semibold text-sky-600 underline"
          >
            Toon antwoord
          </button>
        ) : (
          <div className="space-y-1">
            {s.answer && (!s.options || s.options.length === 0) && (
              <div className="rounded-xl bg-emerald-50 p-3">
                <p className="mb-1 text-xs font-bold uppercase text-emerald-700">Voorbeeldantwoord</p>
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {s.answer}
                </p>
              </div>
            )}
            {s.explanation && (
              <p className="text-xs leading-relaxed text-slate-500">{s.explanation}</p>
            )}
          </div>
        )}
      </Panel>
    </section>
  )
}

/** A reference / exam-guide chapter — read-only sections with a 🔊 on every Dutch term. */
export function Basics({ chapter, onBack }: { chapter: BasicsChapter; onBack: () => void }) {
  const isExam = chapter.category === 'examen'
  return (
    <div className="space-y-5">
      <button onClick={onBack} className="text-sm font-semibold text-slate-500">
        ← Terug naar cursus
      </button>

      <div>
        <p
          className={cx(
            'text-xs font-bold uppercase',
            isExam ? 'text-rose-500' : 'text-indigo-500',
          )}
        >
          {isExam ? 'Examen' : 'Basis'}
        </p>
        <h1 className="text-2xl font-extrabold text-slate-900">
          {chapter.icon ? `${chapter.icon} ` : ''}
          {chapter.titleNl}
        </h1>
        <p className="text-sm text-slate-500">{chapter.titleEn}</p>
      </div>

      <Panel className="p-4">
        <p className="text-sm leading-relaxed text-slate-700">{chapter.intro}</p>
      </Panel>

      {chapter.sections.map((s, i) =>
        s.type === 'note' ? (
          <Panel key={i} className="space-y-1 p-4">
            {s.title && <h2 className="font-bold text-slate-900">{s.title}</h2>}
            <p className="text-sm leading-relaxed text-slate-700">{s.body}</p>
          </Panel>
        ) : s.type === 'example' ? (
          <ExampleBlock key={i} s={s} />
        ) : (
          <section key={i} className="space-y-2">
            <h2 className="px-1 text-sm font-bold uppercase tracking-wide text-slate-500">
              {s.title}
            </h2>
            {s.note && (
              <p className="rounded-xl bg-yellow-50 px-3 py-2 text-xs leading-relaxed text-slate-700">
                💡 {s.note}
              </p>
            )}
            <Panel className="divide-y divide-slate-100">
              {s.items.map((it, j) => (
                <div key={j} className="flex items-center gap-2 px-4 py-2">
                  <SpeakButton text={it.nl} />
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-slate-800">{it.nl}</span>
                    <span className="block text-xs text-slate-400">{it.en}</span>
                  </span>
                </div>
              ))}
            </Panel>
          </section>
        ),
      )}
    </div>
  )
}
