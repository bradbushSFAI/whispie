import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Persona } from '@/types/database'
import { PersonaActions } from './persona-actions'

const difficultyConfig = {
  easy: { label: 'EASY', bg: 'bg-green-900/30', text: 'text-green-400' },
  medium: { label: 'MED', bg: 'bg-yellow-900/30', text: 'text-yellow-400' },
  hard: { label: 'HARD', bg: 'bg-red-900/30', text: 'text-red-400' },
}

export default async function MyPersonasPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: personas } = await supabase
    .from('personas')
    .select('*')
    .eq('created_by', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  // Also fetch scenarios linked to user's personas
  const personaIds = (personas || []).map(p => p.id)
  const { data: scenarios } = personaIds.length > 0
    ? await supabase
        .from('scenarios')
        .select('id, title, persona_id')
        .in('persona_id', personaIds)
        .eq('is_active', true)
    : { data: [] }

  const scenariosByPersona = new Map<string, { id: string; title: string }[]>()
  for (const s of scenarios || []) {
    if (!s.persona_id) continue
    const list = scenariosByPersona.get(s.persona_id) || []
    list.push({ id: s.id, title: s.title })
    scenariosByPersona.set(s.persona_id, list)
  }

  return (
    <div className="min-h-screen bg-background-dark">
      {/* Header */}
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
          <h1 className="text-lg font-bold text-white tracking-tight">My Personas</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {/* Create buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
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

        {/* Personas list */}
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
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-bold text-lg truncate">{persona.name}</h3>
                        <span className={`${difficulty.bg} ${difficulty.text} text-[10px] font-bold px-2 py-0.5 rounded-full`}>
                          {difficulty.label}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm">{persona.title}</p>
                    </div>
                    <PersonaActions persona={persona} scenarioCount={linkedScenarios.length} />
                  </div>

                  {/* Tags */}
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

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                    <span>{persona.personality_traits?.length || 0} traits</span>
                    <span>{qaCount} rules</span>
                    <span>{linkedScenarios.length} scenarios</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {linkedScenarios.length > 0 ? (
                      <Link
                        href={`/chat/new?scenario=${linkedScenarios[0].id}`}
                        className="flex-1 text-center py-2.5 rounded-xl bg-whispie-primary text-background-dark font-bold text-sm hover:brightness-110 transition-all"
                      >
                        Start Practice
                      </Link>
                    ) : (
                      <Link
                        href={`/personas/${persona.id}/edit`}
                        className="flex-1 text-center py-2.5 rounded-xl bg-whispie-primary text-background-dark font-bold text-sm hover:brightness-110 transition-all"
                      >
                        Add Scenario
                      </Link>
                    )}
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
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-4">🎭</span>
            <h3 className="text-white font-bold text-lg mb-2">No personas yet</h3>
            <p className="text-slate-400 text-sm max-w-xs">
              Create a persona based on someone in your life to practice realistic conversations.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
