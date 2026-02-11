'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Persona } from '@/types/database'

type ShareDialogProps = {
  persona: Persona
  onClose: () => void
  onShared: () => void
}

function suggestGenericName(persona: Persona): string {
  const tagLabels: Record<string, string> = {
    boss: 'Boss',
    peer: 'Coworker',
    employee: 'Direct Report',
    client: 'Client',
    hr: 'HR Contact',
    other: 'Contact',
  }
  const tag = persona.tags?.[0]
  const typeLabel = tag ? tagLabels[tag] || 'Contact' : 'Contact'
  const trait = persona.personality_traits?.[0]
  if (trait) {
    return `The ${trait.charAt(0).toUpperCase() + trait.slice(1)} ${typeLabel}`
  }
  return `The Difficult ${typeLabel}`
}

export function ShareDialog({ persona, onClose, onShared }: ShareDialogProps) {
  const [name, setName] = useState(suggestGenericName(persona))
  const [title, setTitle] = useState(persona.title)
  const [description, setDescription] = useState(persona.description)
  const [confirmed, setConfirmed] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleShare = async () => {
    if (!confirmed) return
    setIsSharing(true)
    setError(null)

    try {
      const res = await fetch(`/api/personas/${persona.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          title: title.trim(),
          description: description.trim(),
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
        <h2 className="text-xl font-bold text-white mb-1">Share to Community</h2>
        <p className="text-sm text-slate-400 mb-6">
          A sanitized copy will be shared. Your original persona stays unchanged.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1.5 block">
              Public Name
            </label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Generic name (no real names)"
              className="bg-slate-900 border-slate-600 text-white"
            />
            <p className="text-xs text-slate-500 mt-1">
              Use a generic name — no real names or identifying info
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300 mb-1.5 block">
              Title
            </label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="bg-slate-900 border-slate-600 text-white"
            />
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

          {/* Confirmation checkbox */}
          <label className="flex items-start gap-3 cursor-pointer py-2">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-900 text-whispie-primary focus:ring-whispie-primary"
            />
            <span className="text-sm text-slate-300">
              I confirm this doesn&apos;t contain identifying information about real people
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
            disabled={!confirmed || !name.trim() || !title.trim() || isSharing}
            className="flex-1 bg-whispie-primary hover:brightness-110 text-background-dark font-bold"
          >
            {isSharing ? 'Sharing...' : 'Share to Community'}
          </Button>
        </div>
      </div>
    </div>
  )
}
