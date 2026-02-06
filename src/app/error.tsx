'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
        <p className="text-slate-300 mb-6 max-w-md">
          We encountered an unexpected error. Please try again or contact support if the problem persists.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="bg-whispie-primary text-background-dark font-bold px-6 py-3 rounded-xl hover:brightness-110 transition-all"
          >
            Try Again
          </button>
          <a
            href="/dashboard"
            className="bg-white/10 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/20 transition-all"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  )
}
