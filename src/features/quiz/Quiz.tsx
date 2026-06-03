import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/database'
import { useActiveProfile } from '../../store/profile'
import { saveQuizAttempt } from '../../db/repo'
import { Panel, Button, ProgressBar, Badge, cx } from '../../components/ui'
import type { Question } from '../../content/schemas'

type Phase = 'select' | 'run' | 'done'
type Answer = string | string[]

function norm(s: string): string {
  return s.trim().toLowerCase()
}

function clozeSegments(prompt: string): string[] {
  return prompt.split(/\{\{\s*\d+\s*\}\}/)
}

function blanksCount(q: Question): number {
  if (Array.isArray(q.answer)) return q.answer.length
  if (q.format === 'cloze') return Math.max(clozeSegments(q.prompt).length - 1, 1)
  return 1
}

function isCorrect(q: Question, given: Answer | undefined): boolean {
  if (given == null) return false
  if (Array.isArray(q.answer)) {
    const g = Array.isArray(given) ? given : [given]
    return q.answer.length === g.length && q.answer.every((a, i) => norm(a) === norm(g[i] ?? ''))
  }
  const g = Array.isArray(given) ? given[0] ?? '' : given
  return norm(q.answer) === norm(g)
}

function answerToText(a: Answer | undefined): string {
  if (a == null) return '—'
  return Array.isArray(a) ? a.join(', ') : a || '—'
}

function correctText(q: Question): string {
  return Array.isArray(q.answer) ? q.answer.join(', ') : q.answer
}

function QuestionInput({
  q,
  value,
  onChange,
}: {
  q: Question
  value: Answer | undefined
  onChange: (v: Answer) => void
}) {
  if (q.format === 'mcq') {
    return (
      <div className="space-y-2">
        {(q.options ?? []).map((opt) => {
          const selected = value === opt
          return (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className={cx(
                'block w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition',
                selected
                  ? 'border-yellow-400 bg-yellow-50 text-slate-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
              )}
            >
              {opt}
            </button>
          )
        })}
      </div>
    )
  }

  const n = blanksCount(q)
  const arr = Array.isArray(value) ? value : Array<string>(n).fill('')
  const setAt = (i: number, v: string) => {
    const copy = [...arr]
    copy[i] = v
    onChange(copy)
  }

  if (q.format === 'cloze') {
    const segs = clozeSegments(q.prompt)
    return (
      <p className="text-base leading-relaxed text-slate-800">
        {segs.map((seg, i) => (
          <span key={i}>
            {seg}
            {i < segs.length - 1 && (
              <input
                value={arr[i] ?? ''}
                onChange={(e) => setAt(i, e.target.value)}
                className="mx-1 w-28 rounded-md border-b-2 border-yellow-400 bg-yellow-50 px-2 py-0.5 text-center text-sm outline-none"
                autoCapitalize="off"
                autoCorrect="off"
              />
            )}
          </span>
        ))}
      </p>
    )
  }

  // fill_blank
  return (
    <div className="space-y-2">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          {n > 1 && <span className="w-5 text-sm text-slate-400">{i + 1}.</span>}
          <input
            value={arr[i] ?? ''}
            onChange={(e) => setAt(i, e.target.value)}
            placeholder="typ je antwoord"
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-yellow-400"
            autoCapitalize="off"
            autoCorrect="off"
          />
        </div>
      ))}
    </div>
  )
}

