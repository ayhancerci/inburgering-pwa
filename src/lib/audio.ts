import manifestF from '../content/audio-manifest.json'
import manifestM from '../content/audio-manifest-m.json'
import { speak, speakSequence, stopSpeaking } from './tts'

export type Voice = 'f' | 'm'

// text -> mp3 filename (in /public/audio). Populated by scripts/generate-audio.mjs.
// One manifest per voice: female (default, used everywhere) and male (used for the
// "you"/second speaker in dialogues so a conversation sounds like two people).
const MAPS: Record<Voice, Record<string, string>> = {
  f: manifestF as Record<string, string>,
  m: manifestM as Record<string, string>,
}

let current: HTMLAudioElement | null = null

export function hasClip(text: string, voice: Voice = 'f'): boolean {
  return Boolean(MAPS[voice][text])
}

function stopCurrent(): void {
  if (current) {
    current.pause()
    current = null
  }
}

/** Play the pre-generated natural-voice MP3 for this text in the given voice;
 *  fall back to browser TTS (same gender) if no clip exists yet. */
export function play(text: string, voice: Voice = 'f'): void {
  const file = MAPS[voice][text]
  if (!file) {
    speak(text, voice)
    return
  }
  stopCurrent()
  stopSpeaking()
  const audio = new Audio(`/audio/${file}`)
  current = audio
  void audio.play().catch(() => speak(text, voice))
}

export interface Spoken {
  text: string
  voice?: Voice
}

/** Play several clips in order (e.g., a whole dialogue), each in its speaker's voice.
 *  Falls back to browser TTS for the whole sequence if any clip is missing. */
export async function playSequence(items: Spoken[]): Promise<void> {
  if (!items.every((it) => hasClip(it.text, it.voice ?? 'f'))) {
    speakSequence(items.map((it) => ({ text: it.text, voice: it.voice ?? 'f' })))
    return
  }
  stopCurrent()
  stopSpeaking()
  for (const it of items) {
    const file = MAPS[it.voice ?? 'f'][it.text]
    await new Promise<void>((resolve) => {
      const audio = new Audio(`/audio/${file}`)
      current = audio
      audio.onended = () => resolve()
      audio.onerror = () => resolve()
      void audio.play().catch(() => resolve())
    })
  }
}
