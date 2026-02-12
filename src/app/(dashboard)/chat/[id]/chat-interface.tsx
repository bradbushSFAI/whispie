'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Message, Conversation, Scenario, Persona } from '@/types/database'

type ConversationWithDetails = Conversation & {
  scenario: Scenario
  persona: Persona
}

export function ChatInterface({
  conversation,
  initialMessages,
}: {
  conversation: ConversationWithDetails
  initialMessages: Message[]
}) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const hasStartedRef = useRef(false)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const startConversation = useCallback(async () => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true

    setIsLoading(true)
    setStreamingContent('')

    try {
      const response = await fetch(
        `/api/conversations/${conversation.id}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: null }),
        }
      )

      if (!response.ok) throw new Error('Failed to start conversation')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader available')

      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = new TextDecoder().decode(value)
        const lines = text.split('\n\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6))
            if (data.text) {
              fullContent += data.text
              setStreamingContent(fullContent)
            }
            if (data.done) {
              setMessages((prev) => [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  conversation_id: conversation.id,
                  role: 'assistant',
                  content: fullContent,
                  created_at: new Date().toISOString(),
                },
              ])
              setStreamingContent('')
            }
          }
        }
      }
    } catch (error) {
      console.error('Error starting conversation:', error)
      hasStartedRef.current = false
    } finally {
      setIsLoading(false)
    }
  }, [conversation.id])

  // Start conversation if no messages
  useEffect(() => {
    if (initialMessages.length === 0) {
      startConversation()
    }
  }, [initialMessages.length, startConversation])

  // Auto-focus input after AI finishes responding
  useEffect(() => {
    if (!isLoading) {
      textareaRef.current?.focus()
    }
  }, [isLoading])

  async function sendMessage() {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)
    setStreamingContent('')

    // Optimistically add user message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      conversation_id: conversation.id,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])

    try {
      const response = await fetch(
        `/api/conversations/${conversation.id}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMessage }),
        }
      )

      if (!response.ok) throw new Error('Failed to send message')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader available')

      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = new TextDecoder().decode(value)
        const lines = text.split('\n\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.error) {
                console.error('Server error:', data.error)
                setStreamingContent(`Error: ${data.error}`)
              }
              if (data.text) {
                fullContent += data.text
                setStreamingContent(fullContent)
              }
              if (data.done) {
                setMessages((prev) => [
                  ...prev,
                  {
                    id: crypto.randomUUID(),
                    conversation_id: conversation.id,
                    role: 'assistant',
                    content: fullContent,
                    created_at: new Date().toISOString(),
                  },
                ])
                setStreamingContent('')
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function redoLastMessage(userMessageIndex: number) {
    if (isLoading) return

    const userMessage = messages[userMessageIndex]
    if (!userMessage || userMessage.role !== 'user') return

    // Find the assistant message that follows this user message
    const assistantMessageIndex = userMessageIndex + 1
    const assistantMessage = messages[assistantMessageIndex]

    if (!assistantMessage || assistantMessage.role !== 'assistant') return

    try {
      const supabase = createClient()

      // Delete both the user message and assistant message from the database
      await supabase
        .from('messages')
        .delete()
        .in('id', [userMessage.id, assistantMessage.id])

      // Delete both messages from state
      setMessages((prev) => prev.filter((_, i) => i !== userMessageIndex && i !== assistantMessageIndex))

      // Put the user message text back into the input field for editing
      setInput(userMessage.content)

      // Focus the textarea
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 0)
    } catch (error) {
      console.error('Error preparing redo:', error)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const { persona, scenario } = conversation

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white h-screen overflow-hidden flex flex-col">
      {/* Header */}
      <header className="shrink-0 px-4 pt-6 pb-4 border-b border-slate-200 dark:border-white/5 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/scenarios')}
            className="flex items-center justify-center size-10 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <h1 className="text-sm font-semibold tracking-wide text-slate-500 dark:text-slate-400 uppercase">
                {scenario.category}
              </h1>
            </div>
          </div>
          <button
            onClick={() => router.push(`/analysis/${conversation.id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-whispie-primary/10 hover:bg-whispie-primary/20 text-whispie-primary transition-colors"
          >
            <span className="text-xs font-bold">End</span>
          </button>
        </div>

        {/* Persona Header */}
        <div className="mt-4 flex flex-col items-center gap-3">
          <div className="relative">
            <div className="size-16 rounded-full bg-subtle-dark flex items-center justify-center text-2xl ring-2 ring-red-500/30 overflow-hidden">
              {persona.avatar_url ? (
                <img src={persona.avatar_url} alt={persona.name} className="w-full h-full object-cover" />
              ) : (
                persona.name.charAt(0)
              )}
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold dark:text-white leading-tight">{persona.name}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{persona.title}</p>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6 max-w-3xl mx-auto w-full">
        {/* Scenario Backstory */}
        <div className="mx-auto max-w-md mb-2">
          <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-whispie-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-bold text-whispie-primary uppercase tracking-wide">Your Scenario</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {scenario.context}
            </p>
            {scenario.objectives && scenario.objectives.length > 0 && (
              <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Your goals:</p>
                <ul className="space-y-1">
                  {scenario.objectives.map((objective, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="text-whispie-primary mt-0.5">•</span>
                      <span>{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        {messages.map((message, index) => {
          // Check if this is the last user message with a response after it
          const isLastUserMessage = message.role === 'user' &&
            index === messages.length - 2 &&
            messages[index + 1]?.role === 'assistant'

          return (
            <div
              key={message.id}
              className={`flex gap-3 max-w-[90%] ${
                message.role === 'user' ? 'ml-auto justify-end' : ''
              }`}
            >
              {message.role === 'assistant' && (
                <div className="shrink-0 flex flex-col justify-end">
                  <div className="size-8 rounded-full bg-subtle-dark flex items-center justify-center text-sm opacity-80 overflow-hidden">
                    {persona.avatar_url ? (
                      <img src={persona.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      persona.name.charAt(0)
                    )}
                  </div>
                </div>
              )}
              <div
                className={`flex flex-col gap-1 ${
                  message.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`p-4 shadow-sm ${
                    message.role === 'user'
                      ? 'bg-whispie-primary rounded-2xl rounded-br-none text-background-dark'
                      : 'bg-white dark:bg-surface-dark rounded-2xl rounded-bl-none border border-slate-100 dark:border-white/5'
                  }`}
                >
                  <p
                    className={`text-base leading-relaxed ${
                      message.role === 'user'
                        ? 'font-medium'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {message.content}
                  </p>
                </div>
                {/* Redo button for last user message */}
                {isLastUserMessage && !isLoading && (
                  <button
                    onClick={() => redoLastMessage(index)}
                    className="flex items-center gap-1 px-2 py-1 rounded-full text-xs text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    title="Regenerate response"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Redo</span>
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {/* Streaming message */}
        {streamingContent && (
          <div className="flex gap-3 max-w-[90%]">
            <div className="shrink-0 flex flex-col justify-end">
              <div className="size-8 rounded-full bg-subtle-dark flex items-center justify-center text-sm opacity-80 overflow-hidden">
                {persona.avatar_url ? (
                  <img src={persona.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  persona.name.charAt(0)
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1 items-start">
              <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl rounded-bl-none shadow-sm border border-slate-100 dark:border-white/5">
                <p className="text-base text-slate-700 dark:text-slate-200 leading-relaxed">
                  {streamingContent}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Typing Indicator */}
        {isLoading && !streamingContent && (
          <div className="flex items-center gap-3 pl-11 animate-pulse">
            <p className="text-xs font-bold text-slate-400">{persona.name} is thinking...</p>
          </div>
        )}

        <div ref={messagesEndRef} className="h-2" />
      </main>

      {/* Input Area */}
      <footer className="shrink-0 p-4 bg-background-light dark:bg-background-dark border-t border-slate-200 dark:border-white/5">
        <div className="max-w-4xl mx-auto w-full relative">
          <div className="flex items-end gap-2 bg-slate-100 dark:bg-surface-dark p-1.5 rounded-3xl border border-slate-200 dark:border-white/5 focus-within:ring-2 focus-within:ring-whispie-primary/50 transition-shadow">
            {/* Input Field */}
            <div className="flex-1 py-2.5 px-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent border-none p-0 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-0 resize-none text-base max-h-32"
                placeholder="Type your response..."
                rows={1}
                disabled={isLoading}
              />
            </div>

            {/* End Conversation Button */}
            <button
              onClick={() => router.push(`/analysis/${conversation.id}`)}
              disabled={isLoading}
              className="shrink-0 size-10 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="End conversation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Send Button */}
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="shrink-0 size-10 flex items-center justify-center rounded-full bg-whispie-primary text-background-dark hover:brightness-110 shadow-lg shadow-whispie-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </div>

          <p className="text-center mt-3 text-[10px] text-slate-400 dark:text-white/50">
            Whispie AI can make mistakes. This is practice, not real advice.
          </p>
        </div>
      </footer>
    </div>
  )
}
