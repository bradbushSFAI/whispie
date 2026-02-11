'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CommunityFilters } from '@/components/community/community-filters'
import { CommunityCard } from '@/components/community/community-card'
import type { Persona } from '@/types/database'

export default function CommunityPage() {
  const router = useRouter()
  const [tag, setTag] = useState('all')
  const [sort, setSort] = useState('upvotes')
  const [personas, setPersonas] = useState<Persona[]>([])
  const [userVotes, setUserVotes] = useState<string[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [cloningId, setCloningId] = useState<string | null>(null)

  const fetchPersonas = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ sort })
      if (tag !== 'all') params.set('tag', tag)

      const res = await fetch(`/api/community?${params}`)
      if (res.ok) {
        const data = await res.json()
        setPersonas(data.personas)
        setUserVotes(data.userVotes)
        setTotal(data.total)
      }
    } finally {
      setIsLoading(false)
    }
  }, [tag, sort])

  useEffect(() => {
    fetchPersonas()
  }, [fetchPersonas])

  const handleTryIt = async (personaId: string) => {
    setCloningId(personaId)
    try {
      const res = await fetch(`/api/community/${personaId}/clone`, { method: 'POST' })
      if (res.ok) {
        const { persona } = await res.json()
        // Redirect to My Personas so user can start a conversation
        router.push(`/personas/${persona.id}/edit`)
      }
    } finally {
      setCloningId(null)
    }
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
          <h1 className="text-lg font-bold text-white tracking-tight">Community</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
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
            {tag === 'all' ? 'All Personas' : `${tag.charAt(0).toUpperCase() + tag.slice(1)} Personas`}
          </h2>
          <span className="text-slate-400 text-sm">{total} personas</span>
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
        ) : personas.length > 0 ? (
          <div className="flex flex-col gap-4">
            {personas.map(persona => (
              <CommunityCard
                key={persona.id}
                persona={persona}
                initialVoted={userVotes.includes(persona.id)}
                onTryIt={handleTryIt}
                isCloning={cloningId === persona.id}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-4">🌍</span>
            <h3 className="text-white font-bold text-lg mb-2">No community personas yet</h3>
            <p className="text-slate-400 text-sm max-w-xs">
              Be the first to share! Create a persona and share it with the community.
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
