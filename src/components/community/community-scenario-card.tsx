'use client'

import { useVote } from '@/hooks/use-vote'
import type { Scenario } from '@/types/database'

const difficultyConfig = {
  easy: { label: 'EASY', bg: 'bg-green-900/30', text: 'text-green-400' },
  medium: { label: 'MED', bg: 'bg-yellow-900/30', text: 'text-yellow-400' },
  hard: { label: 'HARD', bg: 'bg-red-900/30', text: 'text-red-400' },
}

type CommunityScenarioCardProps = {
  scenario: Scenario & { persona?: { id: string; name: string; title: string; difficulty: string } | null }
  initialVoted: boolean
  onTryIt: (scenarioId: string) => void
  isCloning: boolean
}

export function CommunityScenarioCard({ scenario, initialVoted, onTryIt, isCloning }: CommunityScenarioCardProps) {
  const difficulty = difficultyConfig[scenario.difficulty]
  const persona = Array.isArray(scenario.persona) ? scenario.persona[0] : scenario.persona
  const { hasVoted, voteCount, toggleVote, isLoading: isVoting } = useVote({
    targetType: 'scenario',
    targetId: scenario.id,
    initialVoted,
    initialCount: scenario.upvotes || 0,
  })

  return (
    <div className="bg-surface-dark rounded-2xl p-5 border border-white/5">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-whispie-primary uppercase tracking-wider">
              {scenario.category}
            </span>
            <span className={`${difficulty.bg} ${difficulty.text} text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0`}>
              {difficulty.label}
            </span>
          </div>
          <h3 className="text-white font-bold text-lg truncate">{scenario.title}</h3>
          {persona && (
            <p className="text-slate-400 text-sm">with {persona.name} — {persona.title}</p>
          )}
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
      {scenario.context && (
        <p className="text-slate-400 text-sm line-clamp-2 mb-3">{scenario.context}</p>
      )}

      {/* Stats + actions */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>{scenario.use_count || 0} uses</span>
          <span>{scenario.objectives?.length || 0} objectives</span>
        </div>
        <button
          onClick={() => onTryIt(scenario.id)}
          disabled={isCloning}
          className="text-xs px-4 py-1.5 rounded-lg bg-whispie-primary text-background-dark font-bold hover:brightness-110 transition-all disabled:opacity-50"
        >
          {isCloning ? '...' : 'Try It'}
        </button>
      </div>
    </div>
  )
}
