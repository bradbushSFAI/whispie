'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useVote } from '@/hooks/use-vote'
import { QAEditor } from '@/components/personas/qa-editor'
import type { Persona } from '@/types/database'

const difficultyConfig = {
  easy: { label: 'Easy', bg: 'bg-green-900/30', text: 'text-green-400', border: 'border-green-500/30' },
  medium: { label: 'Medium', bg: 'bg-yellow-900/30', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  hard: { label: 'Hard', bg: 'bg-red-900/30', text: 'text-red-400', border: 'border-red-500/30' },
}

export default function CommunityDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [persona, setPersona] = useState<Persona | null>(null)
  const [initialVoted, setInitialVoted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isCloning, setIsCloning] = useState(false)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      try {
        // Fetch persona
        const personaRes = await fetch(`/api/personas/${id}`)
        if (!personaRes.ok) {
          router.push('/community')
          return
        }
        const { persona: p } = await personaRes.json()
        setPersona(p)

        // Check vote status
        const voteParams = new URLSearchParams({ tag: 'all', sort: 'upvotes' })
        const communityRes = await fetch(`/api/community?${voteParams}`)
        if (communityRes.ok) {
          const data = await communityRes.json()
          setInitialVoted(data.userVotes?.includes(id) || false)
        }
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [id, router])

  const handleTryIt = async () => {
    setIsCloning(true)
    try {
      const res = await fetch(`/api/community/${id}/clone`, { method: 'POST' })
      if (res.ok) {
        const { persona: clone } = await res.json()
        router.push(`/personas/${clone.id}/edit`)
      }
    } finally {
      setIsCloning(false)
    }
  }

  if (isLoading || !persona) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  const difficulty = difficultyConfig[persona.difficulty]

  return (
    <CommunityDetailContent
      persona={persona}
      difficulty={difficulty}
      initialVoted={initialVoted}
      isCloning={isCloning}
      onTryIt={handleTryIt}
    />
  )
}

function CommunityDetailContent({
  persona,
  difficulty,
  initialVoted,
  isCloning,
  onTryIt,
}: {
  persona: Persona
  difficulty: { label: string; bg: string; text: string; border: string }
  initialVoted: boolean
  isCloning: boolean
  onTryIt: () => void
}) {
  const { hasVoted, voteCount, toggleVote } = useVote({
    targetType: 'persona',
    targetId: persona.id,
    initialVoted,
    initialCount: persona.upvotes || 0,
  })

  return (
    <div className="min-h-screen bg-background-dark">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background-dark/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3">
          <Link
            href="/community"
            className="flex items-center justify-center p-2 -ml-2 rounded-full text-white hover:bg-white/10 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-white tracking-tight">Persona Detail</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-32 space-y-6">
        {/* Header card */}
        <div className="bg-surface-dark rounded-2xl p-6 border border-white/5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">{persona.name}</h2>
              <p className="text-slate-400">{persona.title}</p>
            </div>
            <span className={`${difficulty.bg} ${difficulty.text} text-xs font-bold px-3 py-1 rounded-full border ${difficulty.border}`}>
              {difficulty.label}
            </span>
          </div>

          <p className="text-slate-300 text-sm leading-relaxed mb-4">{persona.description}</p>

          {/* Tags */}
          {persona.tags && persona.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {persona.tags.map(tag => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-0.5 rounded-full bg-whispie-primary/10 text-whispie-primary font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <button
              onClick={toggleVote}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                hasVoted
                  ? 'bg-whispie-primary/20 text-whispie-primary'
                  : 'bg-white/5 hover:text-whispie-primary hover:bg-whispie-primary/10'
              }`}
            >
              <svg className="w-4 h-4" fill={hasVoted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              {voteCount} upvotes
            </button>
            <span>{persona.use_count || 0} uses</span>
          </div>
        </div>

        {/* Personality traits */}
        {persona.personality_traits && persona.personality_traits.length > 0 && (
          <div className="bg-surface-dark rounded-2xl p-6 border border-white/5">
            <h3 className="text-white font-bold mb-3">Personality Traits</h3>
            <div className="flex flex-wrap gap-2">
              {persona.personality_traits.map(trait => (
                <span
                  key={trait}
                  className="px-3 py-1.5 rounded-full text-sm bg-white/5 text-slate-300 border border-white/10"
                >
                  {trait}
                </span>
              ))}
            </div>
            <div className="mt-3 text-sm text-slate-400">
              <span className="font-medium text-slate-300">Communication style:</span>{' '}
              {persona.communication_style}
            </div>
          </div>
        )}

        {/* Behavioral rules */}
        {persona.custom_qa && persona.custom_qa.length > 0 && (
          <div className="bg-surface-dark rounded-2xl p-6 border border-white/5">
            <h3 className="text-white font-bold mb-3">Behavioral Rules</h3>
            <QAEditor value={persona.custom_qa} onChange={() => {}} readOnly />
          </div>
        )}
      </main>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background-dark/95 backdrop-blur-sm border-t border-white/10 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={onTryIt}
            disabled={isCloning}
            className="w-full py-3.5 rounded-2xl bg-whispie-primary text-background-dark font-bold text-base hover:brightness-110 transition-all disabled:opacity-50 shadow-lg shadow-whispie-primary/20"
          >
            {isCloning ? 'Cloning...' : 'Try It — Add to My Library'}
          </button>
        </div>
      </div>
    </div>
  )
}
