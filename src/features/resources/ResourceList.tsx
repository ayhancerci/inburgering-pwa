import { loadContent } from '../../content'
import { Panel } from '../../components/ui'
import type { Resource } from '../../content/schemas'

const TYPE_META: Record<Resource['type'], { icon: string; label: string }> = {
  practice: { icon: '📝', label: 'Oefenexamens (officieel)' },
  knm: { icon: '🇳🇱', label: 'KNM' },
  video: { icon: '🎬', label: "Video's (YouTube)" },
  listening: { icon: '🎧', label: 'Luisteren' },
  podcast: { icon: '🎙️', label: 'Podcast' },
  reading: { icon: '📰', label: 'Lezen' },
  grammar: { icon: '📘', label: 'Grammatica' },
  vocab: { icon: '🔤', label: 'Woorden' },
}

const ORDER: Resource['type'][] = [
  'practice',
  'knm',
  'video',
  'listening',
  'podcast',
  'reading',
  'grammar',
  'vocab',
]

export function ResourceList() {
  const { resources } = loadContent()
  const groups = ORDER.map((type) => ({
    type,
    items: resources.filter((r) => r.type === type),
  })).filter((g) => g.items.length > 0)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900">Bronnen — extra oefenen</h2>
        <p className="mt-1 text-sm text-slate-500">
          Free websites, videos and podcasts to learn more. They open in a new tab.
        </p>
      </div>

      {groups.map((g) => (
        <div key={g.type} className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <span>{TYPE_META[g.type].icon}</span>
            {TYPE_META[g.type].label}
          </h3>
          <div className="space-y-2">
            {g.items.map((r) => (
              <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className="block">
                <Panel className="px-4 py-3 transition hover:ring-yellow-300">
                  <p className="flex items-center gap-1 text-sm font-semibold text-slate-900">
                    {r.title} <span className="text-sky-500">↗</span>
                  </p>
                  {r.description && (
                    <p className="mt-0.5 text-xs text-slate-500">{r.description}</p>
                  )}
                </Panel>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
