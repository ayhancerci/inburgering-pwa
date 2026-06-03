import { fsrs, generatorParameters, createEmptyCard, Rating } from 'ts-fsrs'
import type { Card as FsrsCard, Grade } from 'ts-fsrs'

// FSRS scheduler (the algorithm behind modern Anki). enable_fuzz spreads due
// dates slightly so large decks don't all come due on the same day.
const f = fsrs(generatorParameters({ enable_fuzz: true }))

export function newFsrsCard(now: Date = new Date()): FsrsCard {
  return createEmptyCard(now)
}

export function review(card: FsrsCard, rating: Grade, now: Date = new Date()) {
  return f.next(card, now, rating)
}

export { Rating }
export type { FsrsCard, Grade }
