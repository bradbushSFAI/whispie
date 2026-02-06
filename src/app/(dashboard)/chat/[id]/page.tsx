import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChatInterface } from './chat-interface'

export default async function ChatPage({
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
  const { data: conversation, error } = await supabase
    .from('conversations')
    .select(`
      *,
      scenario:scenarios(*),
      persona:personas(*)
    `)
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .single()

  if (error || !conversation) {
    redirect('/scenarios')
  }

  // Get existing messages
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  return (
    <ChatInterface
      conversation={conversation}
      initialMessages={messages || []}
    />
  )
}
