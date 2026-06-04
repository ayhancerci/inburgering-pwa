import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Panel, cx } from '../../components/ui'
import { SpeakButton } from '../../components/SpeakButton'
import type { BasicsChapter, BasicsSection } from '../../content/schemas'

type ExampleSection = Extract<BasicsSection, { type: 'example' }>

const SECTION_ICON: Record<BasicsSection['type'], string> = {
  note: '💡',
  pairs: '📋',
  example: '📝',
  links: '🔗',
}

/** A tappable section header that expands its content (keeps long chapters scannable). */
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
      {open && <div className="space-y-2 border-t border-slate-100 px-4 py-3">{children}</div>}
    </Panel>
  )
}

function ExampleBody({ s }: { s: ExampleSection }) {
  const [show, setShow] = useState(false)
  return (
    <div className="space-y-3">
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
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{s.answer}</p>
            </div>
          )}
          {s.explanation && <p className="text-xs leading-relaxed text-slate-500">{s.explanation}</p>}
        </div>
      )}
    </div>
  )
}

/** A reference / exam-guide chapter — collapsible sections with a 🔊 on every Dutch term. */
export function Basics({ chapter, onBack }: { chapter: BasicsChapter; onBack: () => void }) {
  const isExam = chapter.category === 'examen'
  return (
    <div className="space-y-3">
      <button onClick={onBack} className="text-sm font-semibold text-slate-500">
        ← Terug naar cursus
      </button>

      <div>
        <p className={cx('text-xs font-bold uppercase', isExam ? 'text-rose-500' : 'text-indigo-500')}>
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

      <p className="px-1 text-xs text-slate-400">Tik op een onderdeel om het te openen.</p>

      {chapter.sections.map((s, i) => {
        const open = i === 0
        const icon = SECTION_ICON[s.type]
        if (s.type === 'note')
          return (
            <Collapsible key={i} title={`${icon} ${s.title || 'Uitleg'}`} defaultOpen={open}>
              <p className="text-sm leading-relaxed text-slate-700">{s.body}</p>
            </Collapsible>
          )
        if (s.type === 'pairs')
          return (
            <Collapsible
              key={i}
              title={`${icon} ${s.title}`}
              subtitle={`${s.items.length} woorden`}
              defaultOpen={open}
            >
              {s.note && (
                <p className="rounded-xl bg-yellow-50 px-3 py-2 text-xs leading-relaxed text-slate-700">
                  💡 {s.note}
                </p>
              )}
              {s.items.map((it, j) => (
                <div key={j} className="flex items-center gap-2">
                  <SpeakButton text={it.nl} />
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-slate-800">{it.nl}</span>
                    <span className="block text-xs text-slate-400">{it.en}</span>
                  </span>
                </div>
              ))}
            </Collapsible>
          )
        if (s.type === 'example')
          return (
            <Collapsible key={i} title={`${icon} Voorbeeldvraag`} defaultOpen={open}>
              <ExampleBody s={s} />
            </Collapsible>
          )
        return (
          <Collapsible key={i} title={s.title || `${icon} Links`} defaultOpen={open}>
            {s.items.map((it, j) =>
              it.mock ? (
                <Link key={j} to={`/examens?mock=${it.mock}`} className="block">
                  <span className="flex items-center gap-1 text-sm font-semibold text-slate-900">
                    {it.label} <span className="text-sky-500">›</span>
                  </span>
                  {it.note && <span className="block text-xs text-slate-400">{it.note}</span>}
                </Link>
              ) : (
                <a key={j} href={it.url} target="_blank" rel="noreferrer" className="block">
                  <span className="flex items-center gap-1 text-sm font-semibold text-slate-900">
                    {it.label} <span className="text-sky-500">↗</span>
                  </span>
                  {it.note && <span className="block text-xs text-slate-400">{it.note}</span>}
                </a>
              ),
            )}
          </Collapsible>
        )
      })}
    </div>
  )
}
