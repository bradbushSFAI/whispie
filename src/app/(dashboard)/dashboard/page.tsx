import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { levelProgress, xpForLevel, levelTitle } from '@/lib/gamification'
import { isStreakAtRisk } from '@/lib/gamification/streaks'
import { ConversationList } from '@/components/dashboard/conversation-list'
import { NavHeader } from '@/components/layout/nav-header'
import { PostHogIdentify } from '@/lib/posthog'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Redirect to onboarding if not completed
  if (!profile?.onboarding_completed) {
    redirect('/onboarding')
  }

  // Fetch recent conversations with scenarios and analyses
  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      *,
      scenario:scenarios(title, category),
      persona:personas(name, title),
      analysis:analyses(overall_score)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const scenariosRemaining = profile?.tier === 'free'
    ? Math.max(0, 3 - (profile?.scenarios_used_this_month || 0))
    : null

  // Gamification data
  const xp = profile?.xp || 0
  const level = profile?.level || 1
  const currentStreak = profile?.current_streak || 0
  const progress = levelProgress(xp)
  const nextLevelXp = xpForLevel(level + 1)
  const currentLevelXp = xpForLevel(level)
  const streakAtRisk = isStreakAtRisk(profile?.last_practice_date || null)

  return (
    <div className="min-h-screen bg-background-dark">
      <PostHogIdentify userId={user.id} properties={{ email: user.email, display_name: profile?.display_name, tier: profile?.tier }} />
      <NavHeader displayName={profile?.display_name || user.email?.split('@')[0] || 'User'} />

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {/* Level & XP Card */}
        <Link
          href="/progress"
          className="block bg-surface-dark rounded-2xl p-5 border border-white/5 mb-6 hover:border-whispie-primary/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-slate-300 uppercase tracking-wider">Level {level}</p>
              <h2 className="text-xl font-bold text-white">{levelTitle(level)}</h2>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-whispie-primary">{xp}</p>
              <p className="text-xs text-slate-300">XP</p>
            </div>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-whispie-primary rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {nextLevelXp - xp} XP to level {level + 1}
          </p>
        </Link>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Link
            href="/scenarios"
            className="bg-whispie-primary hover:brightness-110 text-background-dark font-bold py-4 px-5 rounded-2xl transition-all shadow-lg shadow-whispie-primary/20 text-center"
          >
            Start Practice
          </Link>
          <Link
            href="/progress"
            className="bg-surface-dark hover:bg-white/10 text-white font-bold py-4 px-5 rounded-2xl transition-all border border-white/5 text-center"
          >
            View Progress
          </Link>
        </div>
        <Link
          href="/personas/upload"
          className="flex items-center justify-center gap-2 w-full py-3 mb-4 rounded-2xl bg-surface-dark hover:bg-white/10 text-white font-bold transition-all border border-whispie-primary/30 hover:border-whispie-primary/60 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload Your Boss / Coworker / Client
        </Link>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {/* Streak */}
          <div className={`bg-surface-dark rounded-xl p-4 text-center border ${streakAtRisk ? 'border-orange-500/50' : 'border-white/5'}`}>
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl font-bold text-white">{currentStreak}</span>
              <span className="text-xl">{currentStreak > 0 ? '🔥' : ''}</span>
            </div>
            <p className="text-xs text-slate-300">
              {streakAtRisk ? 'Streak at risk!' : 'Day Streak'}
            </p>
          </div>

          {/* Total Conversations */}
          <div className="bg-surface-dark rounded-xl p-4 text-center border border-white/5">
            <div className="text-2xl font-bold text-white">
              {profile?.total_conversations || 0}
            </div>
            <p className="text-xs text-slate-300">Conversations</p>
          </div>

          {/* Avg Score */}
          <div className="bg-surface-dark rounded-xl p-4 text-center border border-white/5">
            <div className="text-2xl font-bold text-whispie-primary">
              {conversations?.filter(c => c.analysis?.overall_score != null).length
                ? Math.round(
                    conversations
                      .filter(c => c.analysis?.overall_score != null)
                      .reduce((sum, c) => sum + (c.analysis?.overall_score || 0), 0) /
                    conversations.filter(c => c.analysis?.overall_score != null).length
                  )
                : '--'}
            </div>
            <p className="text-xs text-slate-300">Avg Score</p>
          </div>
        </div>

        {/* Tier Info */}
        <div className="bg-surface-dark rounded-xl p-4 border border-white/5 mb-8 flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-white">{profile?.tier === 'pro' ? 'Pro' : 'Free'} Plan</span>
            <p className="text-xs text-slate-300">
              {scenariosRemaining !== null
                ? `${scenariosRemaining} of 3 scenarios remaining this month`
                : 'Unlimited scenarios'}
            </p>
          </div>
          {profile?.tier === 'free' && (
            <Link
              href="/upgrade"
              className="text-sm text-whispie-primary font-bold hover:underline"
            >
              Upgrade
            </Link>
          )}
        </div>

        {/* Recent Conversations */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Recent Sessions</h3>

          <ConversationList conversations={conversations?.map((conv) => ({
            ...conv,
            scenario: conv.scenario as { title: string; category: string } | null,
            persona: conv.persona as { name: string; title: string } | null,
            analysis: conv.analysis as { overall_score: number } | null,
          })) || []} />
        </div>
      </main>
    </div>
  )
}
