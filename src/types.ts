import type { Card as FsrsCard } from 'ts-fsrs'

/* ---------- Per-profile user state (this is what syncs later) ---------- */

export interface Profile {
  id: string
  displayName: string
  weeklyHoursGoal?: number
  examTargetDate?: string
}

export interface CardState {
  id: string // `${profileId}:${cardId}`
  profileId: string
  cardId: string
  deckId: string
  due: Date // mirror of fsrs.due, indexed for the review queue
  fsrs: FsrsCard
  reps: number
  updatedAt: string
}

export interface ReviewLogEntry {
  id?: number
  profileId: string
  cardId: string
  rating: number
  reviewedAt: string
}

export interface QuizAttempt {
  id?: number
  profileId: string
  quizId?: string
  startedAt: string
  finishedAt?: string
  items: { questionId: string; given: string | string[]; correct: boolean }[]
  scorePct: number
}

export interface PlanProgress {
  id: string // `${profileId}:${taskId}`
  profileId: string
  taskId: string
  status: 'todo' | 'done'
  completedAt?: string
}

export interface ChecklistState {
  id: string // `${profileId}:${itemId}`
  profileId: string
  itemId: string
  done: boolean
  note?: string
}

export interface MetaRow {
  key: string
  value: unknown
}

export interface ExamDate {
  id: string // `${profileId}:${component}`
  profileId: string
  component: string
  date: string // 'YYYY-MM-DD' or '' (unset)
  updatedAt: string
}
