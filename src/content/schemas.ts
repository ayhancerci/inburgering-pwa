import { z } from 'zod'

/* ---------- Content schemas (validated at load time) ---------- */

export const deckSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(['vocab', 'knm']),
  themeId: z.string().optional(),
  lang: z.enum(['nl-en', 'nl-nl']),
  tags: z.array(z.string()).optional(),
})

export const cardSchema = z.object({
  id: z.string(),
  deckId: z.string(),
  front: z.string(),
  back: z.string(),
  examples: z.array(z.string()).optional(),
  hints: z.array(z.string()).optional(),
  audioUrl: z.string().optional(),
})

export const deckFileSchema = z.object({
  deck: deckSchema,
  cards: z.array(cardSchema),
})

export const skillSchema = z.enum([
  'reading',
  'listening',
  'writing',
  'speaking',
  'vocab',
  'grammar',
  'knm',
])

export const questionSchema = z.object({
  id: z.string(),
  quizId: z.string().optional(), // attached during load
  themeId: z.string().optional(),
  skill: skillSchema,
  format: z.enum(['mcq', 'fill_blank', 'cloze']),
  prompt: z.string(),
  options: z.array(z.string()).optional(),
  answer: z.union([z.string(), z.array(z.string())]),
  explanation: z.string().optional(),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
})

export const quizFileSchema = z.object({
  id: z.string(),
  title: z.string(),
  skill: skillSchema.optional(),
  questions: z.array(questionSchema),
})

export const planTaskSchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: z.enum(['book', 'flashcards', 'quiz', 'mock', 'duo_link', 'knm', 'admin']),
  ref: z.string().optional(),
  estMinutes: z.number().optional(),
  assignee: z.enum(['both', 'him', 'her']).optional(),
})

export const planWeekSchema = z.object({
  id: z.string(),
  weekNumber: z.number(),
  theme: z.string().optional(),
  dateLabel: z.string().optional(),
  tasks: z.array(planTaskSchema),
})

export const planFileSchema = z.object({
  meta: z.object({
    startDate: z.string(), // ISO date (Monday of week 1)
    examDate: z.string().optional(),
  }),
  weeks: z.array(planWeekSchema),
})

export const checklistItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  category: z.enum(['gemeente', 'exam', 'admin']),
  note: z.string().optional(),
})

export const checklistFileSchema = z.object({
  items: z.array(checklistItemSchema),
})

/* ---------- Inferred content types ---------- */

export type Deck = z.infer<typeof deckSchema>
export type Card = z.infer<typeof cardSchema>
export type Skill = z.infer<typeof skillSchema>
export type Question = z.infer<typeof questionSchema>
export type PlanTask = z.infer<typeof planTaskSchema>
export type PlanWeek = z.infer<typeof planWeekSchema>
export type PlanMeta = z.infer<typeof planFileSchema>['meta']
export type ChecklistItemDef = z.infer<typeof checklistItemSchema>

/* ---------- Curriculum (themes + tasks with English tips) ---------- */

export const themeTaskSchema = z.object({
  n: z.number(),
  titleNl: z.string(),
  tip: z.string(),
})

export const themeSchema = z.object({
  id: z.string(),
  number: z.number(),
  titleNl: z.string(),
  titleEn: z.string(),
  page: z.number().optional(),
  deckId: z.string().optional(),
  quizId: z.string().optional(),
  tip: z.string(),
  tasks: z.array(themeTaskSchema),
})

export const curriculumFileSchema = z.object({
  themes: z.array(themeSchema),
})

/* ---------- External learning resources ---------- */

export const resourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  type: z.enum(['practice', 'video', 'reading', 'listening', 'grammar', 'podcast', 'knm', 'vocab']),
  skill: skillSchema.optional(),
  level: z.enum(['A1', 'A2', 'B1']).optional(),
  description: z.string().optional(),
  free: z.boolean().optional(),
})

export const resourceFileSchema = z.object({
  resources: z.array(resourceSchema),
})

export type ThemeTask = z.infer<typeof themeTaskSchema>
export type Theme = z.infer<typeof themeSchema>
export type Resource = z.infer<typeof resourceSchema>

/* ---------- Exams (per-component metadata; dates are per-profile state) ---------- */

export const examSchema = z.object({
  id: z.string(),
  titleNl: z.string(),
  titleEn: z.string(),
  durationMin: z.number(),
  officialUrl: z.string(),
  mockQuizId: z.string().optional(),
  info: z.string().optional(),
})

export const examsFileSchema = z.object({
  exams: z.array(examSchema),
})

export type Exam = z.infer<typeof examSchema>

/* ---------- Detailed lessons (book-style content per chapter) ---------- */

export const biTextSchema = z.object({ nl: z.string(), en: z.string() })

export const grammarPointSchema = z.object({
  title: z.string(),
  explanation: z.string(),
  examples: z.array(biTextSchema).optional(),
  tip: z.string().optional(),
})

export const dialogueLineSchema = z.object({
  speaker: z.string(),
  nl: z.string(),
  en: z.string(),
})

export const lessonSchema = z.object({
  themeId: z.string(),
  intro: z.string(),
  grammar: z.array(grammarPointSchema),
  phrases: z.array(biTextSchema),
  dialogue: z.object({
    title: z.string().optional(),
    lines: z.array(dialogueLineSchema),
  }),
  writing: z.object({
    prompt: z.string(),
    tips: z.array(z.string()),
    model: z.string().optional(),
  }),
})

export type Lesson = z.infer<typeof lessonSchema>
