import { useEffect, useRef, useState } from 'react'
import { db } from '../../db/database'
import { useActiveProfile } from '../../store/profile'
import { saveQuizAttempt } from '../../db/repo'
import { Panel, Button, ProgressBar, cx } from '../../components/ui'
import { QuestionInput, isCorrect, answerToText, correctText, type Answer } from '../quiz/Quiz'
import type { Question } from '../../content/schemas'

function fmt(totalSec: number): string {
  const s = Math.max(0, totalSec)
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
}

export function Mock({
  quizId,
  durationMin,
  title,
  onExit,
}: {
  quizId: string
  durationMin: number
  title: string
  onExit: () => void
}) {
  const { activeId } = useActiveProfile()
  const [questions, setQuestions] = useState<Question[] | null>(null)
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [secondsLeft, setSecondsLeft] = useState(durationMin * 60)
  const [phase, setPhase] = useState<'run' | 'done'>('run')
  const startedAt = useRef(new Date().toISOString())
  const saved = useRef(false)

  useEffect(() => {
    db.questions.where('quizId').equals(quizId).toArray().then(setQuestions)
  }, [quizId])

  // countdown
  useEffect(() => {
    if (phase !== 'run' || !questions) return
    if (secondsLeft <= 0) {
      setPhase('done')
      return
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [secondsLeft, phase, questions])

  // save the attempt once, when finished
  useEffect(() => {
    if (phase !== 'done' || !questions || saved.current) return
    saved.current = true
    const items = questions.map((q) => ({
      questionId: q.id,
      given: answers[q.id] ?? '',
      correct: isCorrect(q, answers[q.id]),
    }))
    const correct = items.filter((i) => i.correct).length
    void saveQuizAttempt({
      profileId: activeId,
      quizId,
      startedAt: startedAt.current,
      finishedAt: new Date().toISOString(),
      items,
      scorePct: items.length ? (correct / items.length) * 100 : 0,
    })
  }, [phase, questions, answers, activeId, quizId])

  if (!questions) {
    return <p className="py-10 text-center text-sm text-slate-400">Laden…</p>
  }

  if (phase === 'done') {
    const items = questions.map((q) => ({
      q,
      given: answers[q.id],
      correct: isCorrect(q, answers[q.id]),
    }))
    const correct = items.filter((i) => i.correct).length
    const pct = items.length ? Math.round((correct / items.length) * 100) : 0
    const pass = pct >= 60
    return (
      <div className="space-y-4">
        <Panel className="p-6 text-center">
          <p className="text-5xl font-black text-slate-900">{pct}%</p>
          <p className="mt-1 text-sm text-slate-500">
            {correct}/{items.length} goed — {title}
          </p>
          <p className={cx('mt-2 text-sm font-bold', pass ? 'text-emerald-600' : 'text-rose-600')}>
            {pass ? '✅ Voldoende (oefennorm ~60%)' : 'Nog oefenen — streef naar ~60%+'}
          </p>
        </Panel>
        <div className="space-y-2">
          {items.map(({ q, given, correct: ok }) => (
            <Panel key={q.id} className="p-4">
              <div className="flex items-start gap-2">
                <span>{ok ? '✅' : '❌'}</span>
                <div className="flex-1">
                  <p className="whitespace-pre-line text-sm font-medium text-slate-800">{q.prompt}</p>
                  {!ok && (
                    <p className="mt-1 text-xs text-slate-500">
                      Jouw antwoord: <span className="text-rose-600">{answerToText(given)}</span>
                      <br />
                      Goed: <span className="font-semibold text-emerald-700">{correctText(q)}</span>
                    </p>
                  )}
                  {q.explanation && (
                    <p className="mt-1 text-xs italic text-slate-400">{q.explanation}</p>
                  )}
                </div>
              </div>
            </Panel>
          ))}
        </div>
        <Button className="w-full" onClick={onExit}>
          Sluiten
        </Button>
      </div>
    )
  }

  // run
  const q = questions[idx]
  const progress = questions.length ? (idx / questions.length) * 100 : 0
  const isLast = idx === questions.length - 1
  const low = secondsLeft <= 60
  const setAnswer = (v: Answer) => setAnswers((a) => ({ ...a, [q.id]: v }))

  return (
    <div className="flex min-h-[70vh] flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={onExit} className="text-sm text-slate-400">
          ✕
        </button>
        <div className="flex-1">
          <ProgressBar value={progress} />
        </div>
        <span
          className={cx(
            'rounded-lg px-2 py-1 text-sm font-bold tabular-nums',
            low ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700',
          )}
        >
          ⏱ {fmt(secondsLeft)}
        </span>
      </div>

      <p className="text-xs font-semibold text-slate-400">
        Vraag {idx + 1} / {questions.length} — {title}
      </p>

      <Panel className="flex-1 space-y-4 p-5">
        {q.format !== 'cloze' && (
          <p className="whitespace-pre-line text-base font-medium text-slate-900">{q.prompt}</p>
        )}
        <QuestionInput q={q} value={answers[q.id]} onChange={setAnswer} />
      </Panel>

      <div className="flex gap-2">
        {idx > 0 && (
          <Button variant="subtle" onClick={() => setIdx((i) => i - 1)}>
            ←
          </Button>
        )}
        <Button className="flex-1" onClick={() => (isLast ? setPhase('done') : setIdx((i) => i + 1))}>
          {isLast ? 'Inleveren' : 'Volgende →'}
        </Button>
      </div>
    </div>
  )
}
