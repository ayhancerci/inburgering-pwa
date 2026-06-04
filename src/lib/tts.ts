// Browser speech synthesis (free; works offline where the OS has the voice).
// Quality depends on the device's installed Dutch voice, so we pick the best one available
// and fall back gracefully. If the device has no Dutch voice at all, the UI offers guidance.

let voicesCache: SpeechSynthesisVoice[] = []

export function ttsAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

function loadVoices(): void {
  if (!ttsAvailable()) return
  const v = window.speechSynthesis.getVoices()
  if (v.length > 0) voicesCache = v
}

if (ttsAvailable()) {
  loadVoices()
  // Voices populate asynchronously in most browsers.
  window.speechSynthesis.onvoiceschanged = loadVoices
}

// Higher score = better Dutch voice.
function score(v: SpeechSynthesisVoice): number {
  const lang = (v.lang || '').toLowerCase()
  if (!lang.startsWith('nl')) return -1
  const name = (v.name || '').toLowerCase()
  let s = 10
  if (lang === 'nl-nl') s += 5
  if (name.includes('google')) s += 4
  if (name.includes('microsoft')) s += 3
  if (/(xander|claire|ellen|lotte|ruben|colette|daan|femke|frank)/.test(name)) s += 2
  return s
}

export function dutchVoice(): SpeechSynthesisVoice | undefined {
  if (voicesCache.length === 0) loadVoices()
  const nl = voicesCache.filter((v) => (v.lang || '').toLowerCase().startsWith('nl'))
  if (nl.length === 0) return undefined
  return [...nl].sort((a, b) => score(b) - score(a))[0]
}

export function hasDutchVoice(): boolean {
  return dutchVoice() !== undefined
}

export function dutchVoiceName(): string | null {
  return dutchVoice()?.name ?? null
}

function utter(text: string): SpeechSynthesisUtterance {
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'nl-NL'
  const v = dutchVoice()
  if (v) u.voice = v
  u.rate = 0.9 // a touch slower, clearer for learners
  return u
}

/** Speak Dutch text aloud (cancels anything already playing). */
export function speak(text: string): void {
  if (!ttsAvailable() || !text.trim()) return
  const synth = window.speechSynthesis
  synth.cancel()
  synth.speak(utter(text))
}

/** Speak several Dutch lines one after another (e.g., a whole dialogue). */
export function speakSequence(texts: string[]): void {
  if (!ttsAvailable()) return
  const synth = window.speechSynthesis
  synth.cancel()
  for (const t of texts) {
    if (t.trim()) synth.speak(utter(t))
  }
}

export function stopSpeaking(): void {
  if (ttsAvailable()) window.speechSynthesis.cancel()
}
