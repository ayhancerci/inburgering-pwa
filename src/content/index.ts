import {
  deckFileSchema,
  quizFileSchema,
  planFileSchema,
  checklistFileSchema,
  curriculumFileSchema,
  resourceFileSchema,
  examsFileSchema,
  lessonSchema,
  type Deck,
  type Card,
  type Question,
  type PlanWeek,
  type PlanMeta,
  type ChecklistItemDef,
  type Theme,
  type Resource,
  type Exam,
  type Lesson,
} from './schemas'

export interface QuizDef {
  id: string
  title: string
  skill?: string
  questionIds: string[]
}

export interface LoadedContent {
  decks: Deck[]
  cards: Card[]
  questions: Question[]
  quizzes: QuizDef[]
  planWeeks: PlanWeek[]
  planMeta: PlanMeta
  checklistDefs: ChecklistItemDef[]
  themes: Theme[]
  resources: Resource[]
  exams: Exam[]
  lessons: Lesson[]
}

// Vite resolves these globs at build time; values are the parsed JSON objects.
const deckFiles = import.meta.glob('/content/decks/*.json', { eager: true, import: 'default' })
const quizFiles = import.meta.glob('/content/quizzes/*.json', { eager: true, import: 'default' })
const mockFiles = import.meta.glob('/content/mocks/*.json', { eager: true, import: 'default' })
const lessonFiles = import.meta.glob('/content/lessons/*.json', { eager: true, import: 'default' })
const planFiles = import.meta.glob('/content/plan.json', { eager: true, import: 'default' })
const checklistFiles = import.meta.glob('/content/checklist.json', { eager: true, import: 'default' })
const curriculumFiles = import.meta.glob('/content/curriculum.json', { eager: true, import: 'default' })
const resourceFiles = import.meta.glob('/content/resources.json', { eager: true, import: 'default' })
const examFiles = import.meta.glob('/content/exams.json', { eager: true, import: 'default' })

const DEFAULT_META: PlanMeta = { startDate: '2026-06-02' }

let cache: LoadedContent | null = null

export function loadContent(): LoadedContent {
  if (cache) return cache

  const decks: Deck[] = []
  const cards: Card[] = []
  const questions: Question[] = []
  const quizzes: QuizDef[] = []

  for (const [path, raw] of Object.entries(deckFiles)) {
    const parsed = deckFileSchema.safeParse(raw)
    if (!parsed.success) {
      console.error(`[content] invalid deck file: ${path}`, parsed.error.issues)
      continue
    }
    decks.push(parsed.data.deck)
    cards.push(...parsed.data.cards)
  }

  for (const [path, raw] of Object.entries(quizFiles)) {
    const parsed = quizFileSchema.safeParse(raw)
    if (!parsed.success) {
      console.error(`[content] invalid quiz file: ${path}`, parsed.error.issues)
      continue
    }
    const { id, title, skill, questions: qs } = parsed.data
    quizzes.push({ id, title, skill, questionIds: qs.map((q) => q.id) })
    for (const q of qs) questions.push({ ...q, quizId: id })
  }

  // Mock/practice exams: questions join the pool (queried by quizId) but are NOT
  // added to `quizzes`, so they don't appear in the normal Oefenen list.
  for (const [path, raw] of Object.entries(mockFiles)) {
    const parsed = quizFileSchema.safeParse(raw)
    if (!parsed.success) {
      console.error(`[content] invalid mock file: ${path}`, parsed.error.issues)
      continue
    }
    for (const q of parsed.data.questions) questions.push({ ...q, quizId: parsed.data.id })
  }

  const lessons: Lesson[] = []
  for (const [path, raw] of Object.entries(lessonFiles)) {
    const parsed = lessonSchema.safeParse(raw)
    if (!parsed.success) {
      console.error(`[content] invalid lesson file: ${path}`, parsed.error.issues)
      continue
    }
    lessons.push(parsed.data)
  }

  let planWeeks: PlanWeek[] = []
  let planMeta: PlanMeta = DEFAULT_META
  const planRaw = Object.values(planFiles)[0]
  if (planRaw) {
    const parsed = planFileSchema.safeParse(planRaw)
    if (parsed.success) {
      planWeeks = [...parsed.data.weeks].sort((a, b) => a.weekNumber - b.weekNumber)
      planMeta = parsed.data.meta
    } else {
      console.error('[content] invalid plan.json', parsed.error.issues)
    }
  }

  let checklistDefs: ChecklistItemDef[] = []
  const checklistRaw = Object.values(checklistFiles)[0]
  if (checklistRaw) {
    const parsed = checklistFileSchema.safeParse(checklistRaw)
    if (parsed.success) checklistDefs = parsed.data.items
    else console.error('[content] invalid checklist.json', parsed.error.issues)
  }

  let themes: Theme[] = []
  const curriculumRaw = Object.values(curriculumFiles)[0]
  if (curriculumRaw) {
    const parsed = curriculumFileSchema.safeParse(curriculumRaw)
    if (parsed.success) themes = [...parsed.data.themes].sort((a, b) => a.number - b.number)
    else console.error('[content] invalid curriculum.json', parsed.error.issues)
  }

  let resources: Resource[] = []
  const resourcesRaw = Object.values(resourceFiles)[0]
  if (resourcesRaw) {
    const parsed = resourceFileSchema.safeParse(resourcesRaw)
    if (parsed.success) resources = parsed.data.resources
    else console.error('[content] invalid resources.json', parsed.error.issues)
  }

  let exams: Exam[] = []
  const examsRaw = Object.values(examFiles)[0]
  if (examsRaw) {
    const parsed = examsFileSchema.safeParse(examsRaw)
    if (parsed.success) exams = parsed.data.exams
    else console.error('[content] invalid exams.json', parsed.error.issues)
  }

  cache = {
    decks,
    cards,
    questions,
    quizzes,
    planWeeks,
    planMeta,
    checklistDefs,
    themes,
    resources,
    exams,
    lessons,
  }
  return cache
}
