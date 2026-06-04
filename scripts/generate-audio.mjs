// Generate natural-voice Dutch MP3s for every spoken phrase, using Google Cloud
// Text-to-Speech. The API key is read from the environment and is NEVER written to disk.
//
//   GOOGLE_TTS_KEY=xxxx node scripts/generate-audio.mjs
//   (optional) TTS_VOICE=nl-NL-Wavenet-D  TTS_RATE=0.95
//
// Output: public/audio/<hash>.mp3  +  src/content/audio-manifest.json (text -> filename)
// Re-running is incremental: existing clips are skipped.

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import crypto from 'node:crypto'

const ROOT = new URL('..', import.meta.url).pathname
const CONTENT = join(ROOT, 'content')
const OUT = join(ROOT, 'public', 'audio')
const MANIFEST = join(ROOT, 'src', 'content', 'audio-manifest.json')

const KEY = process.env.GOOGLE_TTS_KEY
const VOICE = process.env.TTS_VOICE || 'nl-NL-Wavenet-D'
const RATE = Number(process.env.TTS_RATE || '0.95')

if (!KEY) {
  console.error('Missing GOOGLE_TTS_KEY env var.')
  process.exit(1)
}
mkdirSync(OUT, { recursive: true })

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'))
const texts = new Set()

// Vocabulary decks: card fronts
for (const f of readdirSync(join(CONTENT, 'decks'))) {
  if (!f.endsWith('.json')) continue
  for (const c of readJson(join(CONTENT, 'decks', f)).cards) if (c.front) texts.add(c.front)
}
// Lessons: grammar examples, phrases, dialogue lines (Dutch only)
for (const f of readdirSync(join(CONTENT, 'lessons'))) {
  if (!f.endsWith('.json')) continue
  const l = readJson(join(CONTENT, 'lessons', f))
  for (const g of l.grammar) for (const e of g.examples || []) if (e.nl) texts.add(e.nl)
  for (const p of l.phrases) if (p.nl) texts.add(p.nl)
  for (const x of l.dialogue.lines) if (x.nl) texts.add(x.nl)
}
// Listening mock fragments
if (existsSync(join(CONTENT, 'mocks'))) {
  for (const f of readdirSync(join(CONTENT, 'mocks'))) {
    if (!f.endsWith('.json')) continue
    for (const q of readJson(join(CONTENT, 'mocks', f)).questions) if (q.audioText) texts.add(q.audioText)
  }
}
// Role-play turns
if (existsSync(join(CONTENT, 'roleplays.json'))) {
  for (const rp of readJson(join(CONTENT, 'roleplays.json')).roleplays) {
    for (const t of rp.turns) if (t.nl) texts.add(t.nl)
  }
}

const manifest = existsSync(MANIFEST) ? readJson(MANIFEST) : {}
const list = [...texts]
const hash = (s) => crypto.createHash('sha1').update(VOICE + '|' + s).digest('hex').slice(0, 16)
console.log(`Voice ${VOICE} — ${list.length} unique phrases.`)

let idx = 0
let made = 0
async function synth(text) {
  const file = hash(text) + '.mp3'
  const path = join(OUT, file)
  if (existsSync(path)) {
    manifest[text] = file
    return
  }
  const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: 'nl-NL', name: VOICE },
      audioConfig: { audioEncoding: 'MP3', speakingRate: RATE },
    }),
  })
  if (!res.ok) throw new Error(`TTS ${res.status}: ${await res.text()}`)
  const j = await res.json()
  writeFileSync(path, Buffer.from(j.audioContent, 'base64'))
  manifest[text] = file
  made++
}

async function worker() {
  while (idx < list.length) {
    const t = list[idx++]
    try {
      await synth(t)
    } catch (e) {
      console.error('skip:', t.slice(0, 40), String(e).slice(0, 120))
    }
    if (idx % 50 === 0) {
      writeFileSync(MANIFEST, JSON.stringify(manifest))
      console.log(`${idx}/${list.length}`)
    }
  }
}

await Promise.all(Array.from({ length: 5 }, worker))
writeFileSync(MANIFEST, JSON.stringify(manifest))
console.log(`Done. ${made} new clips, ${Object.keys(manifest).length} total in manifest.`)
