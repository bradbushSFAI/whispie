'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function NewScenarioForPersonaPage() {
  const router = useRouter()
  const params = useParams()
  const personaId = params.id as string

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('conflict')
  const [context, setContext] = useState('')
  const [objectives, setObjectives] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = title.trim() && context.trim()

  const handleSubmit = async () => {
    if (!canSubmit) return
    setIsSubmitting(true)
    setError(null)

    try {
      const objectivesList = objectives
        .split('\n')
        .map(o => o.trim())
        .filter(Boolean)

      const res = await fetch('/api/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          category,
          context: context.trim(),
          objectives: objectivesList.length > 0 ? objectivesList : ['Practice this conversation effectively'],
          persona_id: personaId,
          difficulty: 'medium',
        }),
      })

      if (!res.ok) throw new Error('Failed to create scenario')

      const { scenario } = await res.json()
      // Start practicing immediately
      router.push(`/chat/new?scenario=${scenario.id}`)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-dark">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background-dark/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3">
          <Link
            href="/personas/my"
            className="flex items-center justify-center p-2 -ml-2 rounded-full text-white hover:bg-white/10 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-white tracking-tight">Create Scenario</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-32 space-y-5">
        <div>
          <h2 className="text-xl font-bold text-white mb-2">What do you want to practice?</h2>
          <p className="text-slate-400 text-sm">
            Describe the situation you want to practice. You&apos;ll start a conversation right away.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-300 mb-1.5 block">Scenario Title</label>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder='e.g. "Asking for a raise" or "Pushing back on scope creep"'
            className="bg-surface-dark border-white/10 text-white placeholder:text-slate-500"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-300 mb-1.5 block">Category</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="flex h-9 w-full rounded-md border border-white/10 bg-surface-dark px-3 py-1 text-sm text-white shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="feedback">Feedback</option>
            <option value="negotiation">Negotiation</option>
            <option value="conflict">Conflict</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-300 mb-1.5 block">Context</label>
          <Textarea
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder="Describe the situation — what happened, what you need to address..."
            rows={3}
            className="bg-surface-dark border-white/10 text-white placeholder:text-slate-500"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-300 mb-1.5 block">Your Objectives (one per line)</label>
          <Textarea
            value={objectives}
            onChange={e => setObjectives(e.target.value)}
            placeholder={"Address the issue calmly\nGet commitment to change\nMaintain the relationship"}
            rows={2}
            className="bg-surface-dark border-white/10 text-white placeholder:text-slate-500"
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}
      </main>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background-dark/95 backdrop-blur-sm border-t border-white/10 p-4">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="w-full bg-whispie-primary hover:brightness-110 text-background-dark font-bold"
          >
            {isSubmitting ? 'Creating...' : 'Create & Start Practicing'}
          </Button>
        </div>
      </div>
    </div>
  )
}
