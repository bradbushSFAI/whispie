'use client'

import { useEffect } from 'react'
import { identifyUser } from './events'

export function PostHogIdentify({ userId, properties }: { userId: string; properties?: Record<string, unknown> }) {
  useEffect(() => {
    identifyUser(userId, properties)
  }, [userId, properties])

  return null
}
