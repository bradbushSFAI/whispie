'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { QAEditor } from '@/components/personas/qa-editor'
import {
  RELATIONSHIP_TYPES,
  ALL_TRAITS,
  COMMUNICATION_STYLES,
  type RelationshipType,
} from '@/lib/personas/relationship-types'
import type { CustomQA } from '@/types/database'

type FormData = {
  relationshipType: RelationshipType | null
  name: string
  title: string
  description: string
  personality_traits: string[]
  communication_style: string
  difficulty: 'easy' | 'medium' | 'hard'
  custom_qa: CustomQA[]
  // Optional scenario
  scenario_title: string
  scenario_category: string
  scenario_context: string
  scenario_objectives: string
}

const INITIAL_FORM: FormData = {
  relationshipType: null,
  name: '',
  title: '',
  description: '',
  personality_traits: [],
  communication_style: 'direct',
  difficulty: 'medium',
  custom_qa: [],
  scenario_title: '',
  scenario_category: 'conflict',
  scenario_context: '',
  scenario_objectives: '',
}

export default function CreatePersonaPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalSteps = 5

  const canAdvance = () => {
    switch (step) {
      case 1: return form.relationshipType !== null
      case 2: return form.name.trim() && form.title.trim() && form.description.trim()
      case 3: return form.personality_traits.length > 0
      case 4: return true // Q&A is optional
      case 5: return true // Scenario is optional
      default: return false
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Create persona
      const personaRes = await fetch('/api/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          title: form.title.trim(),
          description: form.description.trim(),
          personality_traits: form.personality_traits,
          communication_style: form.communication_style,
          difficulty: form.difficulty,
          custom_qa: form.custom_qa.filter(qa => qa.trigger.trim() && qa.response.trim()),
          tags: form.relationshipType ? [form.relationshipType.tag] : [],
        }),
      })

      if (!personaRes.ok) {
        throw new Error('Failed to create persona')
      }

      const { persona } = await personaRes.json()

      // Create linked scenario if provided
      if (form.scenario_title.trim() && form.scenario_context.trim()) {
        const objectives = form.scenario_objectives
          .split('\n')
          .map(o => o.trim())
          .filter(Boolean)

        await fetch('/api/scenarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.scenario_title.trim(),
            category: form.scenario_category,
            context: form.scenario_context.trim(),
            objectives: objectives.length > 0 ? objectives : ['Practice this conversation effectively'],
            persona_id: persona.id,
            difficulty: form.difficulty,
          }),
        })
      }

      router.push('/personas/my')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleTrait = (trait: string) => {
    setForm(prev => ({
      ...prev,
      personality_traits: prev.personality_traits.includes(trait)
        ? prev.personality_traits.filter(t => t !== trait)
        : [...prev.personality_traits, trait],
    }))
  }

  const selectRelationship = (rt: RelationshipType) => {
    setForm(prev => ({
      ...prev,
      relationshipType: rt,
      personality_traits: [],
      custom_qa: rt.qaTemplates.map(t => ({
        trigger: '',
        response: '',
        category: t.category,
      })),
    }))
  }

  return (
    <div className="min-h-screen bg-background-dark">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background-dark/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : router.back()}
            className="flex items-center justify-center p-2 -ml-2 rounded-full text-white hover:bg-white/10 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-white tracking-tight">
            Create Persona
          </h1>
          <span className="text-sm text-slate-400 w-10 text-right">
            {step}/{totalSteps}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-white/10">
          <div
            className="h-full bg-whispie-primary transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-32">
        {/* Step 1: Relationship Type */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Who is this person?</h2>
            <p className="text-slate-400 text-sm mb-6">Select the relationship type</p>
            <div className="grid grid-cols-2 gap-3">
              {RELATIONSHIP_TYPES.map(rt => (
                <button
                  key={rt.key}
                  onClick={() => selectRelationship(rt)}
                  className={`flex flex-col items-center gap-2 p-5 rounded-2xl border transition-all text-center ${
                    form.relationshipType?.key === rt.key
                      ? 'border-whispie-primary bg-whispie-primary/10 ring-1 ring-whispie-primary'
                      : 'border-white/10 bg-surface-dark hover:border-white/20'
                  }`}
                >
                  <span className="text-3xl">{rt.icon}</span>
                  <span className="text-sm font-medium text-white">{rt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Basic Info */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Tell us about them</h2>
              <p className="text-slate-400 text-sm mb-6">This stays private — only you can see it</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1.5 block">Name</label>
              <Input
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="First name or nickname"
                className="bg-surface-dark border-white/10 text-white placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1.5 block">Their Role / Title</label>
              <Input
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder='e.g. "The Micromanaging VP" or "Senior Account Manager"'
                className="bg-surface-dark border-white/10 text-white placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1.5 block">Description</label>
              <Textarea
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this person — how they act, what makes them difficult, what they care about..."
                rows={4}
                className="bg-surface-dark border-white/10 text-white placeholder:text-slate-500"
              />
            </div>
          </div>
        )}

        {/* Step 3: Personality */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Their personality</h2>
              <p className="text-slate-400 text-sm">Select traits that describe them</p>
            </div>

            {/* Suggested traits */}
            {form.relationshipType && (
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Suggested</p>
                <div className="flex flex-wrap gap-2">
                  {form.relationshipType.suggestedTraits.map(trait => (
                    <button
                      key={trait}
                      onClick={() => toggleTrait(trait)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        form.personality_traits.includes(trait)
                          ? 'bg-whispie-primary text-background-dark'
                          : 'bg-surface-dark text-slate-300 border border-white/10 hover:border-white/20'
                      }`}
                    >
                      {trait}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* All traits */}
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">All traits</p>
              <div className="flex flex-wrap gap-2">
                {ALL_TRAITS
                  .filter(t => !form.relationshipType?.suggestedTraits.includes(t))
                  .map(trait => (
                    <button
                      key={trait}
                      onClick={() => toggleTrait(trait)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        form.personality_traits.includes(trait)
                          ? 'bg-whispie-primary text-background-dark'
                          : 'bg-surface-dark text-slate-300 border border-white/10 hover:border-white/20'
                      }`}
                    >
                      {trait}
                    </button>
                  ))}
              </div>
            </div>

            {/* Communication style */}
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1.5 block">Communication Style</label>
              <select
                value={form.communication_style}
                onChange={e => setForm(prev => ({ ...prev, communication_style: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-white/10 bg-surface-dark px-3 py-1 text-sm text-white shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {COMMUNICATION_STYLES.map(style => (
                  <option key={style} value={style}>
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Difficulty</label>
              <div className="flex gap-3">
                {(['easy', 'medium', 'hard'] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => setForm(prev => ({ ...prev, difficulty: d }))}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold uppercase transition-all ${
                      form.difficulty === d
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
          </div>
        )}

        {/* Step 4: Behavioral Rules (Q&A) */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Behavioral Rules</h2>
              <p className="text-slate-400 text-sm mb-1">
                How does this person react in specific situations?
              </p>
              <p className="text-slate-500 text-xs mb-6">
                These rules make the AI respond more like the real person. Optional but recommended.
              </p>
            </div>

            {/* Template prompts from relationship type */}
            {form.relationshipType && form.custom_qa.length > 0 && (
              <div className="bg-surface-dark rounded-xl p-4 border border-white/5 mb-4">
                <p className="text-xs uppercase tracking-wider text-slate-400 mb-3">
                  Fill in based on your experience with them
                </p>
                {form.relationshipType.qaTemplates.map((template, i) => (
                  <div key={i} className="mb-4 last:mb-0">
                    <label className="text-sm text-slate-300 mb-1.5 block font-medium">
                      {template.prompt}
                    </label>
                    <Textarea
                      value={form.custom_qa[i]?.response || ''}
                      onChange={e => {
                        const updated = [...form.custom_qa]
                        updated[i] = {
                          trigger: template.prompt.toLowerCase().replace(/[?'"]/g, ''),
                          response: e.target.value,
                          category: template.category,
                        }
                        setForm(prev => ({ ...prev, custom_qa: updated }))
                      }}
                      placeholder="Describe how they typically react..."
                      rows={2}
                      className="bg-slate-900 border-slate-600 text-slate-200 placeholder:text-slate-500"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Additional custom rules */}
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 mb-3">Additional rules</p>
              <QAEditor
                value={form.custom_qa.slice(form.relationshipType?.qaTemplates.length || 0)}
                onChange={newQa => {
                  const templateQa = form.custom_qa.slice(0, form.relationshipType?.qaTemplates.length || 0)
                  setForm(prev => ({ ...prev, custom_qa: [...templateQa, ...newQa] }))
                }}
              />
            </div>
          </div>
        )}

        {/* Step 5: Optional Scenario */}
        {step === 5 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Practice Scenario</h2>
              <p className="text-slate-400 text-sm mb-6">
                What situation do you want to practice? You can skip this and create scenarios later.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1.5 block">Scenario Title</label>
              <Input
                value={form.scenario_title}
                onChange={e => setForm(prev => ({ ...prev, scenario_title: e.target.value }))}
                placeholder='e.g. "Asking for a raise" or "Pushing back on scope creep"'
                className="bg-surface-dark border-white/10 text-white placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1.5 block">Category</label>
              <select
                value={form.scenario_category}
                onChange={e => setForm(prev => ({ ...prev, scenario_category: e.target.value }))}
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
                value={form.scenario_context}
                onChange={e => setForm(prev => ({ ...prev, scenario_context: e.target.value }))}
                placeholder="Describe the situation — what happened, what you need to address..."
                rows={4}
                className="bg-surface-dark border-white/10 text-white placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1.5 block">Your Objectives (one per line)</label>
              <Textarea
                value={form.scenario_objectives}
                onChange={e => setForm(prev => ({ ...prev, scenario_objectives: e.target.value }))}
                placeholder={"Address the issue calmly\nGet commitment to change\nMaintain the relationship"}
                rows={3}
                className="bg-surface-dark border-white/10 text-white placeholder:text-slate-500"
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}
      </main>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background-dark/95 backdrop-blur-sm border-t border-white/10 p-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          {step < totalSteps ? (
            <>
              {step === 4 && (
                <Button
                  variant="ghost"
                  onClick={() => setStep(step + 1)}
                  className="flex-1 text-slate-400"
                >
                  Skip
                </Button>
              )}
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canAdvance()}
                className="flex-1 bg-whispie-primary hover:brightness-110 text-background-dark font-bold"
              >
                Continue
              </Button>
            </>
          ) : (
            <>
              {form.scenario_title.trim() === '' && (
                <Button
                  variant="ghost"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 text-slate-400"
                >
                  Skip & Create
                </Button>
              )}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-whispie-primary hover:brightness-110 text-background-dark font-bold"
              >
                {isSubmitting ? 'Creating...' : 'Create Persona'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
