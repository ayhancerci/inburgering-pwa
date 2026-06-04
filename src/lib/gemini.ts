// Minimal Google Gemini client that runs entirely in the browser with the user's own API key
// (bring-your-own-key). No server needed, so it works on GitHub Pages. The key is read from
// the local store and sent only to Google's API.

const BASE = 'https://generativelanguage.googleapis.com/v1beta'

/** Validate the key and return the models that support generateContent. */
export async function listModels(key: string): Promise<string[]> {
  const res = await fetch(`${BASE}/models?key=${encodeURIComponent(key)}`)
  if (!res.ok) {
    if (res.status === 400 || res.status === 403)
      throw new Error('Die sleutel werkt niet. Controleer je Gemini API-sleutel.')
    throw new Error(`Kon de sleutel niet testen (${res.status}).`)
  }
  const j = await res.json()
  return (j.models || [])
    .filter((m: { supportedGenerationMethods?: string[] }) =>
      (m.supportedGenerationMethods || []).includes('generateContent'),
    )
    .map((m: { name: string }) => m.name.replace(/^models\//, ''))
}

/** Pick a fast, capable text model from the available list. */
export function pickModel(models: string[]): string {
  const bad = /vision|embedding|aqa|tts|image|live|exp-/
  const prefs = [/2\.5-flash/, /2\.0-flash/, /1\.5-flash/, /flash/, /2\.5-pro/, /1\.5-pro/, /pro/]
  for (const re of prefs) {
    const m = models.find((x) => re.test(x) && !bad.test(x))
    if (m) return m
  }
  return models.find((x) => !bad.test(x)) || models[0] || 'gemini-2.0-flash'
}

export interface WritingFeedback {
  level: string
  score: number
  corrected: string
  good: string[]
  issues: string[]
  tips: string[]
}

function parseJson(text: string): Record<string, unknown> {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/)
    if (m) return JSON.parse(m[0])
    throw new Error('Kon het AI-antwoord niet lezen. Probeer het opnieuw.')
  }
}

const asStrings = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : []

/** Send the student's writing to Gemini and get A2-level feedback. */
export async function gradeWriting(opts: {
  key: string
  model: string
  task: string
  text: string
}): Promise<WritingFeedback> {
  const prompt = `You are a kind, encouraging Dutch (NT2) writing examiner for the A2 inburgering exam (Schrijven).
The student responded to this task: "${opts.task || '(no specific task — free writing)'}"
The student wrote this in Dutch:
"""
${opts.text}
"""
Assess at A2 level. Reply with ONLY a JSON object, no extra text, in exactly this shape:
{
  "level": "A1" | "A2" | "B1",
  "score": <integer 0-100, how well it fulfils an A2 writing task>,
  "corrected": "<the student's text rewritten in correct, natural A2 Dutch, keeping their meaning and roughly their length>",
  "good": ["<1-3 short things they did well, in English>"],
  "issues": ["<2-5 short, specific points to improve, in English: grammar, word order, de/het, spelling, verb endings (-t), vocabulary, or parts of the task they missed>"],
  "tips": ["<1-3 short, concrete, encouraging tips in English>"]
}`
  const res = await fetch(
    `${BASE}/models/${opts.model || 'gemini-2.0-flash'}:generateContent?key=${encodeURIComponent(opts.key)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
      }),
    },
  )
  if (!res.ok) {
    const t = await res.text()
    if (res.status === 404)
      throw new Error('Dit AI-model is niet beschikbaar. Wis de sleutel en voeg hem opnieuw toe.')
    throw new Error(`AI-fout (${res.status}): ${t.slice(0, 180)}`)
  }
  const j = await res.json()
  const out: string =
    j?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') ?? ''
  const p = parseJson(out)
  return {
    level: String(p.level ?? 'A2'),
    score: Math.max(0, Math.min(100, Number(p.score) || 0)),
    corrected: String(p.corrected ?? ''),
    good: asStrings(p.good),
    issues: asStrings(p.issues),
    tips: asStrings(p.tips),
  }
}

export interface SpeakingFeedback {
  level: string
  score: number
  good: string[]
  issues: string[]
  tips: string[]
  model: string
}

/** Send a transcript of the student's spoken Dutch to Gemini for A2 speaking feedback. */
export async function gradeSpeaking(opts: {
  key: string
  model: string
  task: string
  transcript: string
}): Promise<SpeakingFeedback> {
  const prompt = `You are a kind, encouraging Dutch (NT2) speaking examiner for the A2 inburgering exam (Spreken).
The student was given this task: "${opts.task || '(no specific task — free speaking)'}"
This is an automatic speech-to-text transcript of what they SAID in Dutch — ignore missing punctuation, capitalisation and small transcription glitches; judge the spoken language, not the typing:
"""
${opts.transcript}
"""
Assess their spoken Dutch at A2 level. Reply with ONLY a JSON object, no extra text, in exactly this shape:
{
  "level": "A1" | "A2" | "B1",
  "score": <integer 0-100, how well it fulfils an A2 speaking task>,
  "good": ["<1-3 short things they did well, in English>"],
  "issues": ["<2-5 short, specific points to improve, in English: grammar, verb forms, word order, vocabulary, or parts of the task they missed>"],
  "tips": ["<1-3 short, concrete, encouraging speaking tips in English>"],
  "model": "<a natural A2 model answer they could say out loud for this task, 3-6 short Dutch sentences>"
}`
  const res = await fetch(
    `${BASE}/models/${opts.model || 'gemini-2.0-flash'}:generateContent?key=${encodeURIComponent(opts.key)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.4 },
      }),
    },
  )
  if (!res.ok) {
    const t = await res.text()
    if (res.status === 404)
      throw new Error('Dit AI-model is niet beschikbaar. Wis de sleutel en voeg hem opnieuw toe.')
    throw new Error(`AI-fout (${res.status}): ${t.slice(0, 180)}`)
  }
  const j = await res.json()
  const out: string =
    j?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') ?? ''
  const p = parseJson(out)
  return {
    level: String(p.level ?? 'A2'),
    score: Math.max(0, Math.min(100, Number(p.score) || 0)),
    good: asStrings(p.good),
    issues: asStrings(p.issues),
    tips: asStrings(p.tips),
    model: String(p.model ?? ''),
  }
}
