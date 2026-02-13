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
  const [viewMode, setViewMode] = useState<'all' | 'mine'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

  // Scenarios state
  const [scenarios, setScenarios] = useState<(Scenario & {
    persona?: { id: string; name: string; title: string; difficulty: string; tags: string[] | null; avatar_url: string | null } | null
    creator?: { display_name: string } | null
  })[]>([])
  const [scenarioVotes, setScenarioVotes] = useState<string[]>([])
  const [scenarioTotal, setScenarioTotal] = useState(0)

  const [isLoading, setIsLoading] = useState(true)
  const [cloningId, setCloningId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        sort,
        page: currentPage.toString(),
        limit: '20'
      })
      if (category !== 'all') params.set('category', category)
      if (viewMode === 'mine') params.set('userOnly', 'true')
      if (debouncedSearchTerm.trim()) params.set('search', debouncedSearchTerm.trim())

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
  }, [category, sort, viewMode, currentPage, debouncedSearchTerm])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [category, sort, viewMode, debouncedSearchTerm])

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
      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search scenarios..."
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-whispie-primary/50 focus:border-whispie-primary/50 transition-all"
          />
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              viewMode === 'all'
                ? 'bg-whispie-primary text-background-dark'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            All Scenarios
          </button>
          <button
            onClick={() => setViewMode('mine')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              viewMode === 'mine'
                ? 'bg-whispie-primary text-background-dark'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            My Scenarios
          </button>
        </div>
      </div>

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
          {viewMode === 'mine' ? 'My Scenarios' : category === 'all' ? 'All Scenarios' : `${category.charAt(0).toUpperCase() + category.slice(1)} Scenarios`}
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
        <EmptyState
          viewMode={viewMode}
          hasSearchOrFilter={debouncedSearchTerm.trim() !== '' || category !== 'all'}
        />
      )}

      {/* Pagination */}
      {!isLoading && scenarios.length > 0 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-white/5 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          <span className="text-slate-300 text-sm">
            Page {currentPage} of {Math.ceil(scenarioTotal / 20)}
          </span>

          <button
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={currentPage >= Math.ceil(scenarioTotal / 20)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-white/5 transition-all"
          >
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </main>
  )
}

type EmptyStateProps = {
  viewMode: 'all' | 'mine'
  hasSearchOrFilter: boolean
}

function EmptyState({ viewMode, hasSearchOrFilter }: EmptyStateProps) {
  // Determine message based on current state
  const getEmptyStateContent = () => {
    if (hasSearchOrFilter) {
      return {
        emoji: '🔍',
        title: 'No scenarios found',
        description: 'No scenarios found. Try a different search or filter.',
        buttonText: 'Clear Filters',
        buttonHref: '/community' // Clear by navigating to clean community page
      }
    }

    if (viewMode === 'mine') {
      return {
        emoji: '📤',
        title: 'You haven\'t shared any scenarios yet',
        description: 'Share a scenario from your hub to see it here.',
        buttonText: 'My Scenarios',
        buttonHref: '/scenarios/my'
      }
    }

    // viewMode === 'all'
    return {
      emoji: '📋',
      title: 'No community scenarios yet',
      description: 'Be the first to share!',
      buttonText: 'My Scenarios',
      buttonHref: '/scenarios/my'
    }
  }

  const content = getEmptyStateContent()

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-4">{content.emoji}</span>
      <h3 className="text-white font-bold text-lg mb-2">
        {content.title}
      </h3>
      <p className="text-slate-400 text-sm max-w-xs">
        {content.description}
      </p>
      <Link
        href={content.buttonHref}
        className="mt-4 px-6 py-2.5 rounded-xl bg-whispie-primary text-background-dark font-bold text-sm hover:brightness-110 transition-all"
      >
        {content.buttonText}
      </Link>
    </div>
  )
}
