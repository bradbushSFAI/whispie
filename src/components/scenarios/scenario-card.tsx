'use client'

import Link from 'next/link'
import type { Scenario, Persona } from '@/types/database'

type ScenarioWithPersona = Scenario & {
  persona: Persona | null
}

const difficultyConfig = {
  easy: {
    label: 'EASY',
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
  },
  medium: {
    label: 'MED',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-400',
  },
  hard: {
    label: 'HARD',
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
  },
}

export function ScenarioCard({ scenario }: { scenario: ScenarioWithPersona }) {
  const difficulty = difficultyConfig[scenario.difficulty]
  const estimatedMinutes = scenario.estimated_turns * 1.5

  return (
    <Link href={`/chat/new?scenario=${scenario.id}`}>
      <article className="group relative flex flex-col bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-sm ring-1 ring-gray-100 dark:ring-white/5 overflow-hidden active:scale-[0.99] transition-transform duration-200 hover:ring-whispie-primary/50">
        <div className="flex gap-4">
          {/* Avatar placeholder */}
          <div className="shrink-0 relative">
            <div className="w-16 h-16 rounded-xl bg-gray-200 dark:bg-subtle-dark overflow-hidden ring-1 ring-black/5 dark:ring-white/10 flex items-center justify-center">
              <span className="text-2xl">
                {scenario.persona?.name.charAt(0) || '?'}
              </span>
            </div>
            <div className={`absolute -bottom-2 -right-2 ${difficulty.bg} ${difficulty.text} text-[10px] font-bold px-2 py-0.5 rounded-full ring-2 ring-white dark:ring-surface-dark`}>
              {difficulty.label}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-whispie-primary uppercase tracking-wider">
                {scenario.category}
              </span>
              <span className="text-gray-400 dark:text-gray-400 text-xs">
                {Math.round(estimatedMinutes)} min
              </span>
            </div>
            <h3 className="text-gray-900 dark:text-white font-bold text-lg leading-tight truncate mb-1">
              {scenario.title}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-snug line-clamp-2 mb-2">
              {scenario.description}
            </p>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <span className="text-[14px]">AI</span>
                <span>{scenario.persona?.name} ({scenario.persona?.title})</span>
              </div>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-whispie-primary text-black shadow-lg shadow-whispie-primary/20 group-hover:bg-whispie-primary-dark transition-colors">
                <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
