export function localISODate(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Consecutive days with activity, ending today or yesterday (0 if neither). */
export function currentStreak(isoDates: Iterable<string>): number {
  const set = new Set(isoDates)
  if (set.size === 0) return 0
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  let cursor: Date | null = null
  if (set.has(localISODate(today))) cursor = new Date(today)
  else if (set.has(localISODate(yesterday))) cursor = yesterday
  if (!cursor) return 0

  let streak = 0
  while (set.has(localISODate(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
