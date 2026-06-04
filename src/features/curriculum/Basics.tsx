import { Panel } from '../../components/ui'
import { SpeakButton } from '../../components/SpeakButton'
import type { BasicsChapter } from '../../content/schemas'

/** A foundational reference chapter (numbers, time, grammar, …) — read-only tables with
 *  a 🔊 on every Dutch term so you can hear it in a natural voice. */
export function Basics({ chapter, onBack }: { chapter: BasicsChapter; onBack: () => void }) {
  return (
    <div className="space-y-5">
      <button onClick={onBack} className="text-sm font-semibold text-slate-500">
        ← Terug naar cursus
      </button>

      <div>
        <p className="text-xs font-bold uppercase text-indigo-500">Basis</p>
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
