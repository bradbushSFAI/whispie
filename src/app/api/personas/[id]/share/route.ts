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

  // Fetch the original persona (must be owned by user)
  const { data: original, error: fetchError } = await supabase
    .from('personas')
    .select('*')
    .eq('id', id)
    .eq('created_by', user.id)
    .single()

  if (fetchError || !original) {
    return NextResponse.json({ error: 'Persona not found or not owned by you' }, { status: 404 })
  }

  const body = await request.json()
  const { name, title, description } = body

  if (!name || !title || !description) {
    return NextResponse.json({ error: 'name, title, and description are required' }, { status: 400 })
  }

  // Create a community copy
  const { data: communityPersona, error: createError } = await supabase
    .from('personas')
    .insert({
      name,
      title,
      description,
      personality_traits: original.personality_traits,
      communication_style: original.communication_style,
      difficulty: original.difficulty,
      custom_qa: original.custom_qa,
      tags: original.tags,
      avatar_url: null,
      created_by: user.id,
      source: 'community',
      is_public: true,
      is_active: true,
    })
    .select()
    .single()

  if (createError) {
    console.error('Error sharing persona:', createError)
    return NextResponse.json({ error: 'Failed to share persona' }, { status: 500 })
  }

  return NextResponse.json({ persona: communityPersona }, { status: 201 })
}
