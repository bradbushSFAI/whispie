'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ScenarioShareDialog } from './share-dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { Scenario } from '@/types/database'

type ScenarioActionsProps = {
  scenario: Scenario
  isLastScenario: boolean
  practiceCount: number
}

// Custom hook for sticky tooltip behavior
function useStickyTooltip(stickyDuration = 3000) {
  const [isOpen, setIsOpen] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleOpenChange = useCallback((open: boolean) => {
    if (open) {
      // Clear any existing timeout when opening
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      setIsOpen(true)
    } else {
      // Set timeout to close after sticky duration
      timeoutRef.current = setTimeout(() => {
        setIsOpen(false)
        timeoutRef.current = null
      }, stickyDuration)
    }
  }, [stickyDuration])

  const forceClose = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsOpen(false)
  }, [])

  return { isOpen, handleOpenChange, forceClose }
}

export function ScenarioActions({ scenario, isLastScenario, practiceCount }: ScenarioActionsProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sticky tooltip states
  const editTooltip = useStickyTooltip(3000)
  const shareTooltip = useStickyTooltip(3000)
  const deleteTooltip = useStickyTooltip(3000)

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/scenarios/${scenario.id}`, { method: 'DELETE' })
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

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between gap-3 mt-3">
        {/* Left side: Practice button */}
        <Link
          href={`/chat/new?scenario=${scenario.id}`}
          className="inline-block text-xs px-4 py-1.5 rounded-lg bg-whispie-primary text-background-dark font-bold hover:brightness-110 transition-all"
        >
          Practice
        </Link>

        {/* Right side: Actions */}
        <div className="flex items-center gap-1">
          {showConfirm ? (
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
          ) : (
            <>
              {/* Edit button */}
              <Tooltip 
                open={editTooltip.isOpen} 
                onOpenChange={editTooltip.handleOpenChange}
                delayDuration={0} 
                disableHoverableContent={false}
              >
                <TooltipTrigger asChild>
                  <Link
                    href={`/personas/${scenario.persona_id}/edit`}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
                    onClick={editTooltip.forceClose}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit Scenario</p>
                </TooltipContent>
              </Tooltip>
              {/* Share button */}
              <Tooltip 
                open={shareTooltip.isOpen} 
                onOpenChange={shareTooltip.handleOpenChange}
                delayDuration={0} 
                disableHoverableContent={false}
              >
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      shareTooltip.forceClose()
                      setShowShare(true)
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-whispie-primary hover:bg-white/5 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Share to Community</p>
                </TooltipContent>
              </Tooltip>
              {/* Delete button */}
              <Tooltip 
                open={deleteTooltip.isOpen} 
                onOpenChange={deleteTooltip.handleOpenChange}
                delayDuration={0} 
                disableHoverableContent={false}
              >
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      deleteTooltip.forceClose()
                      setShowConfirm(true)
                    }}
                    disabled={isLastScenario}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isLastScenario
                        ? 'text-slate-700 cursor-not-allowed'
                        : 'text-slate-500 hover:text-red-400 hover:bg-white/5'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isLastScenario ? 'Cannot delete the last scenario' : 'Delete Scenario'}</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </div>

      {/* Share dialog */}
      {showShare && (
        <ScenarioShareDialog
          scenario={scenario}
          onClose={() => setShowShare(false)}
          onShared={() => {
            setShowShare(false)
            router.refresh()
          }}
        />
      )}
    </TooltipProvider>
  )
}