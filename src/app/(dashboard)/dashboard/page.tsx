import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { levelProgress, xpForLevel, levelTitle } from '@/lib/gamification'
import { isStreakAtRisk } from '@/lib/gamification/streaks'

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
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background-dark/95 backdrop-blur-sm border-b border-white/10 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-whispie-primary">Whispie</h1>
          <div className="flex items-center gap-3">
            <Link href="/progress" className="text-sm text-slate-400 hover:text-white transition-colors">
              {profile?.display_name || user.email?.split('@')[0]}
            </Link>
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {/* Level & XP Card */}
        <div className="bg-surface-dark rounded-2xl p-5 border border-white/5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Level {level}</p>
              <h2 className="text-xl font-bold text-white">{levelTitle(level)}</h2>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-whispie-primary">{xp}</p>
              <p className="text-xs text-slate-400">XP</p>
            </div>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-whispie-primary rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {nextLevelXp - xp} XP to level {level + 1}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
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

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {/* Streak */}
          <div className={`bg-surface-dark rounded-xl p-4 text-center border ${streakAtRisk ? 'border-orange-500/50' : 'border-white/5'}`}>
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl font-bold text-white">{currentStreak}</span>
              <span className="text-xl">{currentStreak > 0 ? '🔥' : ''}</span>
            </div>
            <p className="text-xs text-slate-400">
              {streakAtRisk ? 'Streak at risk!' : 'Day Streak'}
            </p>
          </div>

          {/* Total Conversations */}
          <div className="bg-surface-dark rounded-xl p-4 text-center border border-white/5">
            <div className="text-2xl font-bold text-white">
              {profile?.total_conversations || 0}
            </div>
            <p className="text-xs text-slate-400">Conversations</p>
          </div>

          {/* Avg Score */}
          <div className="bg-surface-dark rounded-xl p-4 text-center border border-white/5">
            <div className="text-2xl font-bold text-whispie-primary">
              {conversations?.filter(c => c.analysis?.[0]?.overall_score).length
                ? Math.round(
                    conversations
                      .filter(c => c.analysis?.[0]?.overall_score)
                      .reduce((sum, c) => sum + (c.analysis?.[0]?.overall_score || 0), 0) /
                    conversations.filter(c => c.analysis?.[0]?.overall_score).length
                  )
                : '--'}
            </div>
            <p className="text-xs text-slate-400">Avg Score</p>
          </div>
        </div>

        {/* Tier Info */}
        <div className="bg-surface-dark rounded-xl p-4 border border-white/5 mb-8 flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-white">{profile?.tier === 'pro' ? 'Pro' : 'Free'} Plan</span>
            <p className="text-xs text-slate-400">
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

          {conversations && conversations.length > 0 ? (
            <div className="space-y-3">
              {conversations.map((conv) => {
                const score = conv.analysis?.[0]?.overall_score
                const scenario = conv.scenario as { title: string; category: string } | null
                const persona = conv.persona as { name: string; title: string } | null

                return (
                  <Link
                    key={conv.id}
                    href={conv.status === 'completed' ? `/analysis/${conv.id}` : `/chat/${conv.id}`}
                    className="block"
                  >
                    <div className="bg-surface-dark rounded-xl p-4 border border-white/5 hover:border-whispie-primary/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-whispie-primary uppercase tracking-wider">
                          {scenario?.category || 'Practice'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(conv.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-white font-bold mb-1">
                        {scenario?.title || 'Conversation'}
                      </h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">
                          with {persona?.name || 'AI'}
                        </span>
                        <div className="flex items-center gap-2">
                          {conv.status === 'active' ? (
                            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                              In Progress
                            </span>
                          ) : score ? (
                            <span className={`text-sm font-bold ${
                              score >= 80 ? 'text-whispie-primary' :
                              score >= 60 ? 'text-yellow-400' : 'text-orange-400'
                            }`}>
                              {score}
                            </span>
                          ) : (
                            <span className="text-xs bg-slate-500/20 text-slate-400 px-2 py-0.5 rounded-full">
                              Completed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="bg-surface-dark rounded-xl p-8 text-center border border-white/5">
              <p className="text-slate-400 mb-4">
                No conversations yet. Start your first scenario!
              </p>
              <Link
                href="/scenarios"
                className="inline-block bg-whispie-primary text-background-dark font-bold px-6 py-2 rounded-xl"
              >
                Browse Scenarios
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
