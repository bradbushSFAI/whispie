'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Scenario } from '@/types/database'

type ScenarioShareDialogProps = {
  scenario: Scenario
  onClose: () => void
  onShared: () => void
}

function suggestGenericTitle(scenario: Scenario): string {
  // Remove potentially identifying information from the title
  const words = scenario.title.toLowerCase().split(' ')
  const genericWords = words.filter(word =>
    !word.includes('@') &&
    !word.includes('.com') &&
    !word.includes('inc') &&
    !word.includes('corp') &&
    word.length > 2
  )

  if (genericWords.length > 0) {
    return genericWords.map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  return `${scenario.category} Challenge`
}

export function ScenarioShareDialog({ scenario, onClose, onShared }: ScenarioShareDialogProps) {
  const [title, setTitle] = useState(suggestGenericTitle(scenario))
  const [description, setDescription] = useState(scenario.description)
  const [context, setContext] = useState(scenario.context)
  const [confirmed, setConfirmed] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleShare = async () => {
    if (!confirmed) return
    setIsSharing(true)
    setError(null)

    try {
      const res = await fetch(`/api/scenarios/${scenario.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          context: context.trim(),
        }),
      })

      if (!res.ok) throw new Error('Failed to share')
      onShared()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-surface-dark rounded-2xl border border-white/10 w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-1">Share Scenario to Community</h2>
        <p className="text-sm text-slate-400 mb-6">
          A sanitized copy will be shared. Your original scenario stays unchanged.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1.5 block">
              Public Title
            </label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Generic title (no company names)"
              className="bg-slate-900 border-slate-600 text-white"
            />
            <p className="text-xs text-slate-500 mt-1">
              Use a generic title — no company names or identifying info
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300 mb-1.5 block">
              Description
            </label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="bg-slate-900 border-slate-600 text-white"
            />
            <p className="text-xs text-slate-500 mt-1">
              Remove any identifying details (company names, real names, etc.)
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300 mb-1.5 block">
              Context
            </label>
            <Textarea
              value={context}
              onChange={e => setContext(e.target.value)}
              rows={3}
              className="bg-slate-900 border-slate-600 text-white"
            />
            <p className="text-xs text-slate-500 mt-1">
              Remove any identifying details (company names, real names, etc.)
            </p>
          </div>

          {/* Confirmation checkbox */}
          <label className="flex items-start gap-3 cursor-pointer py-2">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-900 text-whispie-primary focus:ring-whispie-primary"
            />
            <span className="text-sm text-slate-300">
              I confirm this doesn&apos;t contain identifying information about real people or companies
            </span>
          </label>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1 text-slate-400"
          >
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={!confirmed || !title.trim() || !description.trim() || isSharing}
            className="flex-1 bg-whispie-primary hover:brightness-110 text-background-dark font-bold"
          >
            {isSharing ? 'Sharing...' : 'Share to Community'}
          </Button>
        </div>
      </div>
    </div>
  )
}