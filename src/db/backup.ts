import { db } from './database'

// Only the per-user state tables — content (decks, lessons, etc.) is reseeded from the app.
const USER_TABLES = [
  'profiles',
  'cardStates',
  'reviewLogs',
  'quizAttempts',
  'planProgress',
  'checklistState',
  'examDates',
] as const

export interface BackupPayload {
  app: string
  version: number
  exportedAt: string
  data: Record<string, unknown[]>
}

/** Serialize all of the user's progress into a downloadable JSON blob. */
export async function exportData(): Promise<Blob> {
  const data: Record<string, unknown[]> = {}
  for (const t of USER_TABLES) {
    data[t] = await db.table(t).toArray()
  }
  const payload: BackupPayload = {
    app: 'inburgering',
    version: 2,
    exportedAt: new Date().toISOString(),
    data,
  }
  return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
}

// JSON turns Date objects into strings. Card due dates must be real Dates again, because
// the review queue range-queries the [profileId+due] index with Date keys and IndexedDB
// sorts every Date before every string: a card with a string due date never comes due.
function toDate(v: unknown): unknown {
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? v : d
  }
  return v
}

function reviveCardState(row: unknown): unknown {
  if (!row || typeof row !== 'object') return row
  const out: Record<string, unknown> = { ...(row as Record<string, unknown>) }
  out.due = toDate(out.due)
  if (out.fsrs && typeof out.fsrs === 'object') {
    const f: Record<string, unknown> = { ...(out.fsrs as Record<string, unknown>) }
    f.due = toDate(f.due)
    if (f.last_review != null) f.last_review = toDate(f.last_review)
    out.fsrs = f
  }
  return out
}

/** Restore progress from a backup file (merges/overwrites by primary key). */
export async function importData(json: string): Promise<{ imported: number }> {
  const parsed = JSON.parse(json) as BackupPayload
  if (!parsed || parsed.app !== 'inburgering' || !parsed.data || typeof parsed.data !== 'object') {
    throw new Error('Dit is geen back-up van deze app.')
  }
  const data: Record<string, unknown[]> = { ...parsed.data }
  if (Array.isArray(data.cardStates)) data.cardStates = data.cardStates.map(reviveCardState)
  let imported = 0
  await db.transaction(
    'rw',
    [
      db.profiles,
      db.cardStates,
      db.reviewLogs,
      db.quizAttempts,
      db.planProgress,
      db.checklistState,
      db.examDates,
    ],
    async () => {
      for (const t of USER_TABLES) {
        const rows = data[t]
        if (Array.isArray(rows) && rows.length > 0) {
          await db.table(t).bulkPut(rows as never[])
          imported += rows.length
        }
      }
    },
  )
  return { imported }
}

/**
 * Repair card states that an earlier restore stored with string dates, so those cards
 * start coming due again. Safe to run on every start: it only touches broken rows.
 */
export async function repairCardDates(): Promise<number> {
  const broken = await db.cardStates
    .filter(
      (s) =>
        !(s.due instanceof Date) ||
        !(s.fsrs?.due instanceof Date) ||
        (s.fsrs?.last_review != null && !(s.fsrs.last_review instanceof Date)),
    )
    .toArray()
  if (broken.length === 0) return 0
  await db.cardStates.bulkPut(broken.map((s) => reviveCardState(s) as typeof s))
  return broken.length
}

/** Ask the browser to keep our data persistent (not evict it). Best-effort. */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (navigator.storage && typeof navigator.storage.persist === 'function') {
      return await navigator.storage.persist()
    }
  } catch {
    // ignore — best effort
  }
  return false
}
