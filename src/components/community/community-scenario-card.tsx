'use client'

import { useState } from 'react'
import { useVote } from '@/hooks/use-vote'
import { getPersonaAvatarUrl } from '@/lib/utils'
import type { Scenario } from '@/types/database'

const difficultyConfig = {
  easy: { label: 'EASY', bg: 'bg-green-900/30', text: 'text-green-400' },
  medium: { label: 'MED', bg: 'bg-yellow-900/30', text: 'text-yellow-400' },
  hard: { label: 'HARD', bg: 'bg-red-900/30', text: 'text-red-400' },
}

const personaTypeConfig = {
  boss: { label: 'BOSS', bg: 'bg-purple-900/30', text: 'text-purple-400' },
  peer: { label: 'COWORKER', bg: 'bg-blue-900/30', text: 'text-blue-400' },
  employee: { label: 'EMPLOYEE', bg: 'bg-emerald-900/30', text: 'text-emerald-400' },
  client: { label: 'CLIENT', bg: 'bg-orange-900/30', text: 'text-orange-400' },
  hr: { label: 'HR', bg: 'bg-pink-900/30', text: 'text-pink-400' },
}

type CommunityScenarioCardProps = {
  scenario: Scenario & {
    persona?: { id: string; name: string; title: string; difficulty: string; tags: string[] | null; avatar_url: string | null } | null
    creator?: { display_name: string } | null
  }
  initialVoted: boolean
  onTryIt: (scenarioId: string) => void
  isCloning: boolean
  currentUserId?: string
  onDeleted?: (id: string) => void
}

export function CommunityScenarioCard({ scenario, initialVoted, onTryIt, isCloning, currentUserId, onDeleted }: CommunityScenarioCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const difficulty = difficultyConfig[scenario.difficulty]
  const persona = Array.isArray(scenario.persona) ? scenario.persona[0] : scenario.persona
  const { hasVoted, voteCount, toggleVote, isLoading: isVoting } = useVote({
    targetType: 'scenario',
    targetId: scenario.id,
    initialVoted,
    initialCount: scenario.upvotes || 0,
  })

  const canDelete = currentUserId && scenario.created_by === currentUserId

  const handleDelete = async () => {
    if (!window.confirm('Remove from community?')) {
      return
    }

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/community/scenarios/${scenario.id}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        onDeleted?.(scenario.id)
      }
    } catch (error) {
      console.error('Failed to delete scenario:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  // Get the persona type badge from tags
  const personaType = persona?.tags?.find((tag: string) => personaTypeConfig[tag as keyof typeof personaTypeConfig])
  const personaTypeStyle = personaType ? personaTypeConfig[personaType as keyof typeof personaTypeConfig] : null

  return (
    <div className="bg-surface-dark rounded-2xl p-5 border border-white/5">
      {/* Top row: Persona info with avatar */}
      {persona && (
        <div className="flex items-center gap-3 mb-3">
          <img
            src={getPersonaAvatarUrl(persona.name, persona.avatar_url)}
            alt={`${persona.name} avatar`}
            className="w-12 h-12 rounded-xl object-cover ring-1 ring-white/10"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-semibold text-sm">{persona.name}</span>
              {personaTypeStyle && (
                <span className={`${personaTypeStyle.bg} ${personaTypeStyle.text} text-[10px] font-bold px-2 py-0.5 rounded-full`}>
                  {personaTypeStyle.label}
                </span>
              )}
              <span className={`${difficulty.bg} ${difficulty.text} text-[10px] font-bold px-2 py-0.5 rounded-full`}>
                {difficulty.label}
              </span>
            </div>
            <p className="text-slate-400 text-xs">{persona.title}</p>
          </div>
        </div>
      )}

      {/* Creator info */}
      <div className="mb-3">
        <p className="text-slate-300 text-xs">
          Created by {
            scenario.created_by === currentUserId
              ? 'you'
              : Array.isArray(scenario.creator)
                ? scenario.creator[0]?.display_name || 'Community Member'
                : scenario.creator?.display_name || 'Community Member'
          }
        </p>
      </div>

      {/* Middle: Scenario title and category */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-white font-bold text-lg flex-1">{scenario.title}</h3>
          <span className="text-xs font-semibold text-whispie-primary uppercase tracking-wider px-2 py-1 bg-whispie-primary/10 rounded-md">
            {scenario.category}
          </span>
        </div>

        {/* Description */}
        {scenario.context && (
          <p className="text-slate-400 text-sm line-clamp-2">{scenario.context}</p>
        )}
      </div>

      {/* Bottom: Stats and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>{scenario.objectives?.length || 0} objectives</span>
            <span>{scenario.use_count || 0} uses</span>
          </div>
          
          {/* Upvote button */}
          <button
            onClick={toggleVote}
            disabled={isVoting}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
              hasVoted
                ? 'bg-whispie-primary/20 text-whispie-primary'
                : 'bg-white/5 text-slate-400 hover:text-whispie-primary hover:bg-whispie-primary/10'
            }`}
          >
            <svg className="w-3 h-3" fill={hasVoted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            {voteCount}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/40 transition-all disabled:opacity-50"
              title="Remove from community"
            >
              {isDeleting ? (
                <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
          )}
          
          <button
            onClick={() => onTryIt(scenario.id)}
            disabled={isCloning}
            className="text-xs px-4 py-2 rounded-lg bg-whispie-primary text-background-dark font-bold hover:brightness-110 transition-all disabled:opacity-50"
          >
            {isCloning ? '...' : 'Try It'}
          </button>
        </div>
      </div>
    </div>
  )
}
