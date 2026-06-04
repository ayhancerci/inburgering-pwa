import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Panel, Button, cx } from '../../components/ui'
import { useAi } from '../../store/ai'
import { listModels, pickModel, gradeWriting, type WritingFeedback } from '../../lib/gemini'

function KeyGate() {
  const { setKey, setModel } = useAi()
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function save() {
    setBusy(true)
    setErr(null)
    try {
      const models = await listModels(input.trim())
      setModel(pickModel(models))
      setKey(input.trim())
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel className="space-y-3 p-4">
      <h2 className="font-bold text-slate-900">🔑 Voeg je Gemini-sleutel toe</h2>
      <p className="text-sm text-slate-600">
        De schrijftutor gebruikt jouw eigen, gratis Google Gemini-sleutel. Hij wordt{' '}
        <span className="font-semibold">alleen in deze browser</span> bewaard — niet gedeeld en
        niet geüpload.
      </p>
      <p className="text-xs text-slate-500">
        Gratis sleutel ophalen:{' '}
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-sky-600 underline"
        >
          aistudio.google.com/apikey ↗
        </a>
      </p>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        type="password"
        autoComplete="off"
        placeholder="AIza…"
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
      />
      {err && <p className="text-sm text-rose-600">{err}</p>}
      <Button onClick={save} disabled={busy || input.trim().length < 10} className="w-full">
        {busy ? 'Testen…' : 'Opslaan & testen'}
      </Button>
    </Panel>
  )
}

export function WritingTutor() {
  const { geminiKey, geminiModel, clear } = useAi()
  const [params] = useSearchParams()
  const [task, setTask] = useState(params.get('task') ?? '')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [fb, setFb] = useState<WritingFeedback | null>(null)

  async function check() {
    setBusy(true)
    setErr(null)
    setFb(null)
    try {
      setFb(await gradeWriting({ key: geminiKey, model: geminiModel, task, text }))
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-extrabold text-slate-900">✍️ AI Schrijftutor</h1>
        {geminiKey && (
          <button onClick={clear} className="text-xs font-semibold text-slate-400 underline">
            Sleutel wissen
          </button>
        )}
      </div>

      {!geminiKey ? (
        <KeyGate />
      ) : (
        <>
          <p className="text-sm text-slate-500">
            Schrijf je tekst in het Nederlands. De AI kijkt hem na op A2-niveau: een verbeterde
            versie, een score en tips.
          </p>

          <Panel className="space-y-3 p-4">
            <label className="block">
              <span className="text-xs font-bold uppercase text-slate-500">
                De opdracht (optioneel)
              </span>
              <textarea
                value={task}
                onChange={(e) => setTask(e.target.value)}
                rows={2}
                placeholder="Bijv. Schrijf een kort bericht aan je buurvrouw…"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase text-slate-500">Jouw tekst</span>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={7}
                placeholder="Schrijf hier in het Nederlands…"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            {err && <p className="text-sm text-rose-600">{err}</p>}
            <Button onClick={check} disabled={busy || text.trim().length < 5} className="w-full">
              {busy ? 'Nakijken…' : '✨ Laat nakijken'}
            </Button>
          </Panel>

          {fb && (
            <div className="space-y-3">
              <Panel className="flex items-center justify-between p-4">
                <span className="text-sm font-bold text-slate-900">Niveau: {fb.level}</span>
                <span
                  className={cx(
                    'rounded-full px-3 py-1 text-sm font-bold',
                    fb.score >= 60 ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-800',
                  )}
                >
                  {fb.score}/100
                </span>
              </Panel>
              {fb.good.length > 0 && (
                <Panel className="space-y-1 p-4">
                  <h3 className="text-sm font-bold text-emerald-700">✅ Goed gedaan</h3>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                    {fb.good.map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                </Panel>
              )}
              {fb.issues.length > 0 && (
                <Panel className="space-y-1 p-4">
                  <h3 className="text-sm font-bold text-rose-700">✏️ Verbeterpunten</h3>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                    {fb.issues.map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                </Panel>
              )}
              {fb.corrected && (
                <Panel className="space-y-1 p-4">
                  <h3 className="text-sm font-bold text-slate-900">📝 Verbeterde versie</h3>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                    {fb.corrected}
                  </p>
                </Panel>
              )}
              {fb.tips.length > 0 && (
                <Panel className="space-y-1 p-4">
                  <h3 className="text-sm font-bold text-sky-700">💡 Tips</h3>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                    {fb.tips.map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                </Panel>
              )}
            </div>
          )}

          <p className="px-1 text-center text-xs text-slate-400">
            Je sleutel blijft in deze browser. De AI kan fouten maken — gebruik de feedback als
            hulp, niet als laatste woord.
          </p>
        </>
      )}
    </div>
  )
}
