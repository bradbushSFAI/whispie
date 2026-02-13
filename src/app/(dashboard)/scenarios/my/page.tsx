import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ScenarioActions } from './scenario-actions'

const difficultyConfig = {
  easy: { label: 'EASY', bg: 'bg-green-900/30', text: 'text-green-400' },
  medium: { label: 'MED', bg: 'bg-yellow-900/30', text: 'text-yellow-400' },
  hard: { label: 'HARD', bg: 'bg-red-900/30', text: 'text-red-400' },
}

type ScenarioRow = {
  id: string
  title: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  persona_id: string | null
  created_at: string
  persona: { id: string; name: string; title: string } | null
}

export default async function MyScenariosPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch user's scenarios with persona info (exclude shared community scenarios)
  const { data: scenarios } = await supabase
    .from('scenarios')
    .select('id, title, category, difficulty, persona_id, created_at, persona:personas(id, name, title)')
    .eq('created_by', user.id)
    .eq('is_active', true)
    .or('source.is.null,source.eq.system,source.eq.user')
    .order('created_at', { ascending: false })

  // Fetch conversation counts per scenario
  const scenarioIds = (scenarios || []).map(s => s.id)
  const { data: conversations } = scenarioIds.length > 0
    ? await supabase
        .from('conversations')
        .select('scenario_id, created_at')
        .eq('user_id', user.id)
        .in('scenario_id', scenarioIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  // Build stats per scenario
  const scenarioStats = new Map<string, { practiceCount: number; lastPracticed: string | null }>()
  for (const c of conversations || []) {
    if (!c.scenario_id) continue
    const existing = scenarioStats.get(c.scenario_id)
    if (existing) {
      existing.practiceCount++
    } else {
      scenarioStats.set(c.scenario_id, { practiceCount: 1, lastPracticed: c.created_at })
    }
  }

  // Count scenarios per persona for "last scenario" guard
  const scenariosPerPersona = new Map<string, number>()
  for (const s of scenarios || []) {
    if (!s.persona_id) continue
    scenariosPerPersona.set(s.persona_id, (scenariosPerPersona.get(s.persona_id) || 0) + 1)
  }

  // Group by persona
  const grouped = new Map<string, { persona: { id: string; name: string; title: string } | null; scenarios: ScenarioRow[] }>()
  for (const s of (scenarios || []) as unknown as ScenarioRow[]) {
    const personaKey = s.persona_id || '__no_persona__'
    const group = grouped.get(personaKey)
    const personaData = Array.isArray(s.persona) ? s.persona[0] || null : s.persona
    if (group) {
      group.scenarios.push(s)
    } else {
      grouped.set(personaKey, { persona: personaData, scenarios: [s] })
    }
  }

  // Fetch user's personas for the "New Scenario" picker
  const { data: userPersonas } = await supabase
    .from('personas')
    .select('id, name, title')
    .eq('created_by', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-background-dark">
      <header className="sticky top-0 z-50 bg-background-dark/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3">
          <Link
            href="/dashboard"
            className="flex items-center justify-center p-2 -ml-2 rounded-full text-white hover:bg-white/10 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-white tracking-tight">My Scenarios</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {/* New Scenario links */}
        {userPersonas && userPersonas.length > 0 && (
          <div className="mb-6">
            <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">New scenario for</p>
            <div className="flex flex-wrap gap-2">
              {userPersonas.map(p => (
                <Link
                  key={p.id}
                  href={`/personas/${p.id}/scenario/new`}
                  className="px-3 py-1.5 rounded-full text-sm bg-surface-dark text-slate-300 border border-white/10 hover:border-whispie-primary/50 hover:text-whispie-primary transition-colors"
                >
                  + {p.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Grouped scenarios */}
        {grouped.size > 0 ? (
          <div className="space-y-8">
            {Array.from(grouped.entries()).map(([personaKey, group]) => (
              <div key={personaKey}>
                {group.persona && (
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-white font-bold">{group.persona.name}</h2>
                    <span className="text-slate-500 text-sm">{group.persona.title}</span>
                  </div>
                )}
                <div className="flex flex-col gap-3">
                  {group.scenarios.map(scenario => {
                    const difficulty = difficultyConfig[scenario.difficulty]
                    const stats = scenarioStats.get(scenario.id) || { practiceCount: 0, lastPracticed: null }
                    const isLastScenario = scenario.persona_id
                      ? (scenariosPerPersona.get(scenario.persona_id) || 0) <= 1
                      : false

                    return (
                      <div
                        key={scenario.id}
                        className="bg-surface-dark rounded-xl p-4 border border-white/5"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-whispie-primary uppercase tracking-wider">
                                {scenario.category}
                              </span>
                              <span className={`${difficulty.bg} ${difficulty.text} text-[10px] font-bold px-2 py-0.5 rounded-full`}>
                                {difficulty.label}
                              </span>
                            </div>
                            <h3 className="text-white font-bold truncate">{scenario.title}</h3>
                          </div>
                          <ScenarioActions
                            scenarioId={scenario.id}
                            isLastScenario={isLastScenario}
                          />
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                          <span>{stats.practiceCount} practice{stats.practiceCount !== 1 ? 's' : ''}</span>
                          {stats.lastPracticed && (
                            <span>Last: {new Date(stats.lastPracticed).toLocaleDateString()}</span>
                          )}
                        </div>

                        <Link
                          href={`/chat/new?scenario=${scenario.id}`}
                          className="inline-block text-xs px-4 py-1.5 rounded-lg bg-whispie-primary text-background-dark font-bold hover:brightness-110 transition-all"
                        >
                          Practice
                        </Link>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-4">📋</span>
            <h3 className="text-white font-bold text-lg mb-2">No scenarios yet</h3>
            <p className="text-slate-400 text-sm max-w-xs">
              Create a persona first, then add scenarios to practice with them.
            </p>
            <Link
              href="/personas/create"
              className="mt-4 px-6 py-2.5 rounded-xl bg-whispie-primary text-background-dark font-bold text-sm hover:brightness-110 transition-all"
            >
              Create Persona
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
