'use client'

import { useState, useCallback } from 'react'

type UseVoteOptions = {
  targetType: 'persona' | 'scenario'
  targetId: string
  initialVoted: boolean
  initialCount: number
}

export function useVote({ targetType, targetId, initialVoted, initialCount }: UseVoteOptions) {
  const [hasVoted, setHasVoted] = useState(initialVoted)
  const [voteCount, setVoteCount] = useState(initialCount)
  const [isLoading, setIsLoading] = useState(false)

  const toggleVote = useCallback(async () => {
    if (isLoading) return

    // Optimistic update
    const wasVoted = hasVoted
    const prevCount = voteCount
    setHasVoted(!wasVoted)
    setVoteCount(wasVoted ? prevCount - 1 : prevCount + 1)
    setIsLoading(true)

    try {
      const res = await fetch('/api/community/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_type: targetType, target_id: targetId }),
      })

      if (!res.ok) throw new Error('Vote failed')

      const data = await res.json()
      setHasVoted(data.voted)
    } catch {
      // Revert on error
      setHasVoted(wasVoted)
      setVoteCount(prevCount)
    } finally {
      setIsLoading(false)
    }
  }, [targetType, targetId, hasVoted, voteCount, isLoading])

  return { hasVoted, voteCount, toggleVote, isLoading }
}
