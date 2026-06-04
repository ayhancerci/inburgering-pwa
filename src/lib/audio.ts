import manifest from '../content/audio-manifest.json'
import { speak, speakSequence, stopSpeaking } from './tts'

// Pool of natural Dutch voices. Normal examples (vocabulary, phrases, grammar) get a VARIED
// voice chosen by a stable hash of the text, so the app isn't monotone. In a dialogue every
// named speaker gets their own consistent, gender-appropriate voice.
export const VOICE_GENDER = {
  aoede: 'f',
  kore: 'f',
  leda: 'f',
  charon: 'm',
  orus: 'm',
  puck: 'm',
  narrator: 'f', // English teacher voice for the per-theme "College" lectures (not part of the Dutch pool)
} as const

export type VoiceId = keyof typeof VOICE_GENDER

// Order matters and MUST match scripts/generate-audio.mjs.
export const VARIETY: VoiceId[] = ['aoede', 'kore', 'leda', 'charon', 'orus', 'puck']
export const FEMALE_POOL: VoiceId[] = ['aoede', 'kore', 'leda']
export const MALE_POOL: VoiceId[] = ['charon', 'orus', 'puck']
export const DIALOG_YOU: VoiceId = 'charon' // your own line in a role-play (the learner)
export const NARRATOR: VoiceId = 'narrator' // English narration voice for the per-theme lectures

