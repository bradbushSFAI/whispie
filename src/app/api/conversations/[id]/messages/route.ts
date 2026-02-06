import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { model, generationConfig, buildSystemPrompt } from '@/lib/gemini'
import type { Persona, Scenario } from '@/types/database'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params
  const supabase = await createClient()

  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 })
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
    return new Response('Conversation not found', { status: 404 })
  }

  // Parse user message
  const body = await request.json()
  const userMessage = body.message

  if (!userMessage && conversation.total_turns > 0) {
    return new Response('Message is required', { status: 400 })
  }

  // Get existing messages
  const { data: existingMessages } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  // Build conversation history for Gemini
  const scenario = conversation.scenario as Scenario
  const persona = conversation.persona as Persona
  console.log('[messages] scenario:', scenario?.id, scenario?.title)
  console.log('[messages] persona:', persona?.id, persona?.name)
  const systemPrompt = buildSystemPrompt(persona, scenario)

  // If this is the first message, we need to start the conversation
  const isFirstTurn = !existingMessages || existingMessages.length === 0
  console.log('[messages] isFirstTurn:', isFirstTurn, 'existingMessages:', existingMessages?.length, 'total_turns:', conversation.total_turns)

  // Save user message if provided
  if (userMessage) {
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content: userMessage,
    })
  }

  // Build chat history for Gemini
  const chatHistory = (existingMessages || []).map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }))

  // Add user message to history if provided
  if (userMessage) {
    chatHistory.push({
      role: 'user',
      parts: [{ text: userMessage }],
    })
  }

  // Create streaming response
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        console.log('[messages] Starting Gemini chat with history length:', chatHistory.length)
        console.log('[messages] GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY)
        const chat = model.startChat({
          generationConfig,
          history: chatHistory,
          systemInstruction: systemPrompt,
        })

        // If first turn with no user message, prompt the AI to start
        const prompt = isFirstTurn && !userMessage
          ? 'Start the conversation in character.'
          : userMessage

        console.log('[messages] Sending prompt:', prompt?.slice(0, 100))
        const result = await chat.sendMessageStream(prompt)

        let fullResponse = ''

        for await (const chunk of result.stream) {
          const text = chunk.text()
          fullResponse += text
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
        }

        // Save assistant message
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: fullResponse,
        })

        // Update conversation turn count
        await supabase
          .from('conversations')
          .update({ total_turns: (conversation.total_turns || 0) + 1 })
          .eq('id', conversationId)

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
        controller.close()
      } catch (error: unknown) {
        const err = error as Error & { status?: number; statusText?: string; message?: string }
        console.error('[messages] Gemini streaming error:', {
          message: err?.message,
          status: err?.status,
          statusText: err?.statusText,
          name: err?.name,
          stack: err?.stack?.slice(0, 500),
        })
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: err?.message || 'Failed to generate response' })}\n\n`)
        )
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
