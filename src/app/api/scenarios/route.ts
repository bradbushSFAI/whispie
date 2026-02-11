import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { title, category, context, objectives, persona_id, difficulty } = body

  if (!title || !context) {
    return NextResponse.json({ error: 'title and context are required' }, { status: 400 })
  }

  const { data: scenario, error } = await supabase
    .from('scenarios')
    .insert({
      title,
      description: context.slice(0, 200),
      category: category || 'conflict',
      context,
      objectives: objectives || [],
      persona_id: persona_id || null,
      difficulty: difficulty || 'medium',
      estimated_turns: 10,
      is_premium: false,
      is_active: true,
      created_by: user.id,
      source: 'user',
      is_public: false,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating scenario:', error)
    return NextResponse.json({ error: 'Failed to create scenario' }, { status: 500 })
  }

  return NextResponse.json({ scenario }, { status: 201 })
}
