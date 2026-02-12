'use client'

import { useState } from 'react'
import Image from 'next/image'

// Generate array of avatar filenames
const AVATAR_OPTIONS = Array.from({ length: 30 }, (_, i) => `avatar-${String(i + 1).padStart(2, '0')}.svg`)

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

function getDefaultAvatar(personaName: string): string {
  const hash = hashString(personaName)
  const index = hash % AVATAR_OPTIONS.length
  return `/avatars/${AVATAR_OPTIONS[index]}`
}

type AvatarPickerProps = {
  value?: string
  onChange: (avatarUrl: string) => void
  personaName?: string
}

export function AvatarPicker({ value, onChange, personaName = '' }: AvatarPickerProps) {
  // Default to hash-based selection if no value provided
  const defaultAvatar = getDefaultAvatar(personaName)
  const selectedAvatar = value || defaultAvatar

  // Update parent when default changes
  if (!value && personaName && selectedAvatar !== value) {
    onChange(selectedAvatar)
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-slate-300">
        Avatar
      </label>

      {/* Selected avatar preview */}
      <div className="flex items-center gap-3">
        <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-slate-600">
          <Image
            src={selectedAvatar}
            alt="Selected avatar"
            fill
            className="object-cover"
          />
        </div>
        <div className="text-sm text-slate-400">
          {personaName ? `Auto-selected based on "${personaName}"` : 'Choose an avatar below'}
        </div>
      </div>

      {/* Avatar grid */}
      <div className="grid grid-cols-6 gap-2">
        {AVATAR_OPTIONS.map((filename) => {
          const avatarUrl = `/avatars/${filename}`
          const isSelected = selectedAvatar === avatarUrl

          return (
            <button
              key={filename}
              type="button"
              onClick={() => onChange(avatarUrl)}
              className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all hover:scale-105 ${
                isSelected
                  ? 'border-primary ring-2 ring-primary/50'
                  : 'border-slate-600 hover:border-slate-500'
              }`}
            >
              <Image
                src={avatarUrl}
                alt={`Avatar option ${filename}`}
                fill
                className="object-cover"
              />
            </button>
          )
        })}
      </div>

      <p className="text-xs text-slate-500">
        Click any avatar to select it, or let it auto-select based on the persona name.
      </p>
    </div>
  )
}