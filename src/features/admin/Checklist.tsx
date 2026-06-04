import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/database'
import { useActiveProfile } from '../../store/profile'
import { setChecklist } from '../../db/repo'
import { Panel, Badge } from '../../components/ui'
import type { ChecklistItemDef } from '../../content/schemas'
import { BackupCard } from './BackupCard'
import { TextSizeCard } from './TextSizeCard'
import { VoiceCard } from './VoiceCard'

const CATEGORY_LABEL: Record<ChecklistItemDef['category'], string> = {
  gemeente: 'Gemeente (PIP · PVT · MAP)',
  exam: 'Examens (DUO)',
  admin: 'Administratie',
}
const ORDER: ChecklistItemDef['category'][] = ['gemeente', 'exam', 'admin']

export function Checklist() {
  const { activeId } = useActiveProfile()
  const defs = useLiveQuery(() => db.checklistDefs.toArray(), [], [])
  const states = useLiveQuery(
    () => db.checklistState.where('profileId').equals(activeId).toArray(),
    [activeId],
    [],
  )

  const doneSet = useMemo(
    () => new Set((states ?? []).filter((s) => s.done).map((s) => s.itemId)),
    [states],
  )

  const grouped = useMemo(() => {
    const map = new Map<string, ChecklistItemDef[]>()
    for (const d of defs ?? []) {
      const arr = map.get(d.category) ?? []
      arr.push(d)
      map.set(d.category, arr)
    }
    return map
  }, [defs])

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold text-slate-900">Checklist</h1>
      <p className="text-sm text-slate-500">
        Taalexamens zijn niet alles: regel ook je gemeente-onderdelen (PVT &amp; MAP) en
        administratie op tijd.
      </p>
      {ORDER.filter((c) => grouped.has(c)).map((cat) => {
        const items = grouped.get(cat) ?? []
        return (
          <Panel key={cat} className="divide-y divide-slate-100">
            <div className="flex items-center justify-between px-4 py-3">
              <h2 className="font-bold text-slate-900">{CATEGORY_LABEL[cat]}</h2>
              <Badge>
                {items.filter((d) => doneSet.has(d.id)).length}/{items.length}
              </Badge>
            </div>
            {items.map((d) => {
              const done = doneSet.has(d.id)
              return (
                <label key={d.id} className="flex cursor-pointer items-start gap-3 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={(e) => setChecklist(activeId, d.id, e.target.checked)}
                    className="mt-0.5 size-5 shrink-0 accent-yellow-500"
                  />
                  <span className="flex-1">
                    <span
                      className={
                        done ? 'text-sm text-slate-400 line-through' : 'text-sm text-slate-800'
                      }
                    >
                      {d.label}
                    </span>
                    {d.note && <span className="mt-0.5 block text-xs text-slate-400">{d.note}</span>}
                  </span>
                </label>
              )
            })}
          </Panel>
        )
      })}
      <VoiceCard />

      <TextSizeCard />

      <BackupCard />

      {(defs ?? []).length === 0 && (
        <p className="text-center text-sm text-slate-400">Nog geen checklist-items.</p>
      )}
    </div>
  )
}
