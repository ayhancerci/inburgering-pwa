import { db } from './database'
import { review, newFsrsCard } from '../srs/scheduler'
import type { Grade, FsrsCard } from '../srs/scheduler'
import type { Card } from '../content/schemas'
import type { QuizAttempt } from '../types'

/** Apply an FSRS rating to a card for a profile; persists state + an append-only log. */
export async function rateCard(
  profileId: string,
  card: Card,
  prev: FsrsCard | undefined,
  rating: Grade,
): Promise<FsrsCard> {
  const base = prev ?? newFsrsCard()
  const { card: next } = review(base, rating)
  const now = new Date().toISOString()
  await db.transaction('rw', db.cardStates, db.reviewLogs, async () => {
    await db.cardStates.put({
      id: `${profileId}:${card.id}`,
      profileId,
      cardId: card.id,
      deckId: card.deckId,
      due: next.due,
      fsrs: next,
      reps: next.reps,
      updatedAt: now,
    })
    await db.reviewLogs.add({ profileId, cardId: card.id, rating, reviewedAt: now })
  })
  return next
}

export async function setPlanTask(profileId: string, taskId: string, done: boolean): Promise<void> {
  await db.planProgress.put({
    id: `${profileId}:${taskId}`,
    profileId,
    taskId,
    status: done ? 'done' : 'todo',
    completedAt: done ? new Date().toISOString() : undefined,
  })
}

export async function setChecklist(
  profileId: string,
  itemId: string,
  done: boolean,
  note?: string,
): Promise<void> {
  await db.checklistState.put({ id: `${profileId}:${itemId}`, profileId, itemId, done, note })
}

export async function saveQuizAttempt(attempt: QuizAttempt): Promise<number> {
  return db.quizAttempts.add(attempt)
}

export async function renameProfile(id: string, displayName: string): Promise<void> {
  await db.profiles.update(id, { displayName })
}
