import type { ReactNode } from 'react'
import { Button } from '../../components/ui'

function Row({ nl, en }: { nl: string; en: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-slate-100 py-1.5 last:border-0">
      <span className="font-semibold text-slate-800">{nl}</span>
      <span className="text-right text-sm text-slate-500">{en}</span>
    </div>
  )
}

function Section({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  return (
    <section className="space-y-1.5">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <span className="text-base">{icon}</span>
        {title}
      </h3>
      <div className="text-sm leading-relaxed text-slate-600">{children}</div>
    </section>
  )
}

export function Guide({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-yellow-400 px-5 py-4">
          <h2 className="text-lg font-extrabold text-slate-900">How to use this app</h2>
          <button onClick={onClose} aria-label="Close" className="text-xl text-slate-700">
            ✕
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-5 py-5">
          <p className="text-sm leading-relaxed text-slate-600">
            This is your companion for the Dutch <strong>A2 inburgering</strong> exams (B1 is an
            optional next step later). The app is in Dutch on purpose — it helps you get used to the
            language. This guide is your English key; reopen it anytime with the{' '}
            <strong>“?”</strong> button at the top.
          </p>

          <Section icon="👥" title="Two profiles (top-right)">
            Switch between the two of you. Each person keeps their own progress — flashcards, quiz
            scores and checked-off tasks. Tap your name before you start.
          </Section>

          <Section icon="🗓️" title="Plan — your weekly schedule">
            Your week-by-week study plan. Tick each task as you finish it; the bars show your
            progress and the days left until the exam.
          </Section>

          <Section icon="📚" title="Cursus — your book, explained in English">
            All 20 LINK chapters. Tap any chapter to read in English what it's about, see its 4
            lessons (taken), and jump straight to that chapter's words and quiz.
          </Section>

          <Section icon="🃏" title="Kaarten — flashcards (do these daily!)">
            Vocabulary and KNM facts. Read the Dutch side, tap <strong>Toon antwoord</strong> (show
            answer), then rate yourself: <strong>Opnieuw / Moeilijk / Goed / Makkelijk</strong>{' '}
            (Again / Hard / Good / Easy). The app brings each card back at the best moment. Even 10
            minutes a day makes the biggest difference.
          </Section>

          <Section icon="✍️" title="Oefenen — practice quizzes + resources">
            A quiz for every chapter (grammar &amp; vocabulary), plus a <strong>Bronnen</strong>{' '}
            list of free websites, YouTube videos and podcasts to learn more.
          </Section>

          <Section icon="✅" title="Checklist — the official steps">
            Register with your gemeente (PIP, PVT) and book your DUO exams. Your labour-market
            module (ONA / MAP) is already marked as exempt.
          </Section>

          <Section icon="📅" title="A simple daily routine">
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Every day: 10–20 min of <strong>Kaarten</strong>.
              </li>
              <li>
                A few times a week: your <strong>Plan</strong> tasks (LINK book + a chapter quiz).
              </li>
              <li>Weekend: one DUO practice exam + speak Dutch together.</li>
            </ul>
          </Section>

          <Section icon="📖" title="Dutch words you'll see">
            <div className="mt-1 rounded-xl bg-slate-50 px-3 py-1">
              <Row nl="Plan" en="Plan / schedule" />
              <Row nl="Cursus" en="Course / chapters" />
              <Row nl="Kaarten" en="Cards (flashcards)" />
              <Row nl="Oefenen" en="Practice (quizzes)" />
              <Row nl="Bronnen" en="Resources / links" />
              <Row nl="Taken" en="Tasks / lessons" />
              <Row nl="Toon antwoord" en="Show answer" />
              <Row nl="Opnieuw / Moeilijk" en="Again / Hard" />
              <Row nl="Goed / Makkelijk" en="Good / Easy" />
              <Row nl="vrijgesteld" en="exempted" />
            </div>
          </Section>

          <Section icon="📱" title="Install on your phone">
            Open the app's web address in Safari (iPhone) or Chrome (Android), then{' '}
            <strong>Share → Add to Home Screen</strong>. It then opens like a normal app and works
            offline.
          </Section>
        </div>

        <div className="border-t border-slate-100 p-4">
          <Button className="w-full" onClick={onClose}>
            Got it!
          </Button>
        </div>
      </div>
    </div>
  )
}
