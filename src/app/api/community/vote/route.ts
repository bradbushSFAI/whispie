import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { target_type, target_id } = body

  if (!target_type || !target_id) {
    return NextResponse.json({ error: 'target_type and target_id are required' }, { status: 400 })
  }

  if (!['persona', 'scenario'].includes(target_type)) {
    return NextResponse.json({ error: 'Invalid target_type' }, { status: 400 })
  }

  // Check if vote already exists
  const { data: existingVote } = await supabase
    .from('community_votes')
    .select('id')
    .eq('user_id', user.id)
    .eq('target_type', target_type)
    .eq('target_id', target_id)
    .maybeSingle()

  if (existingVote) {
    // Remove vote (toggle off)
    await supabase
      .from('community_votes')
      .delete()
      .eq('id', existingVote.id)

    return NextResponse.json({ voted: false })
  } else {
    // Add vote (toggle on)
    const { error } = await supabase
      .from('community_votes')
      .insert({
        user_id: user.id,
        target_type,
        target_id,
      })

    if (error) {
      console.error('Error voting:', error)
      return NextResponse.json({ error: 'Failed to vote' }, { status: 500 })
    }

    return NextResponse.json({ voted: true })
  }
}
