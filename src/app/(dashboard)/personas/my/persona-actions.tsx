'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShareDialog } from '@/components/personas/share-dialog'
import type { Persona } from '@/types/database'

export function PersonaActions({ persona }: { persona: Persona }) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showShare, setShowShare] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/personas/${persona.id}`, { method: 'DELETE' })
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-1">
        {showConfirm ? (
          <>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-xs px-2 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            >
              {isDeleting ? '...' : 'Delete'}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="text-xs px-2 py-1 rounded-lg text-slate-400 hover:text-slate-300 transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            {/* Share button */}
            <button
              onClick={() => setShowShare(true)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-whispie-primary hover:bg-white/5 transition-colors"
              title="Share to community"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
            {/* Delete button */}
            <button
              onClick={() => setShowConfirm(true)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-white/5 transition-colors"
              title="Delete persona"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Share dialog */}
      {showShare && (
        <ShareDialog
          persona={persona}
          onClose={() => setShowShare(false)}
          onShared={() => {
            setShowShare(false)
            router.refresh()
          }}
        />
      )}
    </>
  )
}
