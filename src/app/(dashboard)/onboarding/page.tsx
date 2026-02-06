'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

const ROLES = [
  { id: 'individual_contributor', label: 'Individual Contributor', description: 'I work as part of a team' },
  { id: 'manager', label: 'Manager', description: 'I lead a team or department' },
  { id: 'executive', label: 'Executive', description: 'I lead at the C-level or VP level' },
  { id: 'other', label: 'Other', description: 'My role is different' },
]

const INDUSTRIES = [
  { id: 'tech', label: 'Technology' },
  { id: 'finance', label: 'Finance & Banking' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'consulting', label: 'Consulting' },
  { id: 'retail', label: 'Retail & E-commerce' },
  { id: 'manufacturing', label: 'Manufacturing' },
  { id: 'education', label: 'Education' },
  { id: 'other', label: 'Other' },
]

const EXPERIENCE_LEVELS = [
  { id: 'entry', label: 'Entry Level', description: '0-2 years' },
  { id: 'mid', label: 'Mid Level', description: '3-5 years' },
  { id: 'senior', label: 'Senior', description: '6-10 years' },
  { id: 'expert', label: 'Expert', description: '10+ years' },
]

type Step = 'welcome' | 'role' | 'industry' | 'experience' | 'complete'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('welcome')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState('')
  const [industry, setIndustry] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('')
  const [loading, setLoading] = useState(false)

  async function completeOnboarding() {
    setLoading(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      await supabase
        .from('profiles')
        .update({
          display_name: displayName || null,
          role,
          industry,
          experience_level: experienceLevel,
          onboarding_completed: true,
        })
        .eq('id', user.id)
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
      <Card className="w-full max-w-lg">
        {step === 'welcome' && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">Welcome to Whispie</CardTitle>
              <CardDescription className="text-base mt-2">
                Your flight simulator for difficult workplace conversations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center text-slate-600">
                <p>Practice tough conversations in a safe environment.</p>
                <p className="mt-2">Get real-time feedback to improve your communication skills.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">What should we call you?</Label>
                <Input
                  id="displayName"
                  placeholder="Your name (optional)"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>

              <Button className="w-full" onClick={() => setStep('role')}>
                Get Started
              </Button>
            </CardContent>
          </>
        )}

        {step === 'role' && (
          <>
            <CardHeader>
              <CardTitle>What&apos;s your role?</CardTitle>
              <CardDescription>
                This helps us suggest relevant scenarios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRole(r.id)}
                    className={`p-4 text-left rounded-lg border-2 transition-colors ${
                      role === r.id
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-medium">{r.label}</div>
                    <div className="text-sm text-slate-500">{r.description}</div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep('welcome')}>
                  Back
                </Button>
                <Button
                  className="flex-1"
                  disabled={!role}
                  onClick={() => setStep('industry')}
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {step === 'industry' && (
          <>
            <CardHeader>
              <CardTitle>What industry do you work in?</CardTitle>
              <CardDescription>
                We&apos;ll tailor scenarios to your field
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {INDUSTRIES.map((i) => (
                  <button
                    key={i.id}
                    onClick={() => setIndustry(i.id)}
                    className={`p-3 text-center rounded-lg border-2 transition-colors ${
                      industry === i.id
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{i.label}</div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep('role')}>
                  Back
                </Button>
                <Button
                  className="flex-1"
                  disabled={!industry}
                  onClick={() => setStep('experience')}
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {step === 'experience' && (
          <>
            <CardHeader>
              <CardTitle>How experienced are you?</CardTitle>
              <CardDescription>
                This helps us adjust the difficulty
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {EXPERIENCE_LEVELS.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => setExperienceLevel(e.id)}
                    className={`p-4 text-left rounded-lg border-2 transition-colors ${
                      experienceLevel === e.id
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-medium">{e.label}</div>
                    <div className="text-sm text-slate-500">{e.description}</div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep('industry')}>
                  Back
                </Button>
                <Button
                  className="flex-1"
                  disabled={!experienceLevel}
                  onClick={() => setStep('complete')}
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {step === 'complete' && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">You&apos;re all set!</CardTitle>
              <CardDescription className="text-base mt-2">
                Ready to practice your first conversation?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <button
                onClick={() => {
                  completeOnboarding()
                  router.push('/scenarios?category=feedback')
                }}
                className="w-full text-left bg-slate-100 rounded-lg p-4 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <h3 className="font-medium mb-2">Suggested first scenario:</h3>
                <p className="text-slate-600 text-sm">
                  &quot;Asking your manager for feedback&quot; - A gentle introduction to
                  workplace conversations where you practice requesting constructive feedback.
                </p>
                <p className="text-sm font-medium text-slate-900 mt-2">Tap to try it &rarr;</p>
              </button>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('experience')}>
                  Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={completeOnboarding}
                  disabled={loading}
                >
                  {loading ? 'Setting up...' : 'Go to Dashboard'}
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {/* Progress indicator */}
        <div className="px-6 pb-6">
          <div className="flex justify-center gap-2">
            {['welcome', 'role', 'industry', 'experience', 'complete'].map((s, i) => (
              <div
                key={s}
                className={`h-1.5 w-8 rounded-full ${
                  ['welcome', 'role', 'industry', 'experience', 'complete'].indexOf(step) >= i
                    ? 'bg-slate-900'
                    : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
