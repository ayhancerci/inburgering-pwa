// Browser speech synthesis (free; works offline where the OS has the voice). Used only as a
// fallback when a pre-generated MP3 isn't available. Quality depends on the device's Dutch
// voice; we pick the best one and, when asked, prefer a male vs female voice so the two
// speakers in a dialogue still sound different. If the device has only one Dutch voice, both
// fall back to it.

type Gender = 'f' | 'm'

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

// Name hints to tell male and female Dutch voices apart (best-effort, by voice name).
const MALE = /(xander|ruben|daan|frank|bram|maarten|tom|male|\bman\b)/
const FEMALE = /(claire|ellen|lotte|colette|femke|saskia|fenna|female|\bvrouw\b)/

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

function dutchVoices(): SpeechSynthesisVoice[] {
  if (voicesCache.length === 0) loadVoices()
  return voicesCache
    .filter((v) => (v.lang || '').toLowerCase().startsWith('nl'))
    .sort((a, b) => score(b) - score(a))
}

export function dutchVoice(gender?: Gender): SpeechSynthesisVoice | undefined {
  const nl = dutchVoices()
  if (nl.length === 0) return undefined
  if (gender) {
    const re = gender === 'm' ? MALE : FEMALE
    const match = nl.find((v) => re.test((v.name || '').toLowerCase()))
    if (match) return match
    // No name match: on multi-voice devices use different voices per gender so the two
    // speakers still contrast; otherwise fall through to the single best voice.
    if (nl.length >= 2) return gender === 'm' ? nl[1] : nl[0]
  }
  return nl[0]
}

export function hasDutchVoice(): boolean {
  return dutchVoice() !== undefined
}

export function dutchVoiceName(): string | null {
  return dutchVoice()?.name ?? null
}

function utter(text: string, gender?: Gender): SpeechSynthesisUtterance {
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'nl-NL'
  const v = dutchVoice(gender)
  if (v) u.voice = v
  u.rate = 0.9 // a touch slower, clearer for learners
  return u
}

/** Speak Dutch text aloud (cancels anything already playing). */
export function speak(text: string, gender?: Gender): void {
  if (!ttsAvailable() || !text.trim()) return
  const synth = window.speechSynthesis
  synth.cancel()
  synth.speak(utter(text, gender))
}

/** Speak several Dutch lines one after another, each in its speaker's voice. */
export function speakSequence(items: { text: string; gender?: Gender }[]): void {
  if (!ttsAvailable()) return
  const synth = window.speechSynthesis
  synth.cancel()
  for (const it of items) {
    if (it.text.trim()) synth.speak(utter(it.text, it.gender))
  }
}

export function stopSpeaking(): void {
  if (ttsAvailable()) window.speechSynthesis.cancel()
}
