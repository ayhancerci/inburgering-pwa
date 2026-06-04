import manifest from '../content/audio-manifest.json'
import { speak, speakSequence, stopSpeaking } from './tts'

// text -> mp3 filename (in /public/audio). Populated by scripts/generate-audio.mjs.
const MAP = manifest as Record<string, string>

let current: HTMLAudioElement | null = null

export function hasClip(text: string): boolean {
  return Boolean(MAP[text])
}

function stopCurrent(): void {
  if (current) {
    current.pause()
    current = null
  }
}

/** Play the pre-generated natural-voice MP3 for this text; fall back to browser TTS. */
export function play(text: string): void {
  const file = MAP[text]
  if (!file) {
    speak(text)
    return
  }
  stopCurrent()
  stopSpeaking()
  const audio = new Audio(`/audio/${file}`)
  current = audio
  void audio.play().catch(() => speak(text))
}

/** Play several clips in order (e.g., a whole dialogue); falls back to TTS if any clip is missing. */
export async function playSequence(texts: string[]): Promise<void> {
  if (!texts.every(hasClip)) {
    speakSequence(texts)
    return
  }
  stopCurrent()
  stopSpeaking()
  for (const t of texts) {
    const file = MAP[t]
    await new Promise<void>((resolve) => {
      const audio = new Audio(`/audio/${file}`)
      current = audio
      audio.onended = () => resolve()
      audio.onerror = () => resolve()
      void audio.play().catch(() => resolve())
    })
  }
}
