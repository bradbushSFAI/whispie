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

  const { data: scenario, error } = await supabase
    .from('scenarios')
    .select('*, persona:personas(id, name, title)')
    .eq('id', id)
    .single()

  if (error || !scenario) {
    return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })
  }

  return NextResponse.json({ scenario })
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
  const { title, description, category, context, objectives, difficulty } = body

  const { data: scenario, error } = await supabase
    .from('scenarios')
    .update({
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(category !== undefined && { category }),
      ...(context !== undefined && { context }),
      ...(objectives !== undefined && { objectives }),
      ...(difficulty !== undefined && { difficulty }),
    })
    .eq('id', id)
    .eq('created_by', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating scenario:', error)
    return NextResponse.json({ error: 'Failed to update scenario' }, { status: 500 })
  }

  return NextResponse.json({ scenario })
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

  // Fetch the scenario to get its persona_id
  const { data: scenario } = await supabase
    .from('scenarios')
    .select('persona_id')
    .eq('id', id)
    .eq('created_by', user.id)
    .single()

  if (!scenario) {
    return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })
  }

  // Cannot delete the last scenario on a persona
  if (scenario.persona_id) {
    const { count } = await supabase
      .from('scenarios')
      .select('id', { count: 'exact', head: true })
      .eq('persona_id', scenario.persona_id)
      .eq('created_by', user.id)
      .eq('is_active', true)

    if (count !== null && count <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete the last scenario on a persona. Delete the persona instead.' },
        { status: 400 }
      )
    }
  }

  const { error } = await supabase
    .from('scenarios')
    .delete()
    .eq('id', id)
    .eq('created_by', user.id)

  if (error) {
    console.error('Error deleting scenario:', error)
    return NextResponse.json({ error: 'Failed to delete scenario' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
