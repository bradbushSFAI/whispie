'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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

type ExtractedData = {
  name: string
  title: string
  description: string
  personality_traits: string[]
  communication_style: string
  difficulty: 'easy' | 'medium' | 'hard'
  custom_qa: CustomQA[]
}

export default function UploadPersonaPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const totalSteps = 4

  // Step 1
  const [relationshipType, setRelationshipType] = useState<RelationshipType | null>(null)

  // Step 2
  const [correspondence, setCorrespondence] = useState('')

  // Step 3 (analyzing state)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)

  // Step 4 (editable extracted data)
  const [form, setForm] = useState<ExtractedData>({
    name: '',
    title: '',
    description: '',
    personality_traits: [],
    communication_style: 'direct',
    difficulty: 'medium',
    custom_qa: [],
  })

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const canAdvance = () => {
    switch (step) {
      case 1: return relationshipType !== null
      case 2: return correspondence.trim().length >= 50
      case 3: return false // auto-advances after analysis
      case 4: return form.name.trim() && form.title.trim() && form.description.trim() && form.personality_traits.length > 0
      default: return false
    }
  }

  const handleAnalyze = async () => {
    setStep(3)
    setIsAnalyzing(true)
    setAnalyzeError(null)

    try {
      const res = await fetch('/api/personas/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correspondence: correspondence.trim(),
          relationship_type: relationshipType?.label || '',
        }),
      })

      if (!res.ok) throw new Error('Analysis failed')

      const { extracted } = await res.json()

      setForm({
        name: extracted.name || '',
        title: extracted.title || '',
        description: extracted.description || '',
        personality_traits: extracted.personality_traits || [],
        communication_style: extracted.communication_style || 'direct',
        difficulty: extracted.difficulty || 'medium',
        custom_qa: extracted.custom_qa || [],
      })

      setStep(4)
    } catch {
      setAnalyzeError('Failed to analyze the correspondence. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmitError(null)

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
          tags: relationshipType ? [relationshipType.tag] : [],
        }),
      })

      if (!personaRes.ok) throw new Error('Failed to create persona')
      const { persona } = await personaRes.json()

      // Auto-generate scenario from correspondence
      const scenarioRes = await fetch('/api/scenarios/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona_id: persona.id,
          correspondence: correspondence.trim(),
        }),
      })

      if (!scenarioRes.ok) {
        // Scenario generation failed, redirect to manual scenario creation
        router.push(`/personas/${persona.id}/scenario/new`)
        return
      }

      const { scenario } = await scenarioRes.json()
      router.push(`/chat/new?scenario=${scenario.id}`)
    } catch {
      setSubmitError('Something went wrong. Please try again.')
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

  return (
    <div className="min-h-screen bg-background-dark">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background-dark/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3">
          <button
            onClick={() => {
              if (step === 4) setStep(2)
              else if (step > 1) setStep(step - 1)
              else router.back()
            }}
            className="flex items-center justify-center p-2 -ml-2 rounded-full text-white hover:bg-white/10 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-white tracking-tight">
            Upload Your...
          </h1>
          <span className="text-sm text-slate-400 w-10 text-right">
            {Math.min(step, totalSteps)}/{totalSteps}
          </span>
        </div>
        <div className="h-1 bg-white/10">
          <div
            className="h-full bg-whispie-primary transition-all duration-300"
            style={{ width: `${(Math.min(step, totalSteps) / totalSteps) * 100}%` }}
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
                  onClick={() => setRelationshipType(rt)}
                  className={`flex flex-col items-center gap-2 p-5 rounded-2xl border transition-all text-center ${
                    relationshipType?.key === rt.key
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

        {/* Step 2: Paste Correspondence */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Paste their messages</h2>
              <p className="text-slate-400 text-sm">
                Copy and paste emails, Slack messages, or any correspondence from this person.
                The more you share, the more accurate the persona will be.
              </p>
            </div>
            <Textarea
              value={correspondence}
              onChange={e => setCorrespondence(e.target.value)}
              placeholder={"Paste emails, messages, or correspondence here...\n\nYou can paste multiple messages — just separate them with a blank line."}
              rows={12}
              className="bg-surface-dark border-white/10 text-white placeholder:text-slate-500 font-mono text-sm"
            />
            <p className="text-xs text-slate-500">
              {correspondence.trim().length < 50
                ? `${50 - correspondence.trim().length} more characters needed`
                : `${correspondence.trim().length} characters — ready to analyze`}
            </p>
          </div>
        )}

        {/* Step 3: Analyzing */}
        {step === 3 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            {isAnalyzing ? (
              <>
                <div className="w-12 h-12 border-4 border-whispie-primary/30 border-t-whispie-primary rounded-full animate-spin mb-6" />
                <h2 className="text-xl font-bold text-white mb-2">Analyzing correspondence...</h2>
                <p className="text-slate-400 text-sm max-w-xs">
                  AI is reading the messages and building a persona profile. This takes a few seconds.
                </p>
              </>
            ) : analyzeError ? (
              <>
                <span className="text-5xl mb-4">!!</span>
                <h2 className="text-xl font-bold text-white mb-2">Analysis Failed</h2>
                <p className="text-slate-400 text-sm max-w-xs mb-6">{analyzeError}</p>
                <Button
                  onClick={() => setStep(2)}
                  className="bg-surface-dark hover:bg-white/10 text-white border border-white/10"
                >
                  Go Back & Try Again
                </Button>
              </>
            ) : null}
          </div>
        )}

        {/* Step 4: Review & Edit */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Review & Edit</h2>
              <p className="text-slate-400 text-sm">
                Here&apos;s what we extracted. Adjust anything that doesn&apos;t look right.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-1.5 block">Name</label>
              <Input
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="bg-surface-dark border-white/10 text-white"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-1.5 block">Role / Title</label>
              <Input
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                className="bg-surface-dark border-white/10 text-white"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-1.5 block">Description</label>
              <Textarea
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="bg-surface-dark border-white/10 text-white"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Personality Traits</label>
              <div className="flex flex-wrap gap-2">
                {ALL_TRAITS.map(trait => (
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

            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-2">Behavioral Rules</h3>
              <QAEditor
                value={form.custom_qa}
                onChange={custom_qa => setForm(prev => ({ ...prev, custom_qa }))}
              />
            </div>

            {submitError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {submitError}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom action bar */}
      {step !== 3 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background-dark/95 backdrop-blur-sm border-t border-white/10 p-4">
          <div className="max-w-2xl mx-auto flex gap-3">
            {step === 1 && (
              <Button
                onClick={() => setStep(2)}
                disabled={!canAdvance()}
                className="flex-1 bg-whispie-primary hover:brightness-110 text-background-dark font-bold"
              >
                Continue
              </Button>
            )}
            {step === 2 && (
              <Button
                onClick={handleAnalyze}
                disabled={!canAdvance()}
                className="flex-1 bg-whispie-primary hover:brightness-110 text-background-dark font-bold"
              >
                Analyze with AI
              </Button>
            )}
            {step === 4 && (
              <Button
                onClick={handleSubmit}
                disabled={!canAdvance() || isSubmitting}
                className="flex-1 bg-whispie-primary hover:brightness-110 text-background-dark font-bold"
              >
                {isSubmitting ? 'Creating & Generating Scenario...' : 'Create & Start Practicing'}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
