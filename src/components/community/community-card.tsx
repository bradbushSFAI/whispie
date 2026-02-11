'use client'

import Link from 'next/link'
import { useVote } from '@/hooks/use-vote'
import type { Persona } from '@/types/database'

const difficultyConfig = {
  easy: { label: 'EASY', bg: 'bg-green-900/30', text: 'text-green-400' },
  medium: { label: 'MED', bg: 'bg-yellow-900/30', text: 'text-yellow-400' },
  hard: { label: 'HARD', bg: 'bg-red-900/30', text: 'text-red-400' },
}

type CommunityCardProps = {
  persona: Persona
  initialVoted: boolean
  onTryIt: (personaId: string) => void
  isCloning: boolean
}

export function CommunityCard({ persona, initialVoted, onTryIt, isCloning }: CommunityCardProps) {
  const difficulty = difficultyConfig[persona.difficulty]
  const { hasVoted, voteCount, toggleVote, isLoading: isVoting } = useVote({
    targetType: 'persona',
    targetId: persona.id,
    initialVoted,
    initialCount: persona.upvotes || 0,
  })

  return (
    <div className="bg-surface-dark rounded-2xl p-5 border border-white/5">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-bold text-lg truncate">{persona.name}</h3>
            <span className={`${difficulty.bg} ${difficulty.text} text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0`}>
              {difficulty.label}
            </span>
          </div>
          <p className="text-slate-400 text-sm">{persona.title}</p>
        </div>

        {/* Upvote button */}
        <button
          onClick={toggleVote}
          disabled={isVoting}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium transition-all shrink-0 ml-3 ${
            hasVoted
              ? 'bg-whispie-primary/20 text-whispie-primary'
              : 'bg-white/5 text-slate-400 hover:text-whispie-primary hover:bg-whispie-primary/10'
          }`}
        >
          <svg className="w-4 h-4" fill={hasVoted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
          {voteCount}
        </button>
      </div>

      {/* Description */}
      <p className="text-slate-400 text-sm line-clamp-2 mb-3">{persona.description}</p>

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

      {/* Stats + actions */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>{persona.use_count || 0} uses</span>
          <span>{persona.custom_qa?.length || 0} rules</span>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/community/${persona.id}`}
            className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 font-medium hover:bg-white/10 transition-colors"
          >
            Details
          </Link>
          <button
            onClick={() => onTryIt(persona.id)}
            disabled={isCloning}
            className="text-xs px-4 py-1.5 rounded-lg bg-whispie-primary text-background-dark font-bold hover:brightness-110 transition-all disabled:opacity-50"
          >
            {isCloning ? '...' : 'Try It'}
          </button>
        </div>
      </div>
    </div>
  )
}
