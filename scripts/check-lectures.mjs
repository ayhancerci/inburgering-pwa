// Validate lecture files: valid JSON, correct shape, balanced [[ ]] brackets, sane segments.
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const DIR = join(new URL('..', import.meta.url).pathname, 'content', 'lectures')

function parseSegments(text) {
  const segs = []
  const re = /\[\[([\s\S]+?)\]\]/g
  let last = 0
  let m
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

let problems = 0
const files = readdirSync(DIR).filter((f) => f.endsWith('.json')).sort()
for (const f of files) {
  const errs = []
  let lec
  try {
    lec = JSON.parse(readFileSync(join(DIR, f), 'utf8'))
  } catch (e) {
    console.log(`✗ ${f}: INVALID JSON — ${String(e).slice(0, 80)}`)
    problems++
    continue
  }
  const nn = f.match(/t(\d{2})-/)?.[1]
  if (lec.themeId !== `thema-${nn}`) errs.push(`themeId ${lec.themeId} != thema-${nn}`)
  if (!lec.titleNl || !lec.titleEn) errs.push('missing title')
  if (lec.examples || lec.paragraphs?.some((p) => p.examples)) errs.push('has stray "examples" field')
  const paras = lec.paragraphs || []
  if (paras.length !== 6) errs.push(`${paras.length} paragraphs (want 6)`)
  let words = 0
  let maxNl = 0
  let enRuns = 0
  let nlRuns = 0
  for (const [i, p] of paras.entries()) {
    if (!p.text) {
      errs.push(`p${i} no text`)
      continue
    }
    const opens = (p.text.match(/\[\[/g) || []).length
    const closes = (p.text.match(/\]\]/g) || []).length
    if (opens !== closes) errs.push(`p${i} unbalanced brackets ${opens}/${closes}`)
    if (/\[\[[^\]]*\.\.\./.test(p.text)) errs.push(`p${i} "..." inside brackets`)
    words += p.text.replace(/\[\[|\]\]/g, '').split(/\s+/).filter(Boolean).length
    for (const s of parseSegments(p.text)) {
      if (s.lang === 'en') enRuns++
      else {
        nlRuns++
        maxNl = Math.max(maxNl, s.text.trim().length)
      }
      if (s.text.includes('[[') || s.text.includes(']]')) errs.push(`p${i} stray bracket in segment`)
    }
  }
  if (maxNl > 140) errs.push(`longest Dutch chunk ${maxNl} chars (>140)`)
  if (errs.length) {
    console.log(`✗ ${f}: ${errs.join('; ')}`)
    problems++
  } else {
    console.log(`✓ ${f}: ${paras.length} paras, ~${words} words, ${enRuns} EN + ${nlRuns} NL runs, longest NL ${maxNl}`)
  }
}
console.log(`\n${files.length} files, ${problems} with problems.`)
process.exit(problems ? 1 : 0)
