import { speak, ttsAvailable } from '../lib/tts'
import { cx } from './ui'

/** A small 🔊 button that speaks the given Dutch text aloud. Renders nothing if
 *  the device has no speech synthesis. */
export function SpeakButton({ text, className }: { text: string; className?: string }) {
  if (!ttsAvailable()) return null
  return (
    <button
      type="button"
      aria-label="Spreek uit"
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        speak(text)
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
