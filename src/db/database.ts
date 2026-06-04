import Dexie, { type Table } from 'dexie'
import type { Deck, Card, Question, PlanWeek, ChecklistItemDef } from '../content/schemas'
import type { QuizDef } from '../content'
import type {
  Profile,
  CardState,
  ReviewLogEntry,
  QuizAttempt,
  PlanProgress,
  ChecklistState,
  MetaRow,
  ExamDate,
} from '../types'

export class AppDB extends Dexie {
  // content (shared, seeded from JSON)
  decks!: Table<Deck, string>
  cards!: Table<Card, string>
  questions!: Table<Question, string>
  quizzes!: Table<QuizDef, string>
  planWeeks!: Table<PlanWeek, string>
  checklistDefs!: Table<ChecklistItemDef, string>
  // per-profile state (syncs later)
  profiles!: Table<Profile, string>
  cardStates!: Table<CardState, string>
  reviewLogs!: Table<ReviewLogEntry, number>
  quizAttempts!: Table<QuizAttempt, number>
  planProgress!: Table<PlanProgress, string>
  checklistState!: Table<ChecklistState, string>
  examDates!: Table<ExamDate, string>
  meta!: Table<MetaRow, string>

  constructor() {
    super('inburgering')
    this.version(1).stores({
      decks: 'id, type, themeId',
      cards: 'id, deckId',
      questions: 'id, skill, themeId, quizId',
      quizzes: 'id',
      planWeeks: 'id, weekNumber',
      checklistDefs: 'id, category',
      profiles: 'id',
      cardStates: 'id, profileId, cardId, [profileId+due]',
      reviewLogs: '++id, profileId, reviewedAt, [profileId+cardId]',
      quizAttempts: '++id, profileId, quizId',
      planProgress: 'id, profileId, [profileId+taskId]',
      checklistState: 'id, profileId, [profileId+itemId]',
      meta: 'key',
    })
    // v2: per-profile exam dates (set separately for each exam component)
    this.version(2).stores({
      examDates: 'id, profileId, [profileId+component]',
    })
  }
}

export const db = new AppDB()

export { Dexie }
