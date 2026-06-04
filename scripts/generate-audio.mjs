// Generate natural-voice Dutch MP3s for every spoken phrase, using Google Cloud Text-to-Speech.
// The API key is read from the environment and is NEVER written to disk.
//
//   GOOGLE_TTS_KEY=xxxx node scripts/generate-audio.mjs
//   (optional) TTS_RATE=0.95  CONC=2  DELAY=120
//
// A pool of Dutch voices is used. Normal examples (vocabulary, phrases, grammar) get a VARIED
// voice by a stable hash of the text. In a dialogue every named speaker gets their own
// consistent, gender-appropriate voice. ALL voice/text pairs here mirror src/lib/audio.ts so
// the app always finds a matching clip (no browser-voice fallback).
//
// Output: public/audio/<hash>.mp3 + src/content/audio-manifest.json (key "<voiceId>|<text>").
// Re-running is incremental (existing files on disk are reused).

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import crypto from 'node:crypto'

const ROOT = new URL('..', import.meta.url).pathname
const CONTENT = join(ROOT, 'content')
const OUT = join(ROOT, 'public', 'audio')
const MANIFEST = join(ROOT, 'src', 'content', 'audio-manifest.json')

const KEY = process.env.GOOGLE_TTS_KEY
const RATE = Number(process.env.TTS_RATE || '0.95')
if (!KEY) {
  console.error('Missing GOOGLE_TTS_KEY env var.')
  process.exit(1)
}
mkdirSync(OUT, { recursive: true })

// voiceId -> Google Chirp3-HD voice name. Keep in sync with src/lib/audio.ts.
const VOICE_NAME = {
  aoede: 'nl-NL-Chirp3-HD-Aoede',
  kore: 'nl-NL-Chirp3-HD-Kore',
  leda: 'nl-NL-Chirp3-HD-Leda',
  charon: 'nl-NL-Chirp3-HD-Charon',
  orus: 'nl-NL-Chirp3-HD-Orus',
  puck: 'nl-NL-Chirp3-HD-Puck',
}
const VARIETY = ['aoede', 'kore', 'leda', 'charon', 'orus', 'puck']
const FEMALE_POOL = ['aoede', 'kore', 'leda']
const MALE_POOL = ['charon', 'orus', 'puck']
const DIALOG_YOU = 'charon'

// FNV-1a (32-bit) — identical to src/lib/audio.ts.
function hashInt(s) {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}
const variedVoice = (text) => VARIETY[hashInt(text) % VARIETY.length]

const F_NAMES = new Set([
  'anna', 'fatima', 'sophie', 'sara', 'sanne', 'nadia', 'marit', 'eva', 'leila', 'lena',
  'lisa', 'elif', 'nora', 'anke', 'sofie', 'emma', 'julia', 'fenna', 'noor', 'yara', 'amira',
])
const M_NAMES = new Set([
  'karim', 'bram', 'joost', 'youssef', 'tarek', 'tom', 'mert', 'daan', 'sven', 'lars',
  'ruben', 'sem', 'luuk', 'finn', 'adam', 'omar', 'hassan', 'ali',
])
function gender(name) {
  const n = name.toLowerCase()
  if (/(mevrouw|mevr|juf|lerares|leerkracht|serveerster|verkoopster|medewerkster|assistente|buurvrouw|tante|moeder|\bzus\b|oma|\bvrouw\b|dame)/.test(n)) return 'f'
  if (/(meneer|\bdhr|ober|verkoper|medewerker|monteur|ambtenaar|agent|makelaar|buurman|vader|broer|opa|\bman\b|meester|leraar)/.test(n)) return 'm'
  const first = n.split(/\s+/)[0]
  if (F_NAMES.has(first)) return 'f'
  if (M_NAMES.has(first)) return 'm'
  return hashInt(name) % 2 === 0 ? 'f' : 'm'
}
function assignVoices(speakers) {
  const counts = { f: 0, m: 0 }
  const map = {}
  for (const name of speakers) {
    const g = gender(name)
    const pool = g === 'm' ? MALE_POOL : FEMALE_POOL
    map[name] = pool[counts[g] % pool.length]
    counts[g]++
  }
  return map
}
function roleplayVoice(speaker, who) {
  if (speaker === 'you') return DIALOG_YOU
  return gender(who) === 'm' ? 'orus' : 'aoede'
}

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'))
const jobs = new Map() // "voiceId|text" -> { text, voiceId }
const addJob = (voiceId, text) => {
  if (text) jobs.set(voiceId + '|' + text, { text, voiceId })
}

