import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { analysisModel, analysisConfig, buildAnalysisPrompt } from '@/lib/gemini'
import { xpFromScore, calculateTotalXp, levelFromXp } from '@/lib/gamification'
import { updateStreak } from '@/lib/gamification/streaks'
import type { Scenario, Profile } from '@/types/database'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params
  const supabase = await createClient()
  const adminDb = createServiceClient()

  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get conversation with scenario
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('*, scenario:scenarios(*)')
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .single()

  if (convError || !conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  // Check if analysis already exists
  const { data: existingAnalysis } = await supabase
    .from('analyses')
    .select('*')
    .eq('conversation_id', conversationId)
    .single()

  if (existingAnalysis) {
    return NextResponse.json({ analysis: existingAnalysis })
  }

  // Get user profile for gamification
  const { data: profile } = await supabase
    .from('profiles')
    .select('xp, level, current_streak, longest_streak, last_practice_date, total_conversations')
    .eq('id', user.id)
    .single()

  // Get messages
  const { data: messages, error: msgError } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (msgError || !messages || messages.length === 0) {
    return NextResponse.json({ error: 'No messages found' }, { status: 400 })
  }

  // Build analysis prompt
  const scenario = conversation.scenario as Scenario
  const analysisPrompt = buildAnalysisPrompt(scenario, messages)

  try {
    // Generate analysis with Gemini 2.5 Pro (thinking enabled)
    console.log('[analyze] Using Gemini 2.5 Pro with thinking for analysis')
    const result = await analysisModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: analysisPrompt }] }],
      generationConfig: analysisConfig,
    })

    const responseText = result.response.text()
    console.log('[analyze] Analysis generated, response length:', responseText.length)

    // Parse JSON response
    let analysisData
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('Failed to parse analysis:', parseError, responseText)
      return NextResponse.json({ error: 'Failed to parse analysis' }, { status: 500 })
    }

    // Store analysis in database (use service client to bypass RLS)
    const { data: analysis, error: insertError } = await adminDb
      .from('analyses')
      .insert({
        conversation_id: conversationId,
        overall_score: analysisData.overall_score,
        clarity_score: analysisData.clarity_score,
        empathy_score: analysisData.empathy_score,
        assertiveness_score: analysisData.assertiveness_score,
        professionalism_score: analysisData.professionalism_score,
        strengths: analysisData.strengths,
        improvements: analysisData.improvements,
        summary: analysisData.summary,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[analyze] Failed to store analysis:', insertError.message, insertError.code, insertError.details)
      return NextResponse.json({ error: `Failed to store analysis: ${insertError.message}` }, { status: 500 })
    }

    // Mark conversation as completed
    await adminDb
      .from('conversations')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', conversationId)

    // === GAMIFICATION ===
    if (profile) {
      const currentProfile = profile as Profile

      // Calculate XP
      const baseXp = xpFromScore(analysisData.overall_score || 0)
      const earnedXp = calculateTotalXp(baseXp, {
        isFirstConversation: (currentProfile.total_conversations || 0) === 0,
        streakDays: currentProfile.current_streak || 0,
        difficulty: scenario.difficulty,
      })

      // Update streak
      const { newStreak, newLongestStreak } = updateStreak(
        currentProfile.current_streak || 0,
        currentProfile.longest_streak || 0,
        currentProfile.last_practice_date
      )

      // Calculate new level
      const newXp = (currentProfile.xp || 0) + earnedXp
      const newLevel = levelFromXp(newXp)

      // Update profile with gamification data
      await adminDb
        .from('profiles')
        .update({
          xp: newXp,
          level: newLevel,
          current_streak: newStreak,
          longest_streak: newLongestStreak,
          last_practice_date: new Date().toISOString().split('T')[0],
          total_conversations: (currentProfile.total_conversations || 0) + 1,
        })
        .eq('id', user.id)

      // Check and award achievements
      await checkAndAwardAchievements(adminDb, user.id, {
        totalConversations: (currentProfile.total_conversations || 0) + 1,
        currentStreak: newStreak,
        overallScore: analysisData.overall_score || 0,
      })

      return NextResponse.json({
        analysis,
        xpEarned: earnedXp,
        newLevel: newLevel > (currentProfile.level || 1) ? newLevel : null,
        streakDays: newStreak,
      })
    }

    return NextResponse.json({ analysis })
  } catch (error: unknown) {
    const err = error as Error & { status?: number; statusText?: string }
    console.error('[analyze] Gemini error:', {
      message: err?.message,
      status: err?.status,
      statusText: err?.statusText,
      name: err?.name,
      stack: err?.stack?.slice(0, 500),
    })
    return NextResponse.json({ error: err?.message || 'Failed to generate analysis' }, { status: 500 })
  }
}

