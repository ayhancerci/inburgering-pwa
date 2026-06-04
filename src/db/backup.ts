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

/** Restore progress from a backup file (merges/overwrites by primary key). */
export async function importData(json: string): Promise<{ imported: number }> {
  const parsed = JSON.parse(json) as BackupPayload
  const data = parsed?.data ?? {}
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