// FNV-1a (32-bit). Identical in the generator so voices line up.
function hashInt(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** Stable, varied voice for a normal example (same text → same voice, so it stays cached). */
export function variedVoice(text: string): VoiceId {
  return VARIETY[hashInt(text) % VARIETY.length]
}

// Best-effort gender of a speaker label (Dutch first names + role words).
const F_NAMES = new Set([
  'anna', 'fatima', 'sophie', 'sara', 'sanne', 'nadia', 'marit', 'eva', 'leila', 'lena',
  'lisa', 'elif', 'nora', 'anke', 'sofie', 'emma', 'julia', 'fenna', 'noor', 'yara', 'amira',
])
const M_NAMES = new Set([
  'karim', 'bram', 'joost', 'youssef', 'tarek', 'tom', 'mert', 'daan', 'sven', 'lars',
  'ruben', 'sem', 'luuk', 'finn', 'adam', 'omar', 'hassan', 'ali',
])

export function gender(name: string): 'f' | 'm' {
  const n = name.toLowerCase()
  if (/(mevrouw|mevr|juf|lerares|leerkracht|serveerster|verkoopster|medewerkster|assistente|buurvrouw|tante|moeder|\bzus\b|oma|\bvrouw\b|dame)/.test(n)) return 'f'
  if (/(meneer|\bdhr|ober|verkoper|medewerker|monteur|ambtenaar|agent|makelaar|buurman|vader|broer|opa|\bman\b|meester|leraar)/.test(n)) return 'm'
  const first = n.split(/\s+/)[0]
  if (F_NAMES.has(first)) return 'f'
  if (M_NAMES.has(first)) return 'm'
  return hashInt(name) % 2 === 0 ? 'f' : 'm'
}

/** Assign each distinct speaker its own consistent, gender-appropriate voice. */
export function assignVoices(speakers: string[]): Record<string, VoiceId> {
  const counts: Record<'f' | 'm', number> = { f: 0, m: 0 }
  const map: Record<string, VoiceId> = {}
  for (const name of speakers) {
    const g = gender(name)
    const pool = g === 'm' ? MALE_POOL : FEMALE_POOL
    map[name] = pool[counts[g] % pool.length]
    counts[g]++
  }
  return map
}

/** Voice for a role-play turn: your line is a fixed male voice; the other person gets a
 *  gender-appropriate voice (a male other uses a different male voice than yours). */
export function roleplayVoice(speaker: 'A' | 'you', who: string): VoiceId {
  if (speaker === 'you') return DIALOG_YOU
  return gender(who) === 'm' ? 'orus' : 'aoede'
}

// Manifest key is "<voiceId>|<text>" → mp3 filename (in <base>/audio).
const MAP = manifest as Record<string, string>
const mkey = (voice: VoiceId, text: string) => voice + '|' + text
// Audio lives under the app's base path (e.g. /inburgering-pwa/audio/...), so build URLs
// from BASE_URL rather than a hard-coded root path.
const clipUrl = (file: string) => `${import.meta.env.BASE_URL}audio/${file}`

let current: HTMLAudioElement | null = null

export function hasClip(text: string, voice: VoiceId): boolean {
  return Boolean(MAP[mkey(voice, text)])
}

function stopCurrent(): void {
  if (current) {
    current.pause()
    current = null
  }
}

/** Play the pre-generated MP3 for this text in the given voice (or a varied voice if none
 *  is given); fall back to browser TTS of the same gender if no clip exists yet. */
export function play(text: string, voice?: VoiceId): void {
  const v = voice ?? variedVoice(text)
  const file = MAP[mkey(v, text)]
  if (!file) {
    speak(text, VOICE_GENDER[v])
    return
  }
  stopCurrent()
  stopSpeaking()
  const audio = new Audio(clipUrl(file))
  current = audio
  void audio.play().catch(() => speak(text, VOICE_GENDER[v]))
}

export interface Spoken {
  text: string
  voice?: VoiceId
}

/** Play several clips in order (e.g., a whole dialogue), each in its speaker's voice.
 *  Falls back to browser TTS for the whole sequence if any clip is missing. */
export async function playSequence(items: Spoken[]): Promise<void> {
  const resolved = items.map((it) => ({ text: it.text, voice: it.voice ?? variedVoice(it.text) }))
  if (!resolved.every((it) => hasClip(it.text, it.voice))) {
    speakSequence(resolved.map((it) => ({ text: it.text, gender: VOICE_GENDER[it.voice] })))
    return
  }
  stopCurrent()
  stopSpeaking()
  for (const it of resolved) {
    const file = MAP[mkey(it.voice, it.text)]
    await new Promise<void>((resolve) => {
      const audio = new Audio(clipUrl(file))
      current = audio
      audio.onended = () => resolve()
      audio.onerror = () => resolve()
      void audio.play().catch(() => resolve())
    })
  }
}

export interface Segment {
  lang: 'en' | 'nl'
  text: string // raw text (keeps surrounding spaces for display); trim before using as an audio key
}

/** Split a narration string into English runs and Dutch runs. Dutch is written inline between
 *  [[double brackets]], so the teacher's English is read by the English voice while the Dutch
 *  words/sentences are read by a native Dutch voice. */
export function parseSegments(text: string): Segment[] {
  const segs: Segment[] = []
  const re = /\[\[([\s\S]+?)\]\]/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > last) {
      const raw = text.slice(last, m.index)
      if (raw.trim()) segs.push({ lang: 'en', text: raw })
    }
    if (m[1].trim()) segs.push({ lang: 'nl', text: m[1] })
    last = m.index + m[0].length
  }
  if (last < text.length) {
    const raw = text.slice(last)
    if (raw.trim()) segs.push({ lang: 'en', text: raw })
  }
  return segs
}

/** Build the play-order for a whole lecture: English runs use the narrator voice and the inline
 *  Dutch runs use a native Dutch voice, in reading order. Played back-to-back it sounds like a
 *  real bilingual class. */
export function lectureItems(paragraphs: { text: string }[]): Spoken[] {
  const items: Spoken[] = []
  for (const p of paragraphs)
    for (const seg of parseSegments(p.text)) {
      const t = seg.text.trim()
      if (t) items.push({ text: t, voice: seg.lang === 'nl' ? variedVoice(t) : NARRATOR })
    }
  return items
}

/** Stop whatever is currently playing (MP3 clip or browser speech). */
export function stop(): void {
  stopCurrent()
  stopSpeaking()
}
