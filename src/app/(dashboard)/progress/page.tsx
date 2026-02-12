import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { levelProgress, xpForLevel, levelTitle } from '@/lib/gamification'
import { streakMessage } from '@/lib/gamification/streaks'
import { NavHeader } from '@/components/layout/nav-header'
import type { Achievement } from '@/types/database'

export default async function ProgressPage() {
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

  if (!profile) {
    redirect('/onboarding')
  }

  // Get all achievements
  const { data: achievements } = await supabase
    .from('achievements')
    .select('*')
    .eq('is_active', true)
    .order('category')

  // Get user's unlocked achievements
  const { data: userAchievements } = await supabase
    .from('user_achievements')
    .select('achievement_id, unlocked_at')
    .eq('user_id', user.id)

  const unlockedIds = new Set(userAchievements?.map((ua) => ua.achievement_id) || [])

  // Get recent scores for chart
  const { data: recentAnalyses } = await supabase
    .from('conversations')
    .select('created_at, analysis:analyses(overall_score)')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .not('analysis', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10)

  // Gamification stats
  const xp = profile.xp || 0
  const level = profile.level || 1
  const currentStreak = profile.current_streak || 0
  const longestStreak = profile.longest_streak || 0
  const totalConversations = profile.total_conversations || 0
  const progress = levelProgress(xp)
  const nextLevelXp = xpForLevel(level + 1)

  // Group achievements by category
  const achievementsByCategory: Record<string, Achievement[]> = {}
  for (const achievement of achievements || []) {
    const cat = achievement.category
    if (!achievementsByCategory[cat]) achievementsByCategory[cat] = []
    achievementsByCategory[cat].push(achievement)
  }

  const categoryLabels: Record<string, string> = {
    milestone: 'Milestones',
    streak: 'Streaks',
    skill: 'Skills',
    special: 'Special',
  }

  // Generate all levels (up to 50)
  const allLevels = Array.from({ length: 50 }, (_, i) => {
    const lvl = i + 1
    return {
      level: lvl,
      xpRequired: xpForLevel(lvl),
      title: levelTitle(lvl),
      isUnlocked: lvl <= level,
      isCurrent: lvl === level,
    }
  })

  return (
    <div className="min-h-screen bg-background-dark">
      <NavHeader displayName={profile.display_name || 'User'} />

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {/* Level Card */}
        <div className="bg-gradient-to-br from-whispie-primary/20 to-whispie-primary/5 rounded-2xl p-6 border border-whispie-primary/20 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-whispie-primary flex items-center justify-center text-background-dark text-2xl font-bold">
              {level}
            </div>
            <div className="flex-1">
              <p className="text-sm text-whispie-primary font-semibold">Level {level}</p>
              <h2 className="text-2xl font-bold text-white">{levelTitle(level)}</h2>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">{xp}</p>
              <p className="text-sm text-slate-300">Total XP</p>
            </div>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-whispie-primary rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <p className="text-xs text-slate-300">{xpForLevel(level)} XP</p>
            <p className="text-xs text-slate-300">{nextLevelXp} XP</p>
          </div>
          <a href="#all-levels" className="block text-center text-xs text-whispie-primary mt-3 hover:underline">
            View all levels
          </a>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Streak */}
          <div className="bg-surface-dark rounded-2xl p-5 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">🔥</span>
              <div>
                <p className="text-3xl font-bold text-white">{currentStreak}</p>
                <p className="text-xs text-slate-300">Day Streak</p>
              </div>
            </div>
            <p className="text-sm text-whispie-primary">{streakMessage(currentStreak)}</p>
            <p className="text-xs text-slate-400 mt-2">Best: {longestStreak} days</p>
          </div>

          {/* Conversations */}
          <div className="bg-surface-dark rounded-2xl p-5 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">💬</span>
              <div>
                <p className="text-3xl font-bold text-white">{totalConversations}</p>
                <p className="text-xs text-slate-300">Conversations</p>
              </div>
            </div>
            <p className="text-sm text-slate-300">
              {totalConversations > 0
                ? `${Math.round((userAchievements?.length || 0) / (achievements?.length || 1) * 100)}% achievements unlocked`
                : 'Start practicing!'}
            </p>
          </div>
        </div>

        {/* Recent Scores */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-white mb-4">Recent Scores</h3>
          <div className="bg-surface-dark rounded-2xl p-4 border border-white/5">
            {recentAnalyses && recentAnalyses.filter(c => (c.analysis as any)?.overall_score).length > 0 ? (
              <>
                <div className="flex items-end justify-between h-24 gap-2">
                  {[...recentAnalyses].reverse().map((conv, i) => {
                    const score = (conv.analysis as any)?.overall_score || 0
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className={`w-full rounded-t transition-all ${
                            score >= 80 ? 'bg-whispie-primary' :
                            score >= 60 ? 'bg-yellow-500' : 'bg-orange-500'
                          }`}
                          style={{ height: `${Math.max(score, 5)}%` }}
                        />
                        <span className="text-[10px] text-slate-300">{score || '-'}</span>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-slate-300 text-center mt-3">Last {recentAnalyses.length} conversations</p>
              </>
            ) : (
              <p className="text-sm text-slate-300 text-center py-4">
                Complete a conversation to see your scores here.
              </p>
            )}
          </div>
        </div>

        {/* Achievements */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-white mb-4">
            Achievements ({userAchievements?.length || 0}/{achievements?.length || 0})
          </h3>

          {Object.entries(achievementsByCategory).map(([category, categoryAchievements]) => (
            <div key={category} className="mb-6">
              <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
                {categoryLabels[category] || category}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {categoryAchievements.map((achievement) => {
                  const isUnlocked = unlockedIds.has(achievement.id)
                  return (
                    <div
                      key={achievement.id}
                      className={`rounded-xl p-4 border transition-all ${
                        isUnlocked
                          ? 'bg-surface-dark border-whispie-primary/30'
                          : 'bg-surface-dark/50 border-white/5 opacity-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`text-2xl ${isUnlocked ? '' : 'grayscale'}`}>
                          {achievement.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-sm truncate ${isUnlocked ? 'text-white' : 'text-slate-400'}`}>
                            {achievement.name}
                          </p>
                          <p className="text-xs text-slate-400 line-clamp-2">
                            {achievement.description}
                          </p>
                          {achievement.xp_reward > 0 && (
                            <p className={`text-xs mt-1 ${isUnlocked ? 'text-whispie-primary' : 'text-slate-400'}`}>
                              +{achievement.xp_reward} XP
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* All Levels */}
        <div id="all-levels" className="scroll-mt-20">
          <h3 className="text-lg font-bold text-white mb-4">All Levels</h3>
          <div className="bg-surface-dark rounded-2xl p-4 border border-white/5">
            <div className="space-y-3">
              {allLevels.map((lvl) => (
                <div
                  key={lvl.level}
                  className={`relative rounded-lg p-3 transition-all ${
                    lvl.isCurrent
                      ? 'bg-whispie-primary/20 border-2 border-whispie-primary ring-2 ring-whispie-primary/50'
                      : lvl.isUnlocked
                      ? 'bg-white/5 border border-whispie-primary/20'
                      : 'bg-white/5 border border-white/5 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                        lvl.isCurrent
                          ? 'bg-whispie-primary text-background-dark'
                          : lvl.isUnlocked
                          ? 'bg-whispie-primary/50 text-white'
                          : 'bg-white/10 text-slate-400'
                      }`}
                    >
                      {lvl.isUnlocked ? lvl.level : '🔒'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`font-bold text-sm ${
                            lvl.isCurrent
                              ? 'text-whispie-primary'
                              : lvl.isUnlocked
                              ? 'text-white'
                              : 'text-slate-400'
                          }`}
                        >
                          Level {lvl.level}
                          {lvl.isCurrent && <span className="ml-2 text-xs">(Current)</span>}
                        </p>
                        <p
                          className={`text-xs ${
                            lvl.isUnlocked ? 'text-slate-300' : 'text-slate-500'
                          }`}
                        >
                          {lvl.xpRequired.toLocaleString()} XP
                        </p>
                      </div>
                      <p
                        className={`text-xs ${
                          lvl.isUnlocked ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {lvl.title}
                      </p>
                      {lvl.isCurrent && (
                        <div className="mt-2">
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-whispie-primary rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-slate-300 mt-1">
                            {nextLevelXp - xp} XP to next level
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