export function Quiz() {
  const { activeId } = useActiveProfile()
  const quizzes = useLiveQuery(() => db.quizzes.toArray(), [], [])

  const [phase, setPhase] = useState<Phase>('select')
  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [startedAt, setStartedAt] = useState('')

  const start = async (quizId: string, quizTitle: string) => {
    const qs = await db.questions.where('quizId').equals(quizId).toArray()
    setQuestions(qs)
    setTitle(quizTitle)
    setIdx(0)
    setAnswers({})
    setStartedAt(new Date().toISOString())
    setPhase(qs.length ? 'run' : 'select')
  }

  const finish = async (finalAnswers: Record<string, Answer>) => {
    const items = questions.map((q) => ({
      questionId: q.id,
      given: finalAnswers[q.id] ?? '',
      correct: isCorrect(q, finalAnswers[q.id]),
    }))
    const correct = items.filter((i) => i.correct).length
    const scorePct = items.length ? (correct / items.length) * 100 : 0
    await saveQuizAttempt({
      profileId: activeId,
      quizId: questions[0]?.quizId,
      startedAt: startedAt || new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      items,
      scorePct,
    })
    setPhase('done')
  }

  if (phase === 'select') {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-extrabold text-slate-900">Oefenen</h1>
        <Panel className="divide-y divide-slate-100">
          {(quizzes ?? []).map((qz) => (
            <button
              key={qz.id}
              onClick={() => start(qz.id, qz.title)}
              className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50"
            >
              <span>
                <span className="block text-sm font-semibold text-slate-800">{qz.title}</span>
                <span className="text-xs text-slate-400">{qz.questionIds.length} vragen</span>
              </span>
              {qz.skill && <Badge tone="blue">{qz.skill}</Badge>}
            </button>
          ))}
          {(quizzes ?? []).length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-slate-400">Nog geen oefeningen.</p>
          )}
        </Panel>
      </div>
    )
  }

  if (phase === 'done') {
    const items = questions.map((q) => ({ q, given: answers[q.id], correct: isCorrect(q, answers[q.id]) }))
    const correct = items.filter((i) => i.correct).length
    const pct = items.length ? Math.round((correct / items.length) * 100) : 0
    return (
      <div className="space-y-4">
        <Panel className="p-6 text-center">
          <p className="text-5xl font-black text-slate-900">{pct}%</p>
          <p className="mt-1 text-sm text-slate-500">
            {correct}/{items.length} goed — {title}
          </p>
        </Panel>
        <div className="space-y-2">
          {items.map(({ q, given, correct: ok }) => (
            <Panel key={q.id} className="p-4">
              <div className="flex items-start gap-2">
                <span>{ok ? '✅' : '❌'}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">{q.prompt}</p>
                  {!ok && (
                    <p className="mt-1 text-xs text-slate-500">
                      Jouw antwoord: <span className="text-rose-600">{answerToText(given)}</span>
                      <br />
                      Goed: <span className="font-semibold text-emerald-700">{correctText(q)}</span>
                    </p>
                  )}
                  {q.explanation && <p className="mt-1 text-xs italic text-slate-400">{q.explanation}</p>}
                </div>
              </div>
            </Panel>
          ))}
        </div>
        <Button className="w-full" onClick={() => setPhase('select')}>
          Terug naar oefeningen
        </Button>
      </div>
    )
  }

  // run
  const q = questions[idx]
  const progress = questions.length ? (idx / questions.length) * 100 : 0
  const isLast = idx === questions.length - 1
  const setAnswer = (v: Answer) => setAnswers((a) => ({ ...a, [q.id]: v }))

  return (
    <div className="flex min-h-[60vh] flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setPhase('select')} className="text-sm text-slate-400">
          ✕
        </button>
        <div className="flex-1">
          <ProgressBar value={progress} />
        </div>
        <span className="text-xs font-semibold text-slate-400">
          {idx + 1}/{questions.length}
        </span>
      </div>

      <Panel className="flex-1 space-y-4 p-5">
        {q.format !== 'cloze' && <p className="text-base font-semibold text-slate-900">{q.prompt}</p>}
        <QuestionInput q={q} value={answers[q.id]} onChange={setAnswer} />
      </Panel>

      <Button
        className="w-full"
        onClick={() => {
          if (isLast) {
            void finish(answers)
          } else {
            setIdx((i) => i + 1)
          }
        }}
      >
        {isLast ? 'Klaar — bekijk resultaat' : 'Volgende →'}
      </Button>
    </div>
  )
}
