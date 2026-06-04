import { useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Panel, Button, cx } from '../../components/ui'
import { SpeakButton } from '../../components/SpeakButton'
import { AiKeyGate } from '../../components/AiKeyGate'
import { useAi } from '../../store/ai'
import { gradeSpeaking, type SpeakingFeedback } from '../../lib/gemini'

/* eslint-disable @typescript-eslint/no-explicit-any */
const SRClass: any =
  typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null

export function SpeakingTutor() {
  const { geminiKey, geminiModel, clear } = useAi()
  const [params] = useSearchParams()
  const [task, setTask] = useState(params.get('task') ?? '')
  const [transcript, setTranscript] = useState('')
  const [recording, setRecording] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [fb, setFb] = useState<SpeakingFeedback | null>(null)
  const recRef = useRef<any>(null)

  function toggleRec() {
    if (!SRClass) return
    if (recording) {
      recRef.current?.stop()
      return
    }
    const rec = new SRClass()
    rec.lang = 'nl-NL'
    rec.continuous = true
    rec.interimResults = false
    rec.onresult = (e: any) => {
      let finalText = ''
      for (let i = e.resultIndex; i < e.results.length; i++)
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript
      if (finalText.trim()) setTranscript((t) => (t ? t + ' ' : '') + finalText.trim())
    }
    rec.onend = () => setRecording(false)
    rec.onerror = () => setRecording(false)
    recRef.current = rec
    try {
      rec.start()
      setRecording(true)
    } catch {
      /* already running */
    }
  }

  async function check() {
    setBusy(true)
    setErr(null)
    setFb(null)
    try {
      setFb(await gradeSpeaking({ key: geminiKey, model: geminiModel, task, transcript }))
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-extrabold text-slate-900">🗣️ AI Spreektutor</h1>
        {geminiKey && (
          <button onClick={clear} className="text-xs font-semibold text-slate-400 underline">
            Sleutel wissen
          </button>
        )}
      </div>

      {!geminiKey ? (
        <AiKeyGate />
      ) : (
        <>
          <p className="text-sm text-slate-500">
            Lees de opdracht, spreek je antwoord hardop in (of typ het), en laat de AI je gesproken
            Nederlands op A2-niveau nakijken.
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
                placeholder="Bijv. Beschrijf wat je in je vrije tijd doet."
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>

            {SRClass ? (
              <Button
                onClick={toggleRec}
                variant={recording ? 'danger' : 'primary'}
                className="w-full"
              >
                {recording ? '⏹ Stop met opnemen' : '🎙️ Begin met spreken'}
              </Button>
            ) : (
              <p className="rounded-xl bg-yellow-50 px-3 py-2 text-xs leading-relaxed text-slate-700">
                💡 Spraakherkenning werkt het best in Chrome. Typ anders gewoon hieronder wat je zou
                zeggen.
              </p>
            )}

            <label className="block">
              <span className="text-xs font-bold uppercase text-slate-500">
                Wat je zei {recording && <span className="text-rose-500">● opnemen…</span>}
              </span>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={5}
                placeholder="Je gesproken tekst verschijnt hier — of typ het zelf."
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>

            {err && <p className="text-sm text-rose-600">{err}</p>}
            <Button onClick={check} disabled={busy || transcript.trim().length < 5} className="w-full">
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
              {fb.model && (
                <Panel className="space-y-1 p-4">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    🗣️ Voorbeeldantwoord <SpeakButton text={fb.model} />
                  </h3>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                    {fb.model}
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
            Spraakherkenning gebeurt in je browser; alleen de tekst gaat naar Gemini voor feedback.
            De AI kan fouten maken.
          </p>
        </>
      )}
    </div>
  )
}
