import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string; premium?: string }>
}) {
  const { scenario, premium } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('scenarios_used_this_month, tier')
    .eq('id', user.id)
    .single()

  const isPremiumScenario = premium === 'true'
  const isRateLimited = !isPremiumScenario

  return (
    <div className="min-h-screen bg-background-dark flex flex-col">
      {/* Header */}
      <header className="px-4 py-4 border-b border-white/10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold text-whispie-primary">
            Whispie
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-slate-300 hover:text-white transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-whispie-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            {isRateLimited ? (
              <svg className="w-10 h-10 text-whispie-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-10 h-10 text-whispie-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            )}
          </div>

          {/* Message */}
          <h1 className="text-2xl font-bold text-white mb-3">
            {isRateLimited
              ? "You've reached your monthly limit"
              : 'This is a Pro scenario'}
          </h1>
          <p className="text-slate-300 mb-8">
            {isRateLimited
              ? `You've used ${profile?.scenarios_used_this_month || 3} of 3 free scenarios this month. Upgrade to Pro for unlimited practice.`
              : 'This premium scenario requires a Pro subscription to access.'}
          </p>

          {/* Pro Features */}
          <div className="bg-surface-dark rounded-2xl p-6 border border-white/5 mb-8 text-left">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Whispie Pro</h2>
              <div className="text-right">
                <span className="text-2xl font-bold text-white">$12</span>
                <span className="text-slate-300">/mo</span>
              </div>
            </div>
            <ul className="space-y-3">
              {[
                'Unlimited scenarios',
                '4 voice chats per month',
                'Upload Your Boss feature',
                'Career journal',
                'Priority support',
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-whispie-primary shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                  <span className="text-slate-300 text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <button
              disabled
              className="w-full bg-whispie-primary text-background-dark font-bold py-4 rounded-xl hover:brightness-110 transition-all shadow-lg shadow-whispie-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Coming Soon
            </button>
            <p className="text-xs text-slate-400">
              Payment integration launching soon. Sign up to be notified!
            </p>
          </div>

          {/* Back link */}
          <div className="mt-8">
            <Link
              href="/scenarios"
              className="text-sm text-slate-300 hover:text-white transition-colors"
            >
              Browse free scenarios instead
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
