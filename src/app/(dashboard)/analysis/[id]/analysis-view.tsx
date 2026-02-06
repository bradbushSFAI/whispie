'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Analysis, Conversation, Scenario, Persona } from '@/types/database'

type ConversationWithDetails = Conversation & {
  scenario: Scenario
  persona: Persona
}

function ScoreCircle({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 40
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative w-20 h-20">
      <svg className="w-full h-full -rotate-90">
        <circle
          cx="40"
          cy="40"
          r="36"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-white/10"
        />
        <circle
          cx="40"
          cy="40"
          r="36"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-whispie-primary"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-bold text-white">{score}</span>
      </div>
    </div>
  )
}

function RadarChart({ scores }: { scores: { label: string; score: number }[] }) {
  const cx = 170
  const cy = 120
  const maxR = 80

  // 4 axes: top, right, bottom, left (diamond orientation)
  const axes = [
    { dx: 0, dy: -1 },  // top
    { dx: 1, dy: 0 },   // right
    { dx: 0, dy: 1 },   // bottom
    { dx: -1, dy: 0 },  // left
  ]

  const gridLevels = [0.25, 0.5, 0.75, 1]

  const getPoint = (axisIndex: number, fraction: number) => {
    const { dx, dy } = axes[axisIndex]
    return {
      x: cx + dx * maxR * fraction,
      y: cy + dy * maxR * fraction,
    }
  }

  const gridPolygons = gridLevels.map((level) =>
    axes.map((_, i) => getPoint(i, level)).map((p) => `${p.x},${p.y}`).join(' ')
  )

  const scorePoints = scores.map((s, i) => getPoint(i, Math.max(s.score, 5) / 100))
  const scorePolygon = scorePoints.map((p) => `${p.x},${p.y}`).join(' ')

  // Label positions offset further from the axis endpoints
  const labelOffsets = [
    { x: cx, y: cy - maxR - 22, anchor: 'middle' as const },       // top
    { x: cx + maxR + 10, y: cy, anchor: 'start' as const },        // right
    { x: cx, y: cy + maxR + 24, anchor: 'middle' as const },       // bottom
    { x: cx - maxR - 10, y: cy, anchor: 'end' as const },          // left
  ]

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 340 240" className="w-full max-w-[340px]">
        {/* Grid diamonds */}
        {gridPolygons.map((points, i) => (
          <polygon
            key={i}
            points={points}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={i === gridLevels.length - 1 ? 1.5 : 0.75}
          />
        ))}

        {/* Axis lines */}
        {axes.map((_, i) => {
          const end = getPoint(i, 1)
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={end.x}
              y2={end.y}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={0.75}
            />
          )
        })}

        {/* Filled score area */}
        <polygon
          points={scorePolygon}
          fill="rgba(56,224,123,0.20)"
          stroke="#38e07b"
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Score dots */}
        {scorePoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={4}
            fill="#38e07b"
          />
        ))}

        {/* Labels + score values */}
        {scores.map((s, i) => {
          const pos = labelOffsets[i]
          return (
            <g key={i}>
              <text
                x={pos.x}
                y={pos.y - 6}
                textAnchor={pos.anchor}
                dominantBaseline="auto"
                className="fill-slate-300 text-[11px] font-medium"
              >
                {s.label}
              </text>
              <text
                x={pos.x}
                y={pos.y + 8}
                textAnchor={pos.anchor}
                dominantBaseline="auto"
                className="fill-white text-[13px] font-bold"
              >
                {s.score}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export function AnalysisView({
  conversation,
  initialAnalysis,
  userName,
}: {
  conversation: ConversationWithDetails
  initialAnalysis: Analysis | null
  userName: string
}) {
  const router = useRouter()
  const [analysis, setAnalysis] = useState<Analysis | null>(initialAnalysis)
  const [isLoading, setIsLoading] = useState(!initialAnalysis)
  const [error, setError] = useState<string | null>(null)

  const generateAnalysis = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/conversations/${conversation.id}/analyze`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to generate analysis')
      }

      const data = await response.json()
      setAnalysis(data.analysis)
    } catch (err) {
      console.error('Analysis error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate analysis. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [conversation.id])

  useEffect(() => {
    if (!initialAnalysis) {
      generateAnalysis()
    }
  }, [initialAnalysis, generateAnalysis])

  const { scenario, persona } = conversation

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 border-4 border-whispie-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-white font-bold text-lg">Analyzing your conversation...</p>
        <p className="text-slate-300 text-sm mt-2">This may take a moment</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center p-6">
        <p className="text-red-400 font-bold text-lg mb-4">{error}</p>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/scenarios')}
            className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            Back to Menu
          </button>
          <button
            onClick={generateAnalysis}
            className="bg-whispie-primary text-background-dark font-bold px-6 py-3 rounded-xl"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return null
  }

  return (
    <div className="min-h-screen bg-background-dark">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background-dark/95 backdrop-blur-sm border-b border-white/10 p-4 flex items-center justify-between">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-white flex size-10 items-center justify-center rounded-full hover:bg-white/10 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-white text-lg font-bold">Analysis</h2>
        <button
          onClick={() => router.push('/dashboard')}
          className="text-whispie-primary font-bold text-base"
        >
          Done
        </button>
      </header>

      <div className="pb-32">
        {/* Hero Section */}
        <div className="flex flex-col items-center px-6 pt-6 pb-4 text-center">
          <div className="mb-4 relative">
            <ScoreCircle score={analysis.overall_score || 0} />
            <div className="absolute -bottom-2 -right-2 bg-background-dark rounded-full p-1 border-4 border-background-dark">
              <svg className="w-5 h-5 text-whispie-primary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
              </svg>
            </div>
          </div>
          <h2 className="text-white text-2xl font-bold leading-tight mb-2">
            {(analysis.overall_score || 0) >= 80 ? 'Great job' : (analysis.overall_score || 0) >= 60 ? 'Good effort' : 'Keep practicing'}, {userName}!
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed max-w-xs mx-auto">
            {analysis.summary}
          </p>
        </div>

        {/* Score Breakdown */}
        <div className="px-4 py-4">
          <h3 className="text-white text-lg font-bold mb-4 px-1">Score Breakdown</h3>
          <div className="bg-surface-dark rounded-xl p-4 border border-white/5">
            <RadarChart
              scores={[
                { label: 'Clarity', score: analysis.clarity_score || 0 },
                { label: 'Empathy', score: analysis.empathy_score || 0 },
                { label: 'Assertiveness', score: analysis.assertiveness_score || 0 },
                { label: 'Professionalism', score: analysis.professionalism_score || 0 },
              ]}
            />
          </div>
        </div>

        {/* Strengths */}
        {analysis.strengths && analysis.strengths.length > 0 && (
          <div className="px-4 py-4">
            <h3 className="text-white text-lg font-bold mb-4 px-1">What You Did Well</h3>
            <div className="space-y-3">
              {analysis.strengths.map((strength, i) => (
                <div
                  key={i}
                  className="bg-surface-dark rounded-xl p-4 border-l-4 border-whispie-primary"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-1.5 bg-whispie-primary/10 rounded-full text-whispie-primary shrink-0">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{strength}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Improvements */}
        {analysis.improvements && analysis.improvements.length > 0 && (
          <div className="px-4 py-4">
            <h3 className="text-white text-lg font-bold mb-4 px-1">Areas to Improve</h3>
            <div className="space-y-3">
              {analysis.improvements.map((improvement, i) => (
                <div
                  key={i}
                  className="bg-surface-dark rounded-xl p-4 border-l-4 border-orange-400"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-1.5 bg-orange-400/10 rounded-full text-orange-400 shrink-0">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z"/>
                      </svg>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{improvement}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scenario Context */}
        <div className="px-4 py-4">
          <div className="bg-surface-dark rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-subtle-dark flex items-center justify-center text-lg">
                {persona.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{persona.name}</h3>
                <p className="text-xs text-slate-300">{persona.title}</p>
              </div>
            </div>
            <p className="text-sm text-slate-300">
              Scenario: {scenario.title}
            </p>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-background-dark/95 backdrop-blur-md border-t border-white/10 p-4 pb-8 flex gap-3">
        <button
          onClick={() => router.push('/scenarios')}
          className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-3.5 px-4 rounded-xl transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>New Scenario</span>
        </button>
        <button
          onClick={() => router.push(`/chat/new?scenario=${scenario.id}`)}
          className="flex-1 flex items-center justify-center gap-2 bg-whispie-primary hover:brightness-110 text-background-dark font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-whispie-primary/25"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Try Again</span>
        </button>
      </div>
    </div>
  )
}
