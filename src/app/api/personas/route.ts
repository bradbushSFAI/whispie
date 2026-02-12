import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // RLS handles filtering: system + own + public community
  const { data: personas, error } = await supabase
    .from('personas')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch personas' }, { status: 500 })
  }

  return NextResponse.json({ personas })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const {
    name,
    title,
    description,
    personality_traits,
    communication_style,
    difficulty,
    custom_qa,
    tags,
    avatar_url,
  } = body

  if (!name || !title || !description) {
    return NextResponse.json({ error: 'name, title, and description are required' }, { status: 400 })
  }

  const { data: persona, error } = await supabase
    .from('personas')
    .insert({
      name,
      title,
      description,
      personality_traits: personality_traits || [],
      communication_style: communication_style || 'direct',
      difficulty: difficulty || 'medium',
      custom_qa: custom_qa || [],
      tags: tags || [],
      created_by: user.id,
      source: 'user',
      is_public: false,
      is_active: true,
      avatar_url: avatar_url || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating persona:', error)
    return NextResponse.json({ error: 'Failed to create persona' }, { status: 500 })
  }

  return NextResponse.json({ persona }, { status: 201 })
}
