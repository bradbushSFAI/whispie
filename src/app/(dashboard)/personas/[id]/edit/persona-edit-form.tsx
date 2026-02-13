'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { QAEditor } from '@/components/personas/qa-editor'
import { AvatarPicker } from '@/components/personas/avatar-picker'
import { ALL_TRAITS, COMMUNICATION_STYLES } from '@/lib/personas/relationship-types'
import type { Persona, CustomQA } from '@/types/database'

type LinkedScenario = {
  id: string
  title: string
  category: string
  context: string
  objectives: string[]
}

export function PersonaEditForm({
  persona,
  scenarios,
}: {
  persona: Persona
  scenarios: LinkedScenario[]
}) {
  const router = useRouter()
  const [name, setName] = useState(persona.name)
  const [title, setTitle] = useState(persona.title)
  const [description, setDescription] = useState(persona.description)
  const [traits, setTraits] = useState<string[]>(persona.personality_traits || [])
  const [commStyle, setCommStyle] = useState(persona.communication_style)
  const [difficulty, setDifficulty] = useState(persona.difficulty)
  const [customQa, setCustomQa] = useState<CustomQA[]>(persona.custom_qa || [])
  const [avatarUrl, setAvatarUrl] = useState(persona.avatar_url || '')
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const toggleTrait = (trait: string) => {
    setTraits(prev =>
      prev.includes(trait) ? prev.filter(t => t !== trait) : [...prev, trait]
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaved(false)

    try {
      const res = await fetch(`/api/personas/${persona.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          title: title.trim(),
          description: description.trim(),
          personality_traits: traits,
          communication_style: commStyle,
          difficulty,
          custom_qa: customQa.filter(qa => qa.trigger.trim() && qa.response.trim()),
          avatar_url: avatarUrl,
        }),
      })

      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-dark">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background-dark/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3">
          <Link
            href="/hub"
            className="flex items-center justify-center p-2 -ml-2 rounded-full text-white hover:bg-white/10 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-white tracking-tight">Edit Persona</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-32 space-y-8">
        {/* Basic Info */}
        <section className="space-y-4">
          <h2 className="text-white font-bold text-lg">Basic Info</h2>
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1.5 block">Name</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-surface-dark border-white/10 text-white"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1.5 block">Title</label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="bg-surface-dark border-white/10 text-white"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1.5 block">Description</label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              className="bg-surface-dark border-white/10 text-white"
            />
          </div>
          <AvatarPicker
            value={avatarUrl}
            onChange={setAvatarUrl}
            personaName={name}
          />
        </section>

        {/* Personality */}
        <section className="space-y-4">
          <h2 className="text-white font-bold text-lg">Personality</h2>
          <div className="flex flex-wrap gap-2">
            {ALL_TRAITS.map(trait => (
              <button
                key={trait}
                onClick={() => toggleTrait(trait)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  traits.includes(trait)
                    ? 'bg-whispie-primary text-background-dark'
                    : 'bg-surface-dark text-slate-300 border border-white/10 hover:border-white/20'
                }`}
              >
                {trait}
              </button>
            ))}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300 mb-1.5 block">Communication Style</label>
            <select
              value={commStyle}
              onChange={e => setCommStyle(e.target.value)}
              className="flex h-9 w-full rounded-md border border-white/10 bg-surface-dark px-3 py-1 text-sm text-white shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {COMMUNICATION_STYLES.map(style => (
                <option key={style} value={style}>
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">Difficulty</label>
            <div className="flex gap-3">
              {(['easy', 'medium', 'hard'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold uppercase transition-all ${
                    difficulty === d
                      ? d === 'easy' ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                      : d === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                      : 'bg-red-500/20 text-red-400 border border-red-500/50'
                      : 'bg-surface-dark text-slate-400 border border-white/10 hover:border-white/20'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Behavioral Rules */}
        <section className="space-y-4">
          <h2 className="text-white font-bold text-lg">Behavioral Rules</h2>
          <QAEditor value={customQa} onChange={setCustomQa} />
        </section>

        {/* Linked Scenarios - removed, now managed from Hub */}
      </main>

      {/* Save bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background-dark/95 backdrop-blur-sm border-t border-white/10 p-4">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={handleSave}
            disabled={isSaving || !name.trim() || !title.trim()}
            className="w-full bg-whispie-primary hover:brightness-110 text-background-dark font-bold"
          >
            {isSaving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
