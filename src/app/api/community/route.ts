import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const tag = searchParams.get('tag')
  const sort = searchParams.get('sort') || 'upvotes'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  let query = supabase
    .from('personas')
    .select('*', { count: 'exact' })
    .eq('source', 'community')
    .eq('is_public', true)
    .eq('is_active', true)

  if (tag && tag !== 'all') {
    query = query.contains('tags', [tag])
  }

  if (sort === 'upvotes') {
    query = query.order('upvotes', { ascending: false })
  } else if (sort === 'use_count') {
    query = query.order('use_count', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  query = query.range(offset, offset + limit - 1)

  const { data: personas, count, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch community personas' }, { status: 500 })
  }

  // Fetch user's votes for these personas
  const personaIds = (personas || []).map(p => p.id)
  let userVotes: string[] = []
  if (personaIds.length > 0) {
    const { data: votes } = await supabase
      .from('community_votes')
      .select('target_id')
      .eq('user_id', user.id)
      .eq('target_type', 'persona')
      .in('target_id', personaIds)

    userVotes = (votes || []).map(v => v.target_id)
  }

  return NextResponse.json({
    personas: personas || [],
    userVotes,
    total: count || 0,
    page,
    limit,
  })
}
