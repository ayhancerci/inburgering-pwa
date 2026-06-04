import { useState } from 'react'
import { loadContent } from '../../content'
import { Panel, Button, cx } from '../../components/ui'
import { SpeakButton } from '../../components/SpeakButton'
import { playSequence } from '../../lib/audio'
import { useTranslationPref } from '../../store/prefs'
import type { RolePlay } from '../../content/schemas'

function Player({ rp, onBack }: { rp: RolePlay; onBack: () => void }) {
  const { show, toggle } = useTranslationPref()
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button onClick={onBack} className="text-sm font-semibold text-slate-500">
          ← Terug
        </button>
        <button
          onClick={toggle}
          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
        >
          {show ? '🇳🇱 Verberg Engels' : '🇬🇧 Toon Engels'}
        </button>
      </div>

      <div>
        <p className="text-xs font-bold uppercase text-yellow-600">{rp.setting}</p>
        <h1 className="text-xl font-extrabold text-slate-900">{rp.titleNl}</h1>
        {show && <p className="mt-1 text-sm text-slate-500">{rp.scenario}</p>}
      </div>

      <Button className="w-full" onClick={() => playSequence(rp.turns.map((t) => t.nl))}>
        ▶ Speel het hele gesprek
      </Button>

      <div className="space-y-2">
        {rp.turns.map((t, i) => {
          const mine = t.speaker === 'you'
          return (
            <div key={i} className={cx('flex', mine ? 'justify-end' : 'justify-start')}>
              <div
                className={cx(
                  'max-w-[85%] rounded-2xl px-3 py-2',
                  mine ? 'bg-yellow-100' : 'bg-white ring-1 ring-slate-200',
                )}
              >
                <p
                  className={cx(
                    'text-[10px] font-bold uppercase',
                    mine ? 'text-yellow-700' : 'text-slate-400',
                  )}
                >
                  {t.who}
                  {mine ? ' · jouw zin' : ''}
                </p>
                <div className="flex items-start gap-2">
                  <p className="flex-1 text-sm text-slate-800">{t.nl}</p>
                  <SpeakButton text={t.nl} />
                </div>
                {show && <p className="mt-0.5 text-xs text-slate-400">{t.en}</p>}
              </div>
            </div>
          )
        })}
      </div>

      <p className="px-1 pb-2 text-center text-xs text-slate-400">
        Tip: lees de gele zinnen hardop — dat is jouw rol. Tik op 🔊 om te horen.
      </p>
    </div>
  )
}

export function RolePlays() {
  const { roleplays } = loadContent()
  const [active, setActive] = useState<RolePlay | null>(null)

  if (active) return <Player rp={active} onBack={() => setActive(null)} />

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">Gesprekken</h1>
        <p className="mt-1 text-sm text-slate-500">
          Oefen echte situaties. De app spreekt; jij leest jouw zinnen hardop.
        </p>
      </div>
      <div className="space-y-2">
        {roleplays.map((rp) => (
          <button key={rp.id} onClick={() => setActive(rp)} className="w-full text-left">
            <Panel className="flex items-center justify-between gap-3 p-4">
              <span>
                <span className="block text-sm font-bold text-slate-900">{rp.titleNl}</span>
                <span className="block text-xs text-slate-500">
                  {rp.setting} · {rp.titleEn}
                </span>
              </span>
              <span className="text-slate-300">›</span>
            </Panel>
          </button>
        ))}
        {roleplays.length === 0 && (
          <p className="text-center text-sm text-slate-400">Nog geen gesprekken.</p>
        )}
      </div>
    </div>
  )
}
