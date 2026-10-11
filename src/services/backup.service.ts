import 'server-only'
import connectDB from '@/lib/mongodb'
import mongoose, { Types } from 'mongoose'
import { getSettings, recordBackupTimestamp } from '@/models/Settings'

export interface BackupMetadata {
  version: string
  system: string
  exportedAt: string
  counts: Record<string, number>
}

export interface BackupPayload {
  metadata: BackupMetadata
  data: Record<string, any[]>
}

export interface CollectionImportResult {
  inserted: number
  skipped: number
  totalInBackup: number
}

export interface ImportBackupReport {
  success: boolean
  totalInserted: number
  totalSkipped: number
  collections: Record<string, CollectionImportResult>
  exportedAt?: string
  importedAt: string
  error?: string
}

export interface BackupStatus {
  lastBackupDate: string | null
  daysSinceLastBackup: number | null
  isOverdue: boolean
}

// Ordered list of collections to guarantee relational consistency on import
export const BACKUP_COLLECTIONS = [
  'settings',
  'users',
  'sequencecounters',
  'products',
  'productvariants',
  'suppliers',
  'customers',
  'purchases',
  'stockbatches',
  'sales',
  'returns',
  'expenses',
  'stockmovements',
] as const

/** Revive strings into native BSON ObjectIds and Dates */
function reviveBson(val: any): any {
  if (val === null || val === undefined) return val

  if (typeof val === 'string') {
    // Revive ISO date strings
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(val)) {
      const d = new Date(val)
      if (!isNaN(d.getTime())) return d
    }
    return val
  }

  if (Array.isArray(val)) {
    return val.map(reviveBson)
  }

  if (typeof val === 'object') {
    const res: Record<string, any> = {}
    for (const [k, v] of Object.entries(val)) {
      // Check if key represents an ObjectId and value is a 24-character hex string
      if (
        (k === '_id' || k.endsWith('Id') || k.endsWith('_id')) &&
        typeof v === 'string' &&
        /^[0-9a-fA-F]{24}$/.test(v)
      ) {
        res[k] = new Types.ObjectId(v)
      } else {
        res[k] = reviveBson(v)
      }
    }
    return res
  }

  return val
}

/** Check backup status and whether weekly backup is overdue */
export async function getBackupStatus(): Promise<BackupStatus> {
  await connectDB()
  const settings = await getSettings()

  if (!settings.lastBackupDate) {
    return {
      lastBackupDate: null,
      daysSinceLastBackup: null,
      isOverdue: true, // Never backed up
    }
  }

  const lastBackup = new Date(settings.lastBackupDate)
  const diffMs = Date.now() - lastBackup.getTime()
  const daysSince = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  return {
    lastBackupDate: lastBackup.toISOString(),
    daysSinceLastBackup: daysSince,
    isOverdue: daysSince >= 7, // 7 days or more
  }
}

/** Export entire MongoDB database as a single structured JSON object */
export async function exportDatabaseJSON(): Promise<BackupPayload> {
  await connectDB()
  const db = mongoose.connection.db
  if (!db) throw new Error('Database connection is not available')

  const counts: Record<string, number> = {}
  const data: Record<string, any[]> = {}

  for (const colName of BACKUP_COLLECTIONS) {
    try {
      const collection = db.collection(colName)
      const docs = await collection.find({}).toArray()
      data[colName] = docs
      counts[colName] = docs.length
    } catch {
      data[colName] = []
      counts[colName] = 0
    }
  }

  // Update last backup timestamp in settings
  await recordBackupTimestamp()

  const metadata: BackupMetadata = {
    version: '1.0',
    system: 'N-Fashion Reselling ERP',
    exportedAt: new Date().toISOString(),
    counts,
  }

  return { metadata, data }
}

/**
 * Import database JSON without overlapping or overriding existing records.
 * If a record already exists (matched by _id or unique business key), it is preserved untouched.
 */
