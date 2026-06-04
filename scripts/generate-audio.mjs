// Generate natural-voice Dutch MP3s for every spoken phrase, using Google Cloud
// Text-to-Speech. The API key is read from the environment and is NEVER written to disk.
//
//   GOOGLE_TTS_KEY=xxxx node scripts/generate-audio.mjs
//   (optional) TTS_VOICE_F=nl-NL-Chirp3-HD-Aoede  TTS_VOICE_M=nl-NL-Chirp3-HD-Charon  TTS_RATE=0.95
//
// Two voices are produced: a female voice (used everywhere) and a male voice (the
// "you"/second speaker in dialogues), so a played-back conversation sounds like two people.
//
// Output: public/audio/<hash>.mp3
//   + src/content/audio-manifest.json   (female: text -> filename)
//   + src/content/audio-manifest-m.json (male:   text -> filename)
// Re-running is incremental: existing clips are skipped (hash includes the voice name).

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import crypto from 'node:crypto'

const ROOT = new URL('..', import.meta.url).pathname
const CONTENT = join(ROOT, 'content')
const OUT = join(ROOT, 'public', 'audio')
const MANIFEST_F = join(ROOT, 'src', 'content', 'audio-manifest.json')
const MANIFEST_M = join(ROOT, 'src', 'content', 'audio-manifest-m.json')

const KEY = process.env.GOOGLE_TTS_KEY
const VOICE_F = process.env.TTS_VOICE_F || 'nl-NL-Chirp3-HD-Aoede'
const VOICE_M = process.env.TTS_VOICE_M || 'nl-NL-Chirp3-HD-Charon'
const RATE = Number(process.env.TTS_RATE || '0.95')

if (!KEY) {
  console.error('Missing GOOGLE_TTS_KEY env var.')
  process.exit(1)
}
mkdirSync(OUT, { recursive: true })

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'))
const female = new Set()
const male = new Set()
const add = (gender, text) => (gender === 'm' ? male : female).add(text)

// Vocabulary decks: card fronts (female).
for (const f of readdirSync(join(CONTENT, 'decks'))) {
  if (!f.endsWith('.json')) continue
  for (const c of readJson(join(CONTENT, 'decks', f)).cards) if (c.front) female.add(c.front)
}
// Lessons: grammar examples + phrases (female); dialogue lines per speaker.
for (const f of readdirSync(join(CONTENT, 'lessons'))) {
  if (!f.endsWith('.json')) continue
  const l = readJson(join(CONTENT, 'lessons', f))
  for (const g of l.grammar) for (const e of g.examples || []) if (e.nl) female.add(e.nl)
  for (const p of l.phrases) if (p.nl) female.add(p.nl)
  const speakers = []
  for (const x of l.dialogue.lines) if (!speakers.includes(x.speaker)) speakers.push(x.speaker)
  for (const x of l.dialogue.lines) {
    if (!x.nl) continue
    add(x.voice || (speakers.indexOf(x.speaker) % 2 === 0 ? 'f' : 'm'), x.nl)
  }
}
// Listening mock fragments (female).
if (existsSync(join(CONTENT, 'mocks'))) {
  for (const f of readdirSync(join(CONTENT, 'mocks'))) {
    if (!f.endsWith('.json')) continue
    for (const q of readJson(join(CONTENT, 'mocks', f)).questions) if (q.audioText) female.add(q.audioText)
  }
}
// Role-play turns: the other person ('A') = female, your line ('you') = male.
if (existsSync(join(CONTENT, 'roleplays.json'))) {
  for (const rp of readJson(join(CONTENT, 'roleplays.json')).roleplays) {
    for (const t of rp.turns) {
      if (!t.nl) continue
      add(t.voice || (t.speaker === 'you' ? 'm' : 'f'), t.nl)
    }
  }
}

const manifestF = existsSync(MANIFEST_F) ? readJson(MANIFEST_F) : {}
const manifestM = existsSync(MANIFEST_M) ? readJson(MANIFEST_M) : {}

const jobs = [
  ...[...female].map((text) => ({ text, voice: VOICE_F, manifest: manifestF })),
  ...[...male].map((text) => ({ text, voice: VOICE_M, manifest: manifestM })),
]
const hash = (voice, s) =>
  crypto.createHash('sha1').update(voice + '|' + s).digest('hex').slice(0, 16)
console.log(
  `Female (${VOICE_F}): ${female.size} · Male (${VOICE_M}): ${male.size} — ${jobs.length} clips.`,
)

let idx = 0
let made = 0
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function synth(job) {
  const { text, voice, manifest } = job
  const file = hash(voice, text) + '.mp3'
  const path = join(OUT, file)
  if (existsSync(path)) {
    manifest[text] = file
    return
  }
  for (let attempt = 0; attempt < 10; attempt++) {
    const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: 'nl-NL', name: voice },
        audioConfig: { audioEncoding: 'MP3', speakingRate: RATE },
      }),
    })
    if (res.status === 429) {
      await sleep(20000) // rate limited — wait for the per-minute window to reset
      continue
    }
    if (!res.ok) throw new Error(`TTS ${res.status}: ${(await res.text()).slice(0, 150)}`)
    const j = await res.json()
    writeFileSync(path, Buffer.from(j.audioContent, 'base64'))
    manifest[text] = file
    made++
    await sleep(Number(process.env.DELAY || 120)) // gentle pacing
    return
  }
  throw new Error('still 429 after retries')
}

function saveManifests() {
  writeFileSync(MANIFEST_F, JSON.stringify(manifestF))
  writeFileSync(MANIFEST_M, JSON.stringify(manifestM))
}

async function worker() {
  while (idx < jobs.length) {
    const job = jobs[idx++]
    try {
      await synth(job)
    } catch (e) {
      console.error('skip:', job.text.slice(0, 40), String(e).slice(0, 120))
    }
    if (idx % 50 === 0) {
      saveManifests()
      console.log(`${idx}/${jobs.length}`)
    }
  }
}

await Promise.all(Array.from({ length: Number(process.env.CONC || 2) }, worker))
saveManifests()
console.log(
  `Done. ${made} new clips. Female manifest: ${Object.keys(manifestF).length}, male: ${Object.keys(manifestM).length}.`,
)
