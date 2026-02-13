import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { NavHeader } from '@/components/layout/nav-header'
import { PersonaActions } from '../personas/my/persona-actions'
import { ScenarioActions } from '@/components/scenarios/scenario-actions'
import { getPersonaAvatarUrl } from '@/lib/utils'
import type { Persona, Scenario } from '@/types/database'

const difficultyConfig = {
  easy: { label: 'EASY', bg: 'bg-green-900/30', text: 'text-green-400' },
  medium: { label: 'MED', bg: 'bg-yellow-900/30', text: 'text-yellow-400' },
  hard: { label: 'HARD', bg: 'bg-red-900/30', text: 'text-red-400' },
}


export default async function HubPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  // Fetch user's personas
  const { data: personas } = await supabase
    .from('personas')
    .select('*')
    .eq('created_by', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  // Fetch scenarios linked to user's personas with full details
  const personaIds = (personas || []).map(p => p.id)
  const { data: personaScenarios } = personaIds.length > 0
    ? await supabase
        .from('scenarios')
        .select('id, title, description, context, objectives, category, difficulty, persona_id, created_at')
        .in('persona_id', personaIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
    : { data: [] }

  const scenariosByPersona = new Map<string, Array<{
    id: string
    title: string
    description: string
    context: string
    objectives: string[]
    category: string
    difficulty: 'easy' | 'medium' | 'hard'
    created_at: string
  }>>()
  for (const s of personaScenarios || []) {
    if (!s.persona_id) continue
    const list = scenariosByPersona.get(s.persona_id) || []
    list.push({
      id: s.id,
      title: s.title,
      description: s.description || '',
      context: s.context || '',
      objectives: s.objectives || [],
      category: s.category,
      difficulty: s.difficulty as 'easy' | 'medium' | 'hard',
      created_at: s.created_at
    })
    scenariosByPersona.set(s.persona_id, list)
  }


  // Conversation counts per scenario
  const scenarioIds = (personaScenarios || []).map(s => s.id)
  const { data: conversations } = scenarioIds.length > 0
    ? await supabase
        .from('conversations')
        .select('scenario_id, created_at')
        .eq('user_id', user.id)
        .in('scenario_id', scenarioIds)
        .order('created_at', { ascending: false })
    : { data: [] }

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


  const displayName = profile?.display_name || user.email?.split('@')[0] || 'User'

  return (
    <div className="min-h-screen bg-background-dark">
      <NavHeader displayName={displayName} />

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <h1 className="text-2xl font-bold text-white mb-6">My Hub</h1>

        {/* Create buttons */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <Link
            href="/personas/upload"
            className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-whispie-primary hover:brightness-110 text-background-dark font-bold transition-all text-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className="text-sm">Upload Your...</span>
          </Link>
          <Link
            href="/personas/create"
            className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-surface-dark hover:bg-white/10 text-white font-bold border border-white/10 transition-colors text-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm">Create Manually</span>
          </Link>
        </div>

        {/* My Personas */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-white mb-4">
            My Personas ({personas?.length || 0})
          </h2>

          {personas && personas.length > 0 ? (
            <div className="flex flex-col gap-4">
              {personas.map((persona: Persona) => {
                const difficulty = difficultyConfig[persona.difficulty]
                const linkedScenarios = scenariosByPersona.get(persona.id) || []
                const qaCount = persona.custom_qa?.length || 0

                return (
                  <div
                    key={persona.id}
                    className="bg-surface-dark rounded-2xl p-5 border border-white/5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex gap-3 flex-1 min-w-0">
                        {/* Avatar */}
                        <div className="size-10 rounded-full bg-subtle-dark flex items-center justify-center text-sm overflow-hidden shrink-0">
                          <img src={getPersonaAvatarUrl(persona.name, persona.avatar_url)} alt={persona.name} className="w-full h-full object-cover" />
                        </div>
                        {/* Name and title */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-white font-bold text-lg truncate">{persona.name}</h3>
                            <span className={`${difficulty.bg} ${difficulty.text} text-[10px] font-bold px-2 py-0.5 rounded-full`}>
                              {difficulty.label}
                            </span>
                          </div>
                          <p className="text-slate-400 text-sm">{persona.title}</p>
                        </div>
                      </div>
                      <PersonaActions persona={persona} scenarioCount={linkedScenarios.length} />
                    </div>

                    {persona.tags && persona.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {persona.tags.map(tag => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-0.5 rounded-full bg-whispie-primary/10 text-whispie-primary font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                      <span>{persona.personality_traits?.length || 0} traits</span>
                      <span>{qaCount} rules</span>
                      <span>{linkedScenarios.length} scenarios</span>
                    </div>

                    {/* Nested Scenarios */}
                    {linkedScenarios.length > 0 && (
                      <div className="mb-4 space-y-3">
                        {linkedScenarios.map(scenario => {
                          const difficulty = difficultyConfig[scenario.difficulty]
                          const scenarioData = {
                            id: scenario.id,
                            title: scenario.title,
                            category: scenario.category,
                            difficulty: scenario.difficulty,
                            description: scenario.description || '',
                            context: scenario.context || '',
                            objectives: scenario.objectives || [],
                            persona_id: persona.id,
                            estimated_turns: 0, // Not needed for actions
                            is_premium: false, // Not needed for actions
                            is_active: true,
                            created_by: persona.created_by,
                            is_public: false,
                            source: 'user' as const,
                            upvotes: 0,
                            use_count: 0,
                            created_at: scenario.created_at
                          } as Scenario
                          const stats = scenarioStats.get(scenario.id) || { practiceCount: 0, lastPracticed: null }
                          const isLastScenario = linkedScenarios.length <= 1

                          return (
                            <div
                              key={scenario.id}
                              className="bg-white/5 rounded-xl p-3 border border-white/5"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-semibold text-whispie-primary uppercase tracking-wider">
                                  {scenario.category}
                                </span>
                                <span className={`${difficulty.bg} ${difficulty.text} text-[10px] font-bold px-2 py-0.5 rounded-full`}>
                                  {difficulty.label}
                                </span>
                              </div>
                              <h4 className="text-white font-medium text-sm mb-2">{scenario.title}</h4>
                              <div className="flex items-center gap-4 text-xs text-slate-400 mb-2">
                                <span>{stats.practiceCount} practice{stats.practiceCount !== 1 ? 's' : ''}</span>
                                {stats.lastPracticed && (
                                  <span>Last: {new Date(stats.lastPracticed).toLocaleDateString()}</span>
                                )}
                              </div>
                              <ScenarioActions
                                scenario={scenarioData}
                                isLastScenario={isLastScenario}
                                practiceCount={stats.practiceCount}
                              />
                            </div>
                          )
                        })}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Link
                        href={`/personas/${persona.id}/scenario/new`}
                        className="flex-1 text-center py-2.5 rounded-xl bg-whispie-primary text-background-dark font-bold text-sm hover:brightness-110 transition-all"
                      >
                        Add Scenario
                      </Link>
                      <Link
                        href={`/personas/${persona.id}/edit`}
                        className="py-2.5 px-4 rounded-xl bg-white/5 text-slate-300 text-sm font-medium hover:bg-white/10 transition-colors"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="text-4xl mb-3">🎭</span>
              <p className="text-slate-400 text-sm">
                No personas yet. Create one to start practicing!
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