export async function importDatabaseJSON(payload: any): Promise<ImportBackupReport> {
  await connectDB()
  const db = mongoose.connection.db
  if (!db) throw new Error('Database connection is not available')

  if (!payload || typeof payload !== 'object' || !payload.data) {
    throw new Error('Invalid backup file format: missing "data" container.')
  }

  let totalInserted = 0
  let totalSkipped = 0
  const collectionReports: Record<string, CollectionImportResult> = {}

  for (const colName of BACKUP_COLLECTIONS) {
    const docs = payload.data[colName]
    if (!Array.isArray(docs) || docs.length === 0) {
      collectionReports[colName] = { inserted: 0, skipped: 0, totalInBackup: 0 }
      continue
    }

    const collection = db.collection(colName)
    let colInserted = 0
    let colSkipped = 0

    // Special case for singleton settings: never overwrite existing business configuration
    if (colName === 'settings') {
      const existingSettingsCount = await collection.countDocuments()
      if (existingSettingsCount > 0) {
        colSkipped += docs.length
        totalSkipped += docs.length
        collectionReports[colName] = { inserted: 0, skipped: docs.length, totalInBackup: docs.length }
        continue
      }
    }

    for (const rawDoc of docs) {
      if (!rawDoc || typeof rawDoc !== 'object') continue

      let isDuplicate = false

      // 1. Check if document exists by _id
      if (rawDoc._id) {
        let idVal: any = rawDoc._id
        if (typeof idVal === 'string' && /^[0-9a-fA-F]{24}$/.test(idVal)) {
          idVal = new Types.ObjectId(idVal)
        }
        const existingById = await collection.findOne({ _id: idVal })
        if (existingById) {
          isDuplicate = true
        }
      }

      // 2. Check by unique business identifiers if not already matched by _id
      if (!isDuplicate) {
        switch (colName) {
          case 'products':
          case 'suppliers':
            if (rawDoc.code) {
              const match = await collection.findOne({ code: rawDoc.code })
              if (match) isDuplicate = true
            }
            break

          case 'productvariants':
            if (rawDoc.code) {
              const match = await collection.findOne({ code: rawDoc.code })
              if (match) isDuplicate = true
            } else if (rawDoc.productId && rawDoc.size && rawDoc.color) {
              let pId = rawDoc.productId
              if (typeof pId === 'string' && /^[0-9a-fA-F]{24}$/.test(pId)) pId = new Types.ObjectId(pId)
              const match = await collection.findOne({ productId: pId, size: rawDoc.size, color: rawDoc.color })
              if (match) isDuplicate = true
            }
            break

          case 'customers':
            if (rawDoc.code) {
              const match = await collection.findOne({ code: rawDoc.code })
              if (match) isDuplicate = true
            } else if (rawDoc.phone) {
              const match = await collection.findOne({ phone: rawDoc.phone })
              if (match) isDuplicate = true
            }
            break

          case 'purchases':
            if (rawDoc.purchaseNumber) {
              const match = await collection.findOne({ purchaseNumber: rawDoc.purchaseNumber })
              if (match) isDuplicate = true
            }
            break

          case 'stockbatches':
            if (rawDoc.batchCode) {
              const match = await collection.findOne({ batchCode: rawDoc.batchCode })
              if (match) isDuplicate = true
            }
            break

          case 'sales':
            if (rawDoc.saleNumber) {
              const match = await collection.findOne({ saleNumber: rawDoc.saleNumber })
              if (match) isDuplicate = true
            } else if (rawDoc.idempotencyKey) {
              const match = await collection.findOne({ idempotencyKey: rawDoc.idempotencyKey })
              if (match) isDuplicate = true
            }
            break

          case 'returns':
            if (rawDoc.returnNumber) {
              const match = await collection.findOne({ returnNumber: rawDoc.returnNumber })
              if (match) isDuplicate = true
            }
            break

          case 'expenses':
            if (rawDoc.expenseNumber) {
              const match = await collection.findOne({ expenseNumber: rawDoc.expenseNumber })
              if (match) isDuplicate = true
            }
            break

          case 'users':
            if (rawDoc.username) {
              const match = await collection.findOne({ username: rawDoc.username })
              if (match) isDuplicate = true
            }
            break

          case 'sequencecounters':
            if (rawDoc.name) {
              const match = await collection.findOne({ name: rawDoc.name })
              if (match) isDuplicate = true
            }
            break
        }
      }

      // If existing record was found: PRESERVE & SKIP (NEVER OVERRIDE)
      if (isDuplicate) {
        colSkipped++
        totalSkipped++
        continue
      }

      // Record does not exist: safely revive BSON types and insert
      try {
        const revivedDoc = reviveBson(rawDoc)
        await collection.insertOne(revivedDoc)
        colInserted++
        totalInserted++
      } catch (err: any) {
        // If a unique index caught a collision during insertion, safely treat as skipped
        if (err.code === 11000) {
          colSkipped++
          totalSkipped++
        } else {
          throw err
        }
      }
    }

    collectionReports[colName] = {
      inserted: colInserted,
      skipped: colSkipped,
      totalInBackup: docs.length,
    }
  }

  return {
    success: true,
    totalInserted,
    totalSkipped,
    collections: collectionReports,
    exportedAt: payload.metadata?.exportedAt,
    importedAt: new Date().toISOString(),
  }
}
