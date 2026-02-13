import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Avatar utility functions for deterministic fallback
const AVATAR_OPTIONS = Array.from({ length: 30 }, (_, i) => `avatar-${String(i + 1).padStart(2, '0')}.webp`)

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

export function getPersonaAvatarUrl(personaName: string, existingAvatarUrl?: string | null): string {
  // If there's an existing avatar URL, use it
  if (existingAvatarUrl) {
    return existingAvatarUrl
  }

  // Otherwise, generate deterministic default based on persona name
  const hash = hashString(personaName)
  const index = hash % AVATAR_OPTIONS.length
  return `/avatars/${AVATAR_OPTIONS[index]}`
}
