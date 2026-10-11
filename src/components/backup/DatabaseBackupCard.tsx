'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Database,
  Download,
  Upload,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  Layers,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/utils/date'
import { importBackupAction, recordManualBackupAction } from '@/actions/backup.actions'
import type { ImportBackupReport } from '@/services/backup.service'

interface DatabaseBackupCardProps {
  lastBackupDate?: string | null
  daysSinceLastBackup?: number | null
  isOverdue?: boolean
}

export function DatabaseBackupCard({
  lastBackupDate: initialDate = null,
  daysSinceLastBackup: initialDays = null,
  isOverdue: initialOverdue = true,
}: DatabaseBackupCardProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [lastBackupDate, setLastBackupDate] = useState<string | null>(initialDate)
  const [daysSince, setDaysSince] = useState<number | null>(initialDays)
  const [isOverdue, setIsOverdue] = useState(initialOverdue)

  const [isExporting, setIsExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<{
    exportedAt?: string
    counts?: Record<string, number>
    totalItems?: number
  } | null>(null)

  const [isImporting, setIsImporting] = useState(false)
  const [importReport, setImportReport] = useState<ImportBackupReport | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  // Handle Manual JSON Export
  const handleExport = async () => {
    setIsExporting(true)
    setExportSuccess(false)
    try {
      const link = document.createElement('a')
      link.href = '/api/backup/export'
      link.download = ''
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      const res = await recordManualBackupAction()
      if (res.success && res.data) {
        setLastBackupDate(res.data.recordedAt)
        setDaysSince(0)
        setIsOverdue(false)
      }
      setExportSuccess(true)
      setTimeout(() => setExportSuccess(false), 5000)
      router.refresh()
    } catch (err: any) {
      console.error('Export error:', err)
    } finally {
      setIsExporting(false)
    }
  }

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setImportError(null)
    setImportReport(null)

    if (!file) {
      setSelectedFile(null)
      setFilePreview(null)
      return
    }

    if (!file.name.endsWith('.json')) {
      setImportError('Please select a valid JSON backup file (*.json).')
      setSelectedFile(null)
      setFilePreview(null)
      return
    }

    setSelectedFile(file)

    // Quick preview parse
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const parsed = JSON.parse(text)
        if (parsed.data && typeof parsed.data === 'object') {
          let total = 0
          for (const key of Object.keys(parsed.data)) {
            if (Array.isArray(parsed.data[key])) {
              total += parsed.data[key].length
            }
          }
          setFilePreview({
            exportedAt: parsed.metadata?.exportedAt,
            counts: parsed.metadata?.counts,
            totalItems: total,
          })
        } else {
          setFilePreview({ totalItems: 0 })
        }
      } catch {
        setImportError('The selected file is not valid JSON.')
        setSelectedFile(null)
        setFilePreview(null)
      }
    }
    reader.readAsText(file)
  }

  // Handle Safe Import
  const handleImport = async () => {
    if (!selectedFile) return

    setIsImporting(true)
    setImportError(null)
    setImportReport(null)

    try {
      const text = await selectedFile.text()
      const res = await importBackupAction(text)

      if (!res.success || !res.data) {
        setImportError(res.error || 'Failed to import backup.')
      } else {
        setImportReport(res.data)
        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = ''
        setSelectedFile(null)
        setFilePreview(null)
        router.refresh()
      }
    } catch (err: any) {
      setImportError(err.message || 'An error occurred during import.')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="card p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--foreground)]">
              Database Backup & Disaster Recovery
            </h2>
            <p className="text-xs text-[var(--foreground-muted)]">
              Manual JSON snapshot export and non-destructive data restoration.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOverdue ? (
            <Badge variant="warning">Backup Overdue (&gt; 7 days)</Badge>
          ) : (
            <Badge variant="success">Backup Up to Date</Badge>
          )}
        </div>
      </div>

      {/* Backup Status Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50/70 rounded-lg border border-[var(--border)] text-xs">
        <div>
          <span className="text-[var(--foreground-muted)] font-medium block">Last Backup Recorded:</span>
          <span className="font-bold text-[var(--foreground)] text-sm">
            {lastBackupDate ? formatDate(lastBackupDate) : 'Never'}
          </span>
        </div>
        <div>
          <span className="text-[var(--foreground-muted)] font-medium block">Weekly Schedule:</span>
          <span className="font-semibold text-slate-700">
            {daysSince !== null ? `${daysSince} day(s) since last backup` : 'No previous backup on file'}
          </span>
        </div>
      </div>

      {/* Two action columns: Export vs Import */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-1">
        {/* Export Column */}
        <div className="flex flex-col justify-between p-4 rounded-lg border border-[var(--border)] bg-white space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-[var(--accent)]" />
              <h3 className="text-sm font-bold text-[var(--foreground)]">Export Database (Manual JSON)</h3>
            </div>
            <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
              Downloads a complete, structured JSON backup file containing all 13 collections (products, variants,
              purchases, batches, movements, sales, customers, suppliers, expenses, returns, users, and settings).
            </p>
          </div>

          <div className="space-y-2 pt-2">
            {exportSuccess && (
              <div className="p-2.5 rounded-md bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Backup file downloaded successfully! Last backup timestamp updated.</span>
              </div>
            )}
            <Button
              variant="outline"
              onClick={handleExport}
              isLoading={isExporting}
              leftIcon={<Download className="w-4 h-4 text-[var(--accent)]" />}
              className="w-full justify-center"
            >
              Download Full Database Backup (.json)
            </Button>
          </div>
        </div>

        {/* Import Column */}
        <div className="flex flex-col justify-between p-4 rounded-lg border border-[var(--border)] bg-white space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-[var(--foreground)]">Safe Non-Destructive Import</h3>
            </div>
            <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
              Restore data from a JSON backup. <strong>Existing records are never overwritten</strong>. Any records
              matching an existing ID, product code, sale number, or supplier code are safely preserved as-is.
            </p>
          </div>

          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
            />

            {filePreview && (
              <div className="p-2.5 rounded bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5">
                    <FileJson className="w-3.5 h-3.5" /> {selectedFile?.name}
                  </span>
                  <span>{Math.round((selectedFile?.size || 0) / 1024)} KB</span>
                </div>
                {filePreview.exportedAt && (
                  <p className="text-[11px] text-blue-700">
                    Exported: {new Date(filePreview.exportedAt).toLocaleString()}
                  </p>
                )}
                {filePreview.totalItems !== undefined && (
                  <p className="text-[11px] font-medium text-blue-800">
                    Total payload items: {filePreview.totalItems} records across collections
                  </p>
                )}
              </div>
            )}

            {importError && (
              <div className="p-2.5 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            <Button
              variant="primary"
              onClick={handleImport}
              isLoading={isImporting}
              disabled={!selectedFile}
              leftIcon={<Upload className="w-4 h-4" />}
              className="w-full justify-center"
            >
              Run Safe Non-Destructive Import
            </Button>
          </div>
        </div>
      </div>

      {/* Safety Notice Callout */}
      <div className="p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Non-Destructive Guarantee:</strong> If a document already exists in MongoDB, the import engine skips
          it entirely. It will never overwrite, alter prices, reset stock counts, or delete your existing records.
        </div>
      </div>

      {/* Detailed Import Results Modal / Report */}
      {importReport && (
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-300 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h4 className="text-sm font-bold text-slate-900">Import Completed Successfully</h4>
            </div>
            <button
              onClick={() => setImportReport(null)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Dismiss
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 rounded bg-white border border-slate-200">
              <span className="text-slate-500 block text-[11px]">New Records Inserted</span>
              <strong className="text-base text-emerald-600 font-mono font-bold">
                +{importReport.totalInserted}
              </strong>
            </div>
            <div className="p-2.5 rounded bg-white border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Existing Records Skipped</span>
              <strong className="text-base text-slate-700 font-mono font-bold">
                {importReport.totalSkipped} (Preserved)
              </strong>
            </div>
            <div className="p-2.5 rounded bg-white border border-slate-200 col-span-2 sm:col-span-1">
              <span className="text-slate-500 block text-[11px]">Execution Time</span>
              <span className="text-xs text-slate-700">{new Date(importReport.importedAt).toLocaleTimeString()}</span>
            </div>
          </div>

          <div className="overflow-x-auto max-h-60 overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-200/60 text-slate-700 sticky top-0 font-semibold">
                <tr>
                  <th className="p-1.5 pl-2">Collection</th>
                  <th className="p-1.5 text-center">New Inserted</th>
                  <th className="p-1.5 text-center">Existing Skipped</th>
                  <th className="p-1.5 text-right pr-2">Total in File</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {Object.entries(importReport.collections).map(([col, stats]) => (
                  <tr key={col} className="hover:bg-slate-50">
                    <td className="p-1.5 pl-2 font-mono text-slate-800 capitalize">{col}</td>
                    <td className="p-1.5 text-center font-bold text-emerald-600">
                      {stats.inserted > 0 ? `+${stats.inserted}` : '0'}
                    </td>
                    <td className="p-1.5 text-center text-slate-600 font-medium">{stats.skipped}</td>
                    <td className="p-1.5 text-right pr-2 text-slate-500">{stats.totalInBackup}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
