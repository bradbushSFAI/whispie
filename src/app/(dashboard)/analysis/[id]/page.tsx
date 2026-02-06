import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AnalysisView } from './analysis-view'

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: conversationId } = await params
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get conversation with scenario and persona
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select(`
      *,
      scenario:scenarios(*),
      persona:personas(*)
    `)
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .single()

  if (convError || !conversation) {
    redirect('/dashboard')
  }

  // Get existing analysis if any
  const { data: existingAnalysis } = await supabase
    .from('analyses')
    .select('*')
    .eq('conversation_id', conversationId)
    .single()

  // Get user profile for display name
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  return (
    <AnalysisView
      conversation={conversation}
      initialAnalysis={existingAnalysis}
      userName={profile?.display_name || 'there'}
    />
  )
}
