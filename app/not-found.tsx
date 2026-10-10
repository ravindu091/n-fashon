import Link from 'next/link'
import { Shirt, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="card max-w-md w-full p-8 text-center shadow-lg">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-600">
          <Shirt className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Page Not Found</h2>
        <p className="text-xs text-[var(--foreground-muted)] mb-6">
          The page or inventory record you are looking for does not exist or has been archived.
        </p>
        <Link
          href="/dashboard"
          className="btn btn-primary inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
