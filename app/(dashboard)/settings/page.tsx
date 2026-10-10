import React from 'react'
import { getSettings } from '@/models/Settings'
import { SettingsClient } from '@/components/settings/SettingsClient'
import connectDB from '@/lib/mongodb'


export default async function SettingsPage() {
  await connectDB()
  const settings = await getSettings()

  return <SettingsClient settings={JSON.parse(JSON.stringify(settings))} />
}
