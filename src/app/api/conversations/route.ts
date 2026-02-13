import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse request body
  const body = await request.json()
  const { scenario_id } = body

  if (!scenario_id) {
    return NextResponse.json({ error: 'scenario_id is required' }, { status: 400 })
  }

  // Get scenario with persona (exclude community scenarios)
  const { data: scenario, error: scenarioError } = await supabase
    .from('scenarios')
    .select('*, persona:personas(*)')
    .eq('id', scenario_id)
    .or('source.is.null,source.eq.system,source.eq.user')
    .single()

  if (scenarioError || !scenario) {
    return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })
  }

  // Create conversation
  const { data: conversation, error: convError } = await supabase
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

  if (convError) {
    console.error('Error creating conversation:', convError)
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
  }

  return NextResponse.json({
    conversation,
    scenario,
  })
}
