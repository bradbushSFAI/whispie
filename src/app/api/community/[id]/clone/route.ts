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

  // Fetch the community persona
  const { data: original, error: fetchError } = await supabase
    .from('personas')
    .select('*')
    .eq('id', id)
    .eq('source', 'community')
    .eq('is_public', true)
    .single()

  if (fetchError || !original) {
    return NextResponse.json({ error: 'Community persona not found' }, { status: 404 })
  }

  // Clone to user's library
  const { data: clone, error: cloneError } = await supabase
    .from('personas')
    .insert({
      name: original.name,
      title: original.title,
      description: original.description,
      personality_traits: original.personality_traits,
      communication_style: original.communication_style,
      difficulty: original.difficulty,
      custom_qa: original.custom_qa,
      tags: original.tags,
      avatar_url: original.avatar_url,
      created_by: user.id,
      source: 'user',
      is_public: false,
      is_active: true,
    })
    .select()
    .single()

  if (cloneError) {
    console.error('Error cloning persona:', cloneError)
    return NextResponse.json({ error: 'Failed to clone persona' }, { status: 500 })
  }

  // Increment use_count on original (use service client to bypass RLS)
  const adminDb = createServiceClient()
  await adminDb
    .from('personas')
    .update({ use_count: (original.use_count || 0) + 1 })
    .eq('id', id)

  return NextResponse.json({ persona: clone }, { status: 201 })
}
