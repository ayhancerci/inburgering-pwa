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
  audioText: z.string().optional(), // spoken aloud (TTS) for listening items; not shown unless revealed
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
  kind: z.enum([
    'book',
    'flashcards',
    'quiz',
    'mock',
    'duo_link',
    'knm',
    'admin',
    'speaking',
    'listening',
    'writing',
    'review',
  ]),
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
  themeId: z.string().optional(), // tag to a course theme; untagged = general (shown in Oefenen)
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
  voice: z.enum(['f', 'm']).optional(), // which TTS voice; defaults by speaker order if absent
  nl: z.string(),
  en: z.string(),
})

export const lessonSchema = z.object({
  themeId: z.string(),
  intro: z.string(),
  vocab: z.array(biTextSchema).optional(), // key words for this chapter (Kernwoorden)
  grammar: z.array(grammarPointSchema),
  phrases: z.array(biTextSchema),
  sayings: z.array(biTextSchema).optional(), // typical Dutch expressions / proverbs
  dialogue: z.object({
    title: z.string().optional(),
    lines: z.array(dialogueLineSchema),
  }),
  writing: z.object({
    prompt: z.string(),
    tips: z.array(z.string()),
    model: z.string().optional(),
    examples: z.array(z.object({ prompt: z.string(), model: z.string() })).optional(),
  }),
})

export type Lesson = z.infer<typeof lessonSchema>

// A 10–15 minute audio "college" (lecture) per theme: a teacher explains the topic in English,
// using Dutch terms and reading Dutch example sentences aloud. When played, the English narration
// uses an English 'narrator' voice and each example.nl uses a native Dutch voice — so it sounds
// like a real bilingual class.
export const lectureParagraphSchema = z.object({
  heading: z.string().optional(), // short English sub-heading for this part
  text: z.string(), // the teacher's English narration (≈5–8 sentences)
  examples: z.array(biTextSchema).default([]), // Dutch sentences the teacher then says out loud
})

export const lectureSchema = z.object({
  themeId: z.string(),
  titleNl: z.string(),
  titleEn: z.string(),
  intro: z.string().optional(), // one-line English summary of the college
  durationMin: z.number().optional(), // rough spoken length, e.g. 12
  paragraphs: z.array(lectureParagraphSchema),
})

export type LectureParagraph = z.infer<typeof lectureParagraphSchema>
export type Lecture = z.infer<typeof lectureSchema>

/* ---------- Real-life role-play conversations ---------- */

export const roleplayTurnSchema = z.object({
  speaker: z.enum(['A', 'you']), // 'A' = the other person (audio), 'you' = your model line
  voice: z.enum(['f', 'm']).optional(), // override; defaults to f for 'A', m for 'you'
  who: z.string(),
  nl: z.string(),
  en: z.string(),
})

export const roleplaySchema = z.object({
  id: z.string(),
  themeId: z.string().optional(), // the course theme this conversation belongs to
  titleNl: z.string(),
  titleEn: z.string(),
  setting: z.string(),
  scenario: z.string(),
  turns: z.array(roleplayTurnSchema),
})

export const roleplaysFileSchema = z.object({
  roleplays: z.array(roleplaySchema),
})

export type RolePlay = z.infer<typeof roleplaySchema>
export type RolePlayTurn = z.infer<typeof roleplayTurnSchema>

/* ---------- Basics: foundational reference chapters interleaved in the Cursus ---------- */

export const basicsSectionSchema = z.discriminatedUnion('type', [
  // An English rule / explanation block.
  z.object({ type: z.literal('note'), title: z.string().optional(), body: z.string() }),
  // A list of Dutch terms with English glosses; each Dutch term gets a 🔊 button.
  z.object({
    type: z.literal('pairs'),
    title: z.string(),
    note: z.string().optional(),
    items: z.array(z.object({ nl: z.string(), en: z.string() })),
  }),
  // A worked example exam question (MCQ or a model answer), with a reveal.
  z.object({
    type: z.literal('example'),
    q: z.string(),
    qEn: z.string().optional(),
    options: z.array(z.string()).optional(),
    answer: z.string().optional(),
    explanation: z.string().optional(),
  }),
  // Links: external practice exams (url) or the in-app timed practice exam (mock = exam id).
  z.object({
    type: z.literal('links'),
    title: z.string().optional(),
    items: z.array(
      z.object({
        label: z.string(),
        url: z.string().optional(), // external link (opens new tab)
        mock: z.string().optional(), // in-app practice exam id -> /examens?mock=<id>
        route: z.string().optional(), // internal app route, e.g. /schrijven
        note: z.string().optional(),
      }),
    ),
  }),
])

export const basicsChapterSchema = z.object({
  id: z.string(),
  sort: z.number(), // position among the course themes (e.g. 0.5 shows before Thema 1)
  category: z.enum(['basis', 'examen']).default('basis'),
  icon: z.string().optional(),
  titleNl: z.string(),
  titleEn: z.string(),
  intro: z.string(),
  sections: z.array(basicsSectionSchema),
})

export const basicsFileSchema = z.object({ chapters: z.array(basicsChapterSchema) })

export type BasicsSection = z.infer<typeof basicsSectionSchema>
export type BasicsChapter = z.infer<typeof basicsChapterSchema>