// Check and award achievements based on current stats
async function checkAndAwardAchievements(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  stats: {
    totalConversations: number
    currentStreak: number
    overallScore: number
  }
) {
  // Get all achievements
  const { data: achievements } = await supabase
    .from('achievements')
    .select('*')
    .eq('is_active', true)

  if (!achievements) return

  // Get user's current achievements
  const { data: userAchievements } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId)

  const unlockedIds = new Set(userAchievements?.map((ua) => ua.achievement_id) || [])

  // Check each achievement
  const toUnlock: string[] = []

  for (const achievement of achievements) {
    if (unlockedIds.has(achievement.id)) continue

    let shouldUnlock = false

    switch (achievement.key) {
      // Milestones
      case 'first_conversation':
        shouldUnlock = stats.totalConversations >= 1
        break
      case 'conversations_5':
        shouldUnlock = stats.totalConversations >= 5
        break
      case 'conversations_10':
        shouldUnlock = stats.totalConversations >= 10
        break
      case 'conversations_25':
        shouldUnlock = stats.totalConversations >= 25
        break
      case 'conversations_50':
        shouldUnlock = stats.totalConversations >= 50
        break

      // Streaks
      case 'streak_3':
        shouldUnlock = stats.currentStreak >= 3
        break
      case 'streak_7':
        shouldUnlock = stats.currentStreak >= 7
        break
      case 'streak_14':
        shouldUnlock = stats.currentStreak >= 14
        break
      case 'streak_30':
        shouldUnlock = stats.currentStreak >= 30
        break

      // Skill
      case 'score_80':
        shouldUnlock = stats.overallScore >= 80
        break
      case 'score_90':
        shouldUnlock = stats.overallScore >= 90
        break
      case 'score_100':
        shouldUnlock = stats.overallScore >= 100
        break

      // Special (time-based)
      case 'night_owl':
        shouldUnlock = new Date().getHours() >= 22
        break
      case 'early_bird':
        shouldUnlock = new Date().getHours() < 7
        break
      case 'weekend_warrior':
        const day = new Date().getDay()
        shouldUnlock = day === 0 || day === 6
        break
    }

    if (shouldUnlock) {
      toUnlock.push(achievement.id)
    }
  }

  // Unlock achievements
  if (toUnlock.length > 0) {
    const inserts = toUnlock.map((achievementId) => ({
      user_id: userId,
      achievement_id: achievementId,
    }))

    await supabase.from('user_achievements').insert(inserts)

    // Award XP for achievements
    const xpRewards = achievements
      .filter((a) => toUnlock.includes(a.id))
      .reduce((sum, a) => sum + (a.xp_reward || 0), 0)

    if (xpRewards > 0) {
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('xp')
        .eq('id', userId)
        .single()

      if (currentProfile) {
        const newXp = (currentProfile.xp || 0) + xpRewards
        await supabase
          .from('profiles')
          .update({ xp: newXp, level: levelFromXp(newXp) })
          .eq('id', userId)
      }
    }
  }
}
