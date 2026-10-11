import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/permissions'
import { exportDatabaseJSON } from '@/services/backup.service'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Only administrators are authorized to download full database backups
    await requireAuth(['admin'])

    const backupPayload = await exportDatabaseJSON()

    const now = new Date()
    const pad = (n: number) => n.toString().padStart(2, '0')
    const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
    const filename = `n-fashion-backup-${dateStr}.json`

    const jsonString = JSON.stringify(backupPayload, null, 2)

    return new Response(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    })
  } catch (err: any) {
    const status = err.message === 'UNAUTHORIZED' ? 401 : err.message === 'FORBIDDEN' ? 403 : 500
    return NextResponse.json(
      { error: err.message || 'Failed to generate backup export' },
      { status }
    )
  }
}