// Vocabulary decks: card fronts (varied).
for (const f of readdirSync(join(CONTENT, 'decks'))) {
  if (!f.endsWith('.json')) continue
  for (const c of readJson(join(CONTENT, 'decks', f)).cards) if (c.front) addJob(variedVoice(c.front), c.front)
}
// Lessons: grammar examples + phrases (varied); dialogue lines (one voice per named speaker).
for (const f of readdirSync(join(CONTENT, 'lessons'))) {
  if (!f.endsWith('.json')) continue
  const l = readJson(join(CONTENT, 'lessons', f))
  for (const g of l.grammar) for (const e of g.examples || []) if (e.nl) addJob(variedVoice(e.nl), e.nl)
  for (const p of l.phrases) if (p.nl) addJob(variedVoice(p.nl), p.nl)
  for (const w of l.vocab || []) if (w.nl) addJob(variedVoice(w.nl), w.nl)
  for (const s of l.sayings || []) if (s.nl) addJob(variedVoice(s.nl), s.nl)
  const speakers = []
  for (const x of l.dialogue.lines) if (!speakers.includes(x.speaker)) speakers.push(x.speaker)
  const voiceMap = assignVoices(speakers)
  for (const x of l.dialogue.lines) if (x.nl) addJob(voiceMap[x.speaker], x.nl)
}
// Listening mock fragments (varied).
if (existsSync(join(CONTENT, 'mocks'))) {
  for (const f of readdirSync(join(CONTENT, 'mocks'))) {
    if (!f.endsWith('.json')) continue
    for (const q of readJson(join(CONTENT, 'mocks', f)).questions) if (q.audioText) addJob(variedVoice(q.audioText), q.audioText)
  }
}
// Role-play turns: your line = fixed male voice; the other person = gender-appropriate voice.
if (existsSync(join(CONTENT, 'roleplays.json'))) {
  for (const rp of readJson(join(CONTENT, 'roleplays.json')).roleplays) {
    for (const t of rp.turns) if (t.nl) addJob(roleplayVoice(t.speaker, t.who), t.nl)
  }
}
// Basics / exam-guide chapters: spoken Dutch in 'pairs' items and 'example' questions.
const processBasics = (chapters) => {
  for (const b of chapters)
    for (const s of b.sections) {
      if (s.type === 'pairs') for (const it of s.items) if (it.nl) addJob(variedVoice(it.nl), it.nl)
      if (s.type === 'example') {
        if (s.q) addJob(variedVoice(s.q), s.q)
        for (const o of s.options || []) if (o) addJob(variedVoice(o), o)
      }
    }
}
if (existsSync(join(CONTENT, 'basics.json'))) processBasics(readJson(join(CONTENT, 'basics.json')).chapters)
const BASICS_DIR = join(CONTENT, 'basics')
if (existsSync(BASICS_DIR))
  for (const f of readdirSync(BASICS_DIR))
    if (f.endsWith('.json')) processBasics(readJson(join(BASICS_DIR, f)).chapters)

const list = [...jobs.values()]
const manifest = {}
const hash = (voiceName, s) => crypto.createHash('sha1').update(voiceName + '|' + s).digest('hex').slice(0, 16)
const usedVoices = [...new Set(list.map((j) => j.voiceId))]
console.log(`${list.length} clips across voices: ${usedVoices.join(', ')}`)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function callTTS(text, voiceName) {
  return fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: 'nl-NL', name: voiceName },
      audioConfig: { audioEncoding: 'MP3', speakingRate: RATE },
    }),
  })
}

// Probe each voice once so a bad voice name fails fast.
for (const vid of usedVoices) {
  const res = await callTTS('test', VOICE_NAME[vid])
  if (!res.ok) {
    console.error(`Voice "${vid}" (${VOICE_NAME[vid]}) unavailable: ${res.status} ${(await res.text()).slice(0, 160)}`)
    process.exit(1)
  }
  await sleep(150)
}
console.log('All voices OK.')

let idx = 0
let made = 0
let skipped = 0
async function synth(job) {
  const voiceName = VOICE_NAME[job.voiceId]
  const file = hash(voiceName, job.text) + '.mp3'
  const path = join(OUT, file)
  const mkey = job.voiceId + '|' + job.text
  if (existsSync(path)) {
    manifest[mkey] = file
    return
  }
  for (let attempt = 0; attempt < 10; attempt++) {
    const res = await callTTS(job.text, voiceName)
    if (res.status === 429) {
      await sleep(20000) // rate limited — wait for the per-minute window to reset
      continue
    }
    if (!res.ok) throw new Error(`TTS ${res.status}: ${(await res.text()).slice(0, 150)}`)
    const j = await res.json()
    writeFileSync(path, Buffer.from(j.audioContent, 'base64'))
    manifest[mkey] = file
    made++
    await sleep(Number(process.env.DELAY || 120))
    return
  }
  throw new Error('still 429 after retries')
}

async function worker() {
  while (idx < list.length) {
    const job = list[idx++]
    try {
      await synth(job)
    } catch (e) {
      skipped++
      console.error('skip:', job.text.slice(0, 40), String(e).slice(0, 120))
    }
    if (idx % 50 === 0) {
      writeFileSync(MANIFEST, JSON.stringify(manifest))
      console.log(`${idx}/${list.length}`)
    }
  }
}

await Promise.all(Array.from({ length: Number(process.env.CONC || 2) }, worker))
writeFileSync(MANIFEST, JSON.stringify(manifest))
console.log(`Done. ${made} new, ${skipped} skipped. Manifest entries: ${Object.keys(manifest).length} / ${list.length} jobs.`)
