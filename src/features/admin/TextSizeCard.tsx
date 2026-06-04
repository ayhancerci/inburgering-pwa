import { useTextSize, type TextSize } from '../../store/prefs'
import { Panel, cx } from '../../components/ui'

const OPTIONS: { v: TextSize; label: string }[] = [
  { v: 'normal', label: 'Normaal' },
  { v: 'large', label: 'Groot' },
  { v: 'xl', label: 'Extra groot' },
]

export function TextSizeCard() {
  const { size, setSize } = useTextSize()
  return (
    <Panel className="space-y-2 p-4">
      <h2 className="font-bold text-slate-900">Tekstgrootte</h2>
      <p className="text-xs text-slate-500">Maak de tekst groter als dat prettiger leest.</p>
      <div className="flex gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.v}
            onClick={() => setSize(o.v)}
            className={cx(
              'flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition',
              size === o.v ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </Panel>
  )
}
