import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch the community scenario with its persona
  const { data: original, error: fetchError } = await supabase
    .from('scenarios')
    .select('*, persona:personas(*)')
    .eq('id', id)
    .eq('source', 'community')
    .eq('is_public', true)
    .single()

  if (fetchError || !original) {
    return NextResponse.json({ error: 'Community scenario not found' }, { status: 404 })
  }

  // Check if user already has the linked persona cloned (by name + title match)
  const persona = Array.isArray(original.persona) ? original.persona[0] : original.persona
  let userPersonaId: string | null = null

  if (persona) {
    // Check for existing clone
    const { data: existingPersona } = await supabase
      .from('personas')
      .select('id')
      .eq('created_by', user.id)
      .eq('name', persona.name)
      .eq('title', persona.title)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (existingPersona) {
      userPersonaId = existingPersona.id
    } else {
      // Clone the persona too
      const { data: clonedPersona, error: clonePersonaError } = await supabase
        .from('personas')
        .insert({
          name: persona.name,
          title: persona.title,
          description: persona.description,
          personality_traits: persona.personality_traits,
          communication_style: persona.communication_style,
          difficulty: persona.difficulty,
          custom_qa: persona.custom_qa,
          tags: persona.tags,
          avatar_url: persona.avatar_url,
          created_by: user.id,
          source: 'user',
          is_public: false,
          is_active: true,
        })
        .select()
        .single()

      if (clonePersonaError) {
        console.error('Error cloning persona for scenario:', clonePersonaError)
        return NextResponse.json({ error: 'Failed to clone persona' }, { status: 500 })
      }

      userPersonaId = clonedPersona.id
    }
  }

  // Clone the scenario
  const { data: clonedScenario, error: cloneError } = await supabase
    .from('scenarios')
    .insert({
      title: original.title,
      description: original.description,
      category: original.category,
      context: original.context,
      objectives: original.objectives,
      persona_id: userPersonaId,
      difficulty: original.difficulty,
      estimated_turns: original.estimated_turns,
      is_premium: false,
      is_active: true,
      created_by: user.id,
      source: 'user',
      is_public: false,
    })
    .select()
    .single()

  if (cloneError) {
    console.error('Error cloning scenario:', cloneError)
    return NextResponse.json({ error: 'Failed to clone scenario' }, { status: 500 })
  }

  // Increment use_count on original
  const adminDb = createServiceClient()
  await adminDb
    .from('scenarios')
    .update({ use_count: (original.use_count || 0) + 1 })
    .eq('id', id)

  return NextResponse.json({ scenario: clonedScenario }, { status: 201 })
}
