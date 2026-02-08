'use client'

import { useState } from 'react'

type DimensionKey = 'clarity' | 'empathy' | 'assertiveness' | 'professionalism'

const dimensionInfo: Record<DimensionKey, { description: string; tips: string }> = {
  clarity: {
    description: 'How clear and easy to understand your message was.',
    tips: 'Use simple language, avoid jargon, and structure your thoughts logically.',
  },
  empathy: {
    description: 'How well you acknowledged others\' feelings and perspectives.',
    tips: 'Listen actively, validate emotions, and show understanding before responding.',
  },
  assertiveness: {
    description: 'How confidently you expressed your needs while respecting others.',
    tips: 'Be direct but respectful, use "I" statements, and stand firm on key points.',
  },
  professionalism: {
    description: 'How well you maintained a professional tone and demeanor.',
    tips: 'Stay calm, avoid emotional language, and keep focused on solutions.',
  },
}

export function DimensionTooltip({ dimension }: { dimension: DimensionKey }) {
  const [isOpen, setIsOpen] = useState(false)
  const info = dimensionInfo[dimension]

  return (
    <div className="relative inline-block">
      <button
        className="inline-flex items-center justify-center w-4 h-4 ml-1 text-slate-400 dark:text-slate-500 hover:text-whispie-primary dark:hover:text-whispie-primary transition-colors"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onTouchStart={() => setIsOpen(true)}
        onTouchEnd={() => setTimeout(() => setIsOpen(false), 2000)}
        onClick={(e) => {
          e.preventDefault()
          setIsOpen(!isOpen)
        }}
        aria-label={`Info about ${dimension}`}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
        </svg>
      </button>

      {/* Tooltip */}
      {isOpen && (
        <div className="absolute z-50 w-64 p-3 bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 rounded-lg shadow-xl left-1/2 -translate-x-1/2 bottom-full mb-2">
          <div className="text-xs space-y-2">
            <p className="font-semibold text-slate-900 dark:text-white">
              {info.description}
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              <span className="font-medium">Tip:</span> {info.tips}
            </p>
          </div>
          {/* Arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 top-full">
            <div className="border-8 border-transparent border-t-white dark:border-t-surface-dark" />
          </div>
        </div>
      )}
    </div>
  )
}
