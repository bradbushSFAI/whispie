'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type ConversationItem = {
  id: string
  status: string
  created_at: string
  scenario: { title: string; category: string } | null
  persona: { name: string; title: string } | null
  analysis: { overall_score: number }[] | null
}

export function ConversationList({ conversations }: { conversations: ConversationItem[] }) {
  const router = useRouter()
  const [items, setItems] = useState(conversations)
  const [swipedId, setSwipedId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const touchStartX = useRef(0)
  const touchCurrentX = useRef(0)
  const swipeRef = useRef<string | null>(null)

  function handleTouchStart(id: string, e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchCurrentX.current = e.touches[0].clientX
    swipeRef.current = id
  }

  function handleTouchMove(e: React.TouchEvent) {
    touchCurrentX.current = e.touches[0].clientX
  }

  function handleTouchEnd() {
    const diff = touchStartX.current - touchCurrentX.current
    if (diff > 80 && swipeRef.current) {
      setSwipedId(swipeRef.current)
    } else if (diff < -40) {
      setSwipedId(null)
    }
    swipeRef.current = null
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setItems((prev) => prev.filter((c) => c.id !== id))
        setSwipedId(null)
      }
    } catch {
      // silently fail
    } finally {
      setDeleting(null)
    }
  }

  if (items.length === 0) {
    return (
      <div className="bg-surface-dark rounded-xl p-8 text-center border border-white/5">
        <p className="text-slate-300 mb-4">
          No conversations yet. Start your first scenario!
        </p>
        <Link
          href="/scenarios"
          className="inline-block bg-whispie-primary text-background-dark font-bold px-6 py-2 rounded-xl"
        >
          Browse Scenarios
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((conv) => {
        const score = conv.analysis?.[0]?.overall_score
        const isSwiped = swipedId === conv.id

        return (
          <div key={conv.id} className="relative overflow-hidden rounded-xl">
            {/* Delete button behind */}
            <div className="absolute inset-y-0 right-0 flex items-center">
              <button
                onClick={() => handleDelete(conv.id)}
                disabled={deleting === conv.id}
                className="h-full px-6 bg-red-500 text-white font-bold text-sm flex items-center"
              >
                {deleting === conv.id ? '...' : 'Delete'}
              </button>
            </div>

            {/* Swipeable card */}
            <div
              onTouchStart={(e) => handleTouchStart(conv.id, e)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className={`relative bg-surface-dark border border-white/5 hover:border-whispie-primary/50 transition-transform duration-200 ${
                isSwiped ? '-translate-x-24' : 'translate-x-0'
              }`}
            >
              <Link
                href={conv.status === 'completed' ? `/analysis/${conv.id}` : `/chat/${conv.id}`}
                className="block p-4"
                onClick={(e) => {
                  if (isSwiped) {
                    e.preventDefault()
                    setSwipedId(null)
                  }
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-whispie-primary uppercase tracking-wider">
                    {conv.scenario?.category || 'Practice'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(conv.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-white font-bold mb-1">
                  {conv.scenario?.title || 'Conversation'}
                </h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">
                    with {conv.persona?.name || 'AI'}
                  </span>
                  <div className="flex items-center gap-2">
                    {conv.status === 'active' ? (
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                        In Progress
                      </span>
                    ) : score ? (
                      <span className={`text-sm font-bold ${
                        score >= 80 ? 'text-whispie-primary' :
                        score >= 60 ? 'text-yellow-400' : 'text-orange-400'
                      }`}>
                        {score}
                      </span>
                    ) : (
                      <span className="text-xs bg-slate-500/20 text-slate-300 px-2 py-0.5 rounded-full">
                        Completed
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}
