import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { exportData, importData } from '../../db/backup'
import { Panel, Button } from '../../components/ui'

export function BackupCard() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<string | null>(null)

  const download = async () => {
    const blob = await exportData()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inburgering-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setStatus('Back-up gedownload ✓')
  }

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const { imported } = await importData(await file.text())
      setStatus(`Hersteld: ${imported} items ✓ — even verversen…`)
      setTimeout(() => location.reload(), 900)
    } catch {
      setStatus('Kon dit bestand niet lezen ✗')
    }
  }

  return (
    <Panel className="space-y-3 p-4">
      <div>
        <h2 className="font-bold text-slate-900">Back-up &amp; herstel</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Sla je voortgang op als bestand of zet het terug — handig om naar een ander toestel te
          gaan. <span className="text-slate-400">(Save your progress to a file, or restore it.)</span>
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={download}>⬇️ Download back-up</Button>
        <Button variant="subtle" onClick={() => fileRef.current?.click()}>
          ⬆️ Herstel uit bestand
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={onFile}
          className="hidden"
        />
      </div>
      {status && <p className="text-xs font-semibold text-emerald-600">{status}</p>}
    </Panel>
  )
}
