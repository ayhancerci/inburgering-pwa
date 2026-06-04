// Lightweight wrapper around the browser's built-in speech synthesis (free, offline,
// no API). Picks a Dutch voice when the device has one.

let voicesCache: SpeechSynthesisVoice[] = []

function loadVoices(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  voicesCache = window.speechSynthesis.getVoices()
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices()
  // Voices load asynchronously on most browsers.
  window.speechSynthesis.onvoiceschanged = loadVoices
}

export function ttsAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

function dutchVoice(): SpeechSynthesisVoice | undefined {
  if (voicesCache.length === 0) loadVoices()
  return (
    voicesCache.find((v) => v.lang === 'nl-NL') ??
    voicesCache.find((v) => v.lang?.toLowerCase().startsWith('nl'))
  )
}

/** Speak Dutch text aloud (cancels anything already playing). */
export function speak(text: string): void {
  if (!ttsAvailable() || !text.trim()) return
  const synth = window.speechSynthesis
  synth.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'nl-NL'
  const voice = dutchVoice()
  if (voice) u.voice = voice
  u.rate = 0.95
  synth.speak(u)
}

/** Speak several Dutch lines one after another (e.g., a whole dialogue). */
export function speakSequence(texts: string[]): void {
  if (!ttsAvailable()) return
  const synth = window.speechSynthesis
  synth.cancel()
  const voice = dutchVoice()
  for (const t of texts) {
    if (!t.trim()) continue
    const u = new SpeechSynthesisUtterance(t)
    u.lang = 'nl-NL'
    if (voice) u.voice = voice
    u.rate = 0.95
    synth.speak(u) // utterances queue automatically
  }
}

export function stopSpeaking(): void {
  if (ttsAvailable()) window.speechSynthesis.cancel()
}
