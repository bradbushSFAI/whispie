import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: persona, error } = await supabase
    .from('personas')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !persona) {
    return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
  }

  return NextResponse.json({ persona })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
  } = body

  // RLS ensures only own personas can be updated
  const { data: persona, error } = await supabase
    .from('personas')
    .update({
      ...(name !== undefined && { name }),
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(personality_traits !== undefined && { personality_traits }),
      ...(communication_style !== undefined && { communication_style }),
      ...(difficulty !== undefined && { difficulty }),
      ...(custom_qa !== undefined && { custom_qa }),
      ...(tags !== undefined && { tags }),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating persona:', error)
    return NextResponse.json({ error: 'Failed to update persona' }, { status: 500 })
  }

  return NextResponse.json({ persona })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Count linked scenarios for the warning / cascade
  const { count: scenarioCount } = await supabase
    .from('scenarios')
    .select('id', { count: 'exact', head: true })
    .eq('persona_id', id)
    .eq('created_by', user.id)
    .eq('is_active', true)

  // Cascade: delete all linked scenarios first
  if (scenarioCount && scenarioCount > 0) {
    const { error: scenarioDeleteError } = await supabase
      .from('scenarios')
      .delete()
      .eq('persona_id', id)
      .eq('created_by', user.id)

    if (scenarioDeleteError) {
      console.error('Error deleting linked scenarios:', scenarioDeleteError)
      return NextResponse.json({ error: 'Failed to delete linked scenarios' }, { status: 500 })
    }
  }

  // RLS ensures only own personas can be deleted
  const { error } = await supabase
    .from('personas')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting persona:', error)
    return NextResponse.json({ error: 'Failed to delete persona' }, { status: 500 })
  }

  return NextResponse.json({ success: true, deletedScenarios: scenarioCount || 0 })
}
