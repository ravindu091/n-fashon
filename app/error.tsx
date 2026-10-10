'use client'

import React, { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled app error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="card max-w-md w-full p-8 text-center shadow-lg">
        <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Something Went Wrong</h2>
        <p className="text-xs text-[var(--foreground-muted)] mb-6 leading-relaxed">
          {error.message || 'An unexpected error occurred while processing the request.'}
        </p>
        <Button onClick={reset} variant="primary" leftIcon={<RefreshCw className="w-4 h-4" />}>
          Try Again
        </Button>
      </div>
    </div>
  )
}
