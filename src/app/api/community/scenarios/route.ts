import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const sort = searchParams.get('sort') || 'upvotes'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  let query = supabase
    .from('scenarios')
    .select('*, persona:personas(id, name, title, difficulty, tags, avatar_url)', { count: 'exact' })
    .eq('source', 'community')
    .eq('is_public', true)
    .eq('is_active', true)

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  if (sort === 'upvotes') {
    query = query.order('upvotes', { ascending: false })
  } else if (sort === 'use_count') {
    query = query.order('use_count', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  query = query.range(offset, offset + limit - 1)

  const { data: scenarios, count, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch community scenarios' }, { status: 500 })
  }

  // Fetch user's votes for these scenarios
  const scenarioIds = (scenarios || []).map(s => s.id)
  let userVotes: string[] = []
  if (scenarioIds.length > 0) {
    const { data: votes } = await supabase
      .from('community_votes')
      .select('target_id')
      .eq('user_id', user.id)
      .eq('target_type', 'scenario')
      .in('target_id', scenarioIds)

    userVotes = (votes || []).map(v => v.target_id)
  }

  return NextResponse.json({
    scenarios: scenarios || [],
    userVotes,
    total: count || 0,
    page,
    limit,
  })
}
