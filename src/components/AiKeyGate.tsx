import { useState } from 'react'
import { Panel, Button } from './ui'
import { useAi } from '../store/ai'
import { listModels, pickModel } from '../lib/gemini'

/** First-run gate: the user adds their own free Google Gemini key. Stored ONLY in this
 *  browser (localStorage) — never shared or uploaded. Shared by the writing & speaking tutors. */
export function AiKeyGate() {
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
        De AI-tutor gebruikt jouw eigen, gratis Google Gemini-sleutel. Hij wordt{' '}
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
