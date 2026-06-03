import Dexie from 'dexie'
import { db } from '../db/database'
import type { Card } from '../content/schemas'
import type { CardState } from '../types'

export interface QueueItem {
  card: Card
  state?: CardState
}

const NEW_LIMIT = 15

/** Build a review session: cards already due first, then a capped batch of new cards. */
export async function buildQueue(
  profileId: string,
  opts: { deckId?: string; newLimit?: number } = {},
): Promise<QueueItem[]> {
  const { deckId, newLimit = NEW_LIMIT } = opts
  const now = new Date()

  let dueStates = await db.cardStates
    .where('[profileId+due]')
    .between([profileId, Dexie.minKey], [profileId, now], true, true)
    .toArray()
  if (deckId) dueStates = dueStates.filter((s) => s.deckId === deckId)

  const dueItems: QueueItem[] = []
  for (const st of dueStates) {
    const card = await db.cards.get(st.cardId)
    if (card) dueItems.push({ card, state: st })
  }

  const states = await db.cardStates.where('profileId').equals(profileId).toArray()
  const seen = new Set(states.map((s) => s.cardId))
  const pool = deckId
    ? await db.cards.where('deckId').equals(deckId).toArray()
    : await db.cards.toArray()
  const newItems: QueueItem[] = pool
    .filter((c) => !seen.has(c.id))
    .slice(0, newLimit)
    .map((c) => ({ card: c }))

  return [...dueItems, ...newItems]
}

/** Approximate "to review today" count for dashboard badges. */
export async function dueCount(profileId: string): Promise<number> {
  const now = new Date()
  const due = await db.cardStates
    .where('[profileId+due]')
    .between([profileId, Dexie.minKey], [profileId, now], true, true)
    .count()
  const statesCount = await db.cardStates.where('profileId').equals(profileId).count()
  const totalCards = await db.cards.count()
  const newAvailable = Math.max(0, totalCards - statesCount)
  return due + Math.min(newAvailable, NEW_LIMIT)
}
