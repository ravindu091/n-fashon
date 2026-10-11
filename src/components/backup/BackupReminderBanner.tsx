'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Database, Download, X, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/utils/date'
import { recordManualBackupAction } from '@/actions/backup.actions'

interface BackupReminderBannerProps {
  status: {
    lastBackupDate: string | null
    daysSinceLastBackup: number | null
    isOverdue: boolean
  }
}

export function BackupReminderBanner({ status }: BackupReminderBannerProps) {
  const router = useRouter()
  const [isDismissed, setIsDismissed] = useState(true) // Default true until mounted to prevent hydration flash
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    // Check if dismissed in the current browser session
    const dismissed = sessionStorage.getItem('nfashion_backup_dismissed')
    if (!dismissed && status.isOverdue) {
      setIsDismissed(false)
    }
  }, [status.isOverdue])

  if (!status.isOverdue || isDismissed) {
    return null
  }

  const handleDismiss = () => {
    sessionStorage.setItem('nfashion_backup_dismissed', 'true')
    setIsDismissed(true)
  }

  const handleDownload = async () => {
    setIsExporting(true)
    try {
      // Trigger browser download via API
      const link = document.createElement('a')
      link.href = '/api/backup/export'
      link.download = ''
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Record backup date in database
      await recordManualBackupAction()
      setIsDismissed(true)
      router.refresh()
    } catch (err) {
      console.error('Failed to trigger backup download:', err)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="card p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200/80 shadow-xs text-xs text-amber-950 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0 mt-0.5">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-900 text-sm">Weekly Database Backup Reminder</span>
            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-200 text-amber-800 rounded">
              Recommended
            </span>
          </div>
          <p className="text-amber-800/90 text-xs mt-0.5 leading-relaxed">
            {status.lastBackupDate ? (
              <>
                Your last database backup was <strong>{status.daysSinceLastBackup} days ago</strong> (
                {formatDate(status.lastBackupDate)}). Keep your business records secure by saving a fresh weekly copy.
              </>
            ) : (
              <>
                No database backup has been recorded yet. Please download a manual JSON backup to protect your garments,
                sales, and purchase data.
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
        <Button
          size="sm"
          variant="outline"
          onClick={handleDismiss}
          className="text-amber-800 hover:bg-amber-100/70 border-amber-300 text-xs"
        >
          Remind Me Later
        </Button>
        <Button
          size="sm"
          variant="primary"
          onClick={handleDownload}
          isLoading={isExporting}
          leftIcon={<Download className="w-3.5 h-3.5" />}
          className="bg-amber-600 hover:bg-amber-700 text-white border-none shadow-xs text-xs"
        >
          Download Backup Now
        </Button>
      </div>
    </div>
  )
}
