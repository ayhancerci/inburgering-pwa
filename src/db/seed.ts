import { db } from './database'
import { loadContent } from '../content'

let seedPromise: Promise<void> | null = null

async function doSeed(): Promise<void> {
  const c = loadContent()
  await db.transaction(
    'rw',
    [db.decks, db.cards, db.questions, db.quizzes, db.planWeeks, db.checklistDefs, db.profiles],
    async () => {
      // Content upserts are idempotent and never touch per-profile state.
      await db.decks.bulkPut(c.decks)
      await db.cards.bulkPut(c.cards)
      await db.questions.bulkPut(c.questions)
      await db.quizzes.bulkPut(c.quizzes)
      await db.planWeeks.bulkPut(c.planWeeks)
      await db.checklistDefs.bulkPut(c.checklistDefs)

      if ((await db.profiles.count()) === 0) {
        await db.profiles.bulkAdd([
          { id: 'him', displayName: 'Ik' },
          { id: 'her', displayName: 'Partner' },
        ])
      }
    },
  )
}

/** Single-flight so React 18/19 StrictMode double-invocation can't double-seed. */
export function seed(): Promise<void> {
  if (!seedPromise) seedPromise = doSeed()
  return seedPromise
}
