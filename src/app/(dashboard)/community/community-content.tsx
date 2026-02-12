'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CommunityFilters } from '@/components/community/community-filters'
import { CommunityCard } from '@/components/community/community-card'
import { CommunityScenarioCard } from '@/components/community/community-scenario-card'
import type { Persona, Scenario } from '@/types/database'

type Tab = 'personas' | 'scenarios'

export function CommunityContent() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('personas')
  const [tag, setTag] = useState('all')
  const [sort, setSort] = useState('upvotes')

  // Personas state
  const [personas, setPersonas] = useState<Persona[]>([])
  const [personaVotes, setPersonaVotes] = useState<string[]>([])
  const [personaTotal, setPersonaTotal] = useState(0)

  // Scenarios state
  const [scenarios, setScenarios] = useState<(Scenario & { persona?: { id: string; name: string; title: string; difficulty: string } | null })[]>([])
  const [scenarioVotes, setScenarioVotes] = useState<string[]>([])
  const [scenarioTotal, setScenarioTotal] = useState(0)

  const [isLoading, setIsLoading] = useState(true)
  const [cloningId, setCloningId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ sort })
      if (tag !== 'all') params.set('tag', tag)

      if (tab === 'personas') {
        const res = await fetch(`/api/community?${params}`)
        if (res.ok) {
          const data = await res.json()
          setPersonas(data.personas)
          setPersonaVotes(data.userVotes)
          setPersonaTotal(data.total)
        }
      } else {
        const res = await fetch(`/api/community/scenarios?${params}`)
        if (res.ok) {
          const data = await res.json()
          setScenarios(data.scenarios)
          setScenarioVotes(data.userVotes)
          setScenarioTotal(data.total)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }, [tab, tag, sort])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleTryPersona = async (personaId: string) => {
    setCloningId(personaId)
    try {
      const res = await fetch(`/api/community/${personaId}/clone`, { method: 'POST' })
      if (res.ok) {
        const { persona } = await res.json()
        router.push(`/personas/${persona.id}/edit`)
      }
    } finally {
      setCloningId(null)
    }
  }

  const handleTryScenario = async (scenarioId: string) => {
    setCloningId(scenarioId)
    try {
      const res = await fetch(`/api/community/scenarios/${scenarioId}/clone`, { method: 'POST' })
      if (res.ok) {
        const { scenario } = await res.json()
        router.push(`/chat/new?scenario=${scenario.id}`)
      }
    } finally {
      setCloningId(null)
    }
  }

  const total = tab === 'personas' ? personaTotal : scenarioTotal

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
      {/* Tab toggle */}
      <div className="flex bg-surface-dark rounded-xl p-1 mb-6 border border-white/5">
        <button
          onClick={() => setTab('personas')}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
            tab === 'personas'
              ? 'bg-whispie-primary text-background-dark'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Personas
        </button>
        <button
          onClick={() => setTab('scenarios')}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
            tab === 'scenarios'
              ? 'bg-whispie-primary text-background-dark'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Scenarios
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <CommunityFilters
          currentTag={tag}
          currentSort={sort}
          onTagChange={setTag}
          onSortChange={setSort}
        />
      </div>

      {/* Count */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold text-lg">
          {tag === 'all'
            ? `All ${tab === 'personas' ? 'Personas' : 'Scenarios'}`
            : `${tag.charAt(0).toUpperCase() + tag.slice(1)} ${tab === 'personas' ? 'Personas' : 'Scenarios'}`}
        </h2>
        <span className="text-slate-400 text-sm">{total} {tab}</span>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-surface-dark rounded-2xl p-5 border border-white/5 animate-pulse">
              <div className="h-5 bg-white/5 rounded w-2/3 mb-3" />
              <div className="h-4 bg-white/5 rounded w-1/3 mb-3" />
              <div className="h-3 bg-white/5 rounded w-full mb-2" />
              <div className="h-3 bg-white/5 rounded w-4/5" />
            </div>
          ))}
        </div>
      ) : tab === 'personas' ? (
        personas.length > 0 ? (
          <div className="flex flex-col gap-4">
            {personas.map(persona => (
              <CommunityCard
                key={persona.id}
                persona={persona}
                initialVoted={personaVotes.includes(persona.id)}
                onTryIt={handleTryPersona}
                isCloning={cloningId === persona.id}
              />
            ))}
          </div>
        ) : (
          <EmptyState type="personas" />
        )
      ) : (
        scenarios.length > 0 ? (
          <div className="flex flex-col gap-4">
            {scenarios.map(scenario => (
              <CommunityScenarioCard
                key={scenario.id}
                scenario={scenario}
                initialVoted={scenarioVotes.includes(scenario.id)}
                onTryIt={handleTryScenario}
                isCloning={cloningId === scenario.id}
              />
            ))}
          </div>
        ) : (
          <EmptyState type="scenarios" />
        )
      )}
    </main>
  )
}

function EmptyState({ type }: { type: 'personas' | 'scenarios' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-4">{type === 'personas' ? '🌍' : '📋'}</span>
      <h3 className="text-white font-bold text-lg mb-2">
        No community {type} yet
      </h3>
      <p className="text-slate-400 text-sm max-w-xs">
        {type === 'personas'
          ? 'Be the first to share! Create a persona and share it with the community.'
          : 'No shared scenarios yet. Community scenarios will appear here once shared.'}
      </p>
      <Link
        href={type === 'personas' ? '/personas/create' : '/scenarios/my'}
        className="mt-4 px-6 py-2.5 rounded-xl bg-whispie-primary text-background-dark font-bold text-sm hover:brightness-110 transition-all"
      >
        {type === 'personas' ? 'Create Persona' : 'My Scenarios'}
      </Link>
    </div>
  )
}
