'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
            <div className="size-16 rounded-full bg-subtle-dark flex items-center justify-center text-2xl ring-2 ring-red-500/30">
              {persona.name.charAt(0)}
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold dark:text-white leading-tight">{persona.name}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{persona.title}</p>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Scenario Context */}
        <div className="flex justify-center my-4">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full">
            {scenario.title}
          </span>
        </div>

        {/* Messages */}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 max-w-[90%] ${
              message.role === 'user' ? 'ml-auto justify-end' : ''
            }`}
          >
            {message.role === 'assistant' && (
              <div className="shrink-0 flex flex-col justify-end">
                <div className="size-8 rounded-full bg-subtle-dark flex items-center justify-center text-sm opacity-80">
                  {persona.name.charAt(0)}
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
            </div>
          </div>
        ))}

        {/* Streaming message */}
        {streamingContent && (
          <div className="flex gap-3 max-w-[90%]">
            <div className="shrink-0 flex flex-col justify-end">
              <div className="size-8 rounded-full bg-subtle-dark flex items-center justify-center text-sm opacity-80">
                {persona.name.charAt(0)}
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

          <p className="text-center mt-3 text-[10px] text-slate-400 dark:text-white/20">
            Whispie AI can make mistakes. This is practice, not real advice.
          </p>
        </div>
      </footer>
    </div>
  )
}
