import { play, type Voice } from '../lib/audio'
import { cx } from './ui'

/** A small 🔊 button that plays the natural-voice MP3 for the given Dutch text
 *  (falling back to browser speech if no clip exists yet). Pass `voice` to choose
 *  the male/female voice (used for the two speakers in a dialogue). */
export function SpeakButton({
  text,
  voice,
  className,
}: {
  text: string
  voice?: Voice
  className?: string
}) {
  return (
    <button
      type="button"
      aria-label="Spreek uit"
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        play(text, voice)
      }}
      className={cx(
        'inline-grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 text-sm text-slate-500 transition hover:bg-yellow-200 active:scale-95',
        className,
      )}
    >
      🔊
    </button>
  )
}
