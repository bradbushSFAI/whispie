import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch the original scenario (must be owned by user)
  const { data: original, error: fetchError } = await supabase
    .from('scenarios')
    .select('*')
    .eq('id', id)
    .eq('created_by', user.id)
    .single()

  if (fetchError || !original) {
    return NextResponse.json({ error: 'Scenario not found or not owned by you' }, { status: 404 })
  }

  const body = await request.json()
  const { title, description, context } = body

  if (!title || !description) {
    return NextResponse.json({ error: 'title and description are required' }, { status: 400 })
  }

  // Determine persona_id for the community copy
  let personaId = null
  if (original.persona_id) {
    // Check if the referenced persona is a system persona (publicly viewable)
    const { data: persona } = await supabase
      .from('personas')
      .select('source')
      .eq('id', original.persona_id)
      .single()

    // Only preserve persona_id if it's a system persona (publicly viewable)
    if (persona?.source === 'system') {
      personaId = original.persona_id
    }
  }

  // Create a community copy
  const { data: communityScenario, error: createError } = await supabase
    .from('scenarios')
    .insert({
      title,
      description,
      context: context || '',
      category: original.category,
      objectives: original.objectives,
      difficulty: original.difficulty,
      persona_id: personaId,
      created_by: user.id,
      source: 'community',
      is_public: true,
      is_active: true,
    })
    .select()
    .single()

  if (createError) {
    console.error('Error sharing scenario:', createError)
    return NextResponse.json({ error: 'Failed to share scenario' }, { status: 500 })
  }

  return NextResponse.json({ scenario: communityScenario }, { status: 201 })
}