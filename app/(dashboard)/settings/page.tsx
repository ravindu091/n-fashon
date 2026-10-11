import React from 'react'
import { getSettings } from '@/models/Settings'
import { getBackupStatus } from '@/services/backup.service'
import { SettingsClient } from '@/components/settings/SettingsClient'
import connectDB from '@/lib/mongodb'

export default async function SettingsPage() {
  await connectDB()
  const [settings, backupStatus] = await Promise.all([
    getSettings(),
    getBackupStatus(),
  ])

  return (
    <SettingsClient
      settings={JSON.parse(JSON.stringify(settings))}
      backupStatus={JSON.parse(JSON.stringify(backupStatus))}
    />
  )
}

