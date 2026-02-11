'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ScenarioActions({
  scenarioId,
  isLastScenario,
}: {
  scenarioId: string
  isLastScenario: boolean
}) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/scenarios/${scenarioId}`, { method: 'DELETE' })
      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to delete')
      }
    } finally {
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="flex flex-col items-end gap-1">
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex items-center gap-1">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-xs px-2 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
          >
            {isDeleting ? '...' : 'Delete'}
          </button>
          <button
            onClick={() => { setShowConfirm(false); setError(null) }}
            className="text-xs px-2 py-1 rounded-lg text-slate-400 hover:text-slate-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      disabled={isLastScenario}
      className={`p-1.5 rounded-lg transition-colors ${
        isLastScenario
          ? 'text-slate-700 cursor-not-allowed'
          : 'text-slate-500 hover:text-red-400 hover:bg-white/5'
      }`}
      title={isLastScenario ? 'Cannot delete the last scenario' : 'Delete scenario'}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  )
}
