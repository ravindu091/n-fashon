'use client'

import React, { useActionState } from 'react'
import { loginAction } from '@/actions/auth.actions'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Shirt, Lock, Mail, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, undefined)

  return (
    <div className="min-h-screen bg-[var(--sidebar-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden">
        {/* Brand Banner */}
        <div className="bg-gradient-to-br from-[#0D1F3C] to-[#1E3A6E] p-8 text-center text-white">
          <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Shirt className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">N-Fashion Reselling</h1>
          <p className="text-xs text-slate-300 mt-1">
            Private Clothing Business Management System
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8">
          <h2 className="text-base font-bold text-[var(--foreground)] mb-1">
            Sign In to Dashboard
          </h2>
          <p className="text-xs text-[var(--foreground-muted)] mb-6">
            Enter your credentials to access inventory and sales records.
          </p>

          {state?.error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{state.error}</span>
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div>
              <Input
                label="Email Address"
                type="email"
                name="email"
                placeholder="admin@nfashion.lk"
                defaultValue="admin@nfashion.lk"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                name="password"
                placeholder="••••••••"
                defaultValue="admin123"
                required
                autoComplete="current-password"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full py-2.5"
                isLoading={isPending}
              >
                Sign In
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-[var(--border)] text-center">
            <p className="text-[11px] text-[var(--foreground-muted)]">
              Default credentials: <span className="font-semibold text-[var(--foreground)]">admin@nfashion.lk</span> / <span className="font-semibold text-[var(--foreground)]">admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
