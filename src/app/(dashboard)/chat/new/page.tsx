import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const FREE_TIER_LIMIT = 3

export default async function NewChatPage({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string }>
}) {
  const { scenario: scenarioId } = await searchParams

  if (!scenarioId) {
    redirect('/scenarios')
  }

  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get user profile to check tier and usage
  const { data: profile } = await supabase
    .from('profiles')
    .select('tier, scenarios_used_this_month')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/onboarding')
  }

  // Check rate limit for free tier
  if (profile.tier === 'free') {
    const scenariosUsed = profile.scenarios_used_this_month || 0
    if (scenariosUsed >= FREE_TIER_LIMIT) {
      // Redirect to upgrade page with scenario param to resume after upgrade
      redirect(`/upgrade?scenario=${scenarioId}`)
    }
  }

  // Get scenario with persona
  const { data: scenario } = await supabase
    .from('scenarios')
    .select('*, persona:personas(*)')
    .eq('id', scenarioId)
    .single()

  if (!scenario) {
    redirect('/scenarios')
  }

  // Check if scenario is premium and user is on free tier
  if (scenario.is_premium && profile.tier === 'free') {
    redirect(`/upgrade?scenario=${scenarioId}&premium=true`)
  }

  // Create conversation
  const { data: conversation, error } = await supabase
    .from('conversations')
    .insert({
      user_id: user.id,
      scenario_id: scenario.id,
      persona_id: scenario.persona_id,
      status: 'active',
      started_at: new Date().toISOString(),
      total_turns: 0,
    })
    .select()
    .single()

  if (error || !conversation) {
    console.error('Error creating conversation:', error)
    redirect('/scenarios')
  }

  // Increment scenarios_used_this_month for free tier
  if (profile.tier === 'free') {
    await supabase
      .from('profiles')
      .update({
        scenarios_used_this_month: (profile.scenarios_used_this_month || 0) + 1,
      })
      .eq('id', user.id)
  }

  // Increment use_count on the persona (best-effort, won't block redirect)
  if (scenario.persona_id) {
    supabase
      .from('personas')
      .update({ use_count: (scenario.persona?.use_count || 0) + 1 })
      .eq('id', scenario.persona_id)
      .then(() => {})
  }

  redirect(`/chat/${conversation.id}`)
}
