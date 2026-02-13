'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CommunityFilters } from '@/components/community/community-filters'
import { CommunityScenarioCard } from '@/components/community/community-scenario-card'
import { useUser } from '@/hooks/use-user'
import type { Scenario } from '@/types/database'

export function CommunityContent() {
  const router = useRouter()
  const { user } = useUser()
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('upvotes')

  // Scenarios state
  const [scenarios, setScenarios] = useState<(Scenario & { persona?: { id: string; name: string; title: string; difficulty: string; tags: string[] | null; avatar_url: string | null } | null })[]>([])
  const [scenarioVotes, setScenarioVotes] = useState<string[]>([])
  const [scenarioTotal, setScenarioTotal] = useState(0)

  const [isLoading, setIsLoading] = useState(true)
  const [cloningId, setCloningId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ sort })
      if (category !== 'all') params.set('category', category)

      const res = await fetch(`/api/community/scenarios?${params}`)
      if (res.ok) {
        const data = await res.json()
        setScenarios(data.scenarios)
        setScenarioVotes(data.userVotes)
        setScenarioTotal(data.total)
      }
    } finally {
      setIsLoading(false)
    }
  }, [category, sort])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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

  const handleScenarioDeleted = (scenarioId: string) => {
    setScenarios(prev => prev.filter(scenario => scenario.id !== scenarioId))
    setScenarioTotal(prev => prev - 1)
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
      {/* Filters */}
      <div className="mb-6">
        <CommunityFilters
          currentCategory={category}
          currentSort={sort}
          onCategoryChange={setCategory}
          onSortChange={setSort}
        />
      </div>

      {/* Count */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold text-lg">
          {category === 'all' ? 'All Scenarios' : `${category.charAt(0).toUpperCase() + category.slice(1)} Scenarios`}
        </h2>
        <span className="text-slate-400 text-sm">{scenarioTotal} scenarios</span>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-surface-dark rounded-2xl p-5 border border-white/5 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white/5 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-white/5 rounded w-1/2 mb-1" />
                  <div className="h-3 bg-white/5 rounded w-1/3" />
                </div>
              </div>
              <div className="h-5 bg-white/5 rounded w-3/4 mb-2" />
              <div className="h-3 bg-white/5 rounded w-full mb-2" />
              <div className="h-3 bg-white/5 rounded w-4/5" />
            </div>
          ))}
        </div>
      ) : scenarios.length > 0 ? (
        <div className="flex flex-col gap-4">
          {scenarios.map(scenario => (
            <CommunityScenarioCard
              key={scenario.id}
              scenario={scenario}
              initialVoted={scenarioVotes.includes(scenario.id)}
              onTryIt={handleTryScenario}
              isCloning={cloningId === scenario.id}
              currentUserId={user?.id}
              onDeleted={handleScenarioDeleted}
            />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </main>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-4">📋</span>
      <h3 className="text-white font-bold text-lg mb-2">
        No community scenarios yet
      </h3>
      <p className="text-slate-400 text-sm max-w-xs">
        No shared scenarios yet. Community scenarios will appear here once shared.
      </p>
      <Link
        href="/scenarios/my"
        className="mt-4 px-6 py-2.5 rounded-xl bg-whispie-primary text-background-dark font-bold text-sm hover:brightness-110 transition-all"
      >
        My Scenarios
      </Link>
    </div>
  )
}
