import { useEffect, useState } from 'react'
import { ttsAvailable, hasDutchVoice, dutchVoiceName, speak } from '../../lib/tts'
import { Panel, Button } from '../../components/ui'

export function VoiceCard() {
  const [ok, setOk] = useState(false)
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    if (!ttsAvailable()) return
    const check = () => {
      setOk(hasDutchVoice())
      setName(dutchVoiceName())
    }
    check()
    window.speechSynthesis.addEventListener?.('voiceschanged', check)
    const t = setTimeout(check, 700) // voices can load a moment after mount
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', check)
      clearTimeout(t)
    }
  }, [])

  if (!ttsAvailable()) return null

  return (
    <Panel className="space-y-2 p-4">
      <h2 className="font-bold text-slate-900">Uitspraak / stem</h2>
      {ok ? (
        <>
          <p className="text-xs text-slate-500">
            Nederlandse stem gevonden: <span className="font-semibold text-slate-700">{name}</span>
          </p>
          <Button variant="subtle" onClick={() => speak('Hallo! Ik spreek Nederlands. Goedemorgen.')}>
            🔊 Test de stem
          </Button>
        </>
      ) : (
        <>
          <p className="text-xs text-slate-600">
            Geen Nederlandse stem gevonden — de 🔊-knop klinkt dan Engels. Voeg een Nederlandse
            stem toe (gratis), dan klinkt alles goed:
          </p>
          <ul className="list-disc space-y-1 pl-5 text-xs text-slate-500">
            <li>
              <strong>iPhone/iPad:</strong> Instellingen → Toegankelijkheid → Gesproken materiaal →
              Stemmen → Nederlands.
            </li>
            <li>
              <strong>Android:</strong> Instellingen → Toegankelijkheid → Tekst-naar-spraak →
              Nederlands installeren.
            </li>
            <li>
              <strong>Mac:</strong> Systeeminstellingen → Toegankelijkheid → Gesproken inhoud →
              Beheer stemmen → Nederlands.
            </li>
            <li>
              <strong>Chrome (computer):</strong> gebruikt online een Google-stem — zorg dat je
              internet hebt, of gebruik Chrome i.p.v. Safari.
            </li>
          </ul>
          <Button variant="subtle" onClick={() => speak('Hallo, goedemorgen!')}>
            🔊 Test opnieuw
          </Button>
        </>
      )}
    </Panel>
  )
}
