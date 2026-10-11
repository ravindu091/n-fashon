import { Schema, model, models, Document, Model } from 'mongoose'

export interface ISettings extends Document {
  businessName: string
  businessLogo?: string
  currency: string
  locale: string
  timezone: string
  dateFormat: string
  categories: string[]
  sizes: string[]
  colors: string[]
  channels: string[]
  expenseCategories: string[]
  lowStockThreshold: number
  batchAllocation: 'fifo' | 'lifo' | 'manual'
  taxEnabled: boolean
  taxRate: number
  taxLabel: string
  receiptFooter: string
  contactPhone?: string
  contactEmail?: string
  address?: string
  minimumMarginPercent: number
  lastBackupDate?: Date
  updatedAt: Date
}

const SettingsSchema = new Schema<ISettings>(
  {
    businessName:      { type: String, default: 'N-Fashion' },
    businessLogo:      { type: String },
    currency:          { type: String, default: 'LKR' },
    locale:            { type: String, default: 'en-LK' },
    timezone:          { type: String, default: 'Asia/Colombo' },
    dateFormat:        { type: String, default: 'dd/MM/yyyy' },
    categories:        { type: [String], default: ['T-Shirts','Shirts','Trousers','Jeans','Dresses','Skirts','Hoodies','Jackets','Shorts','Other'] },
    sizes:             { type: [String], default: ['XS','S','M','L','XL','XXL','Free Size'] },
    colors:            { type: [String], default: ['Black','White','Navy','Red','Blue','Green','Grey','Pink','Yellow','Brown','Beige','Multi'] },
    channels:          { type: [String], default: ['Facebook','Instagram','WhatsApp','Physical','Other'] },
    expenseCategories: { type: [String], default: ['Advertising','Packaging','Delivery','Transport','Internet & Telephone','Platform Fees','Rent','Utilities','Other'] },
    lowStockThreshold:       { type: Number, default: 3, min: 0 },
    batchAllocation:         { type: String, enum: ['fifo','lifo','manual'], default: 'fifo' },
    taxEnabled:              { type: Boolean, default: false },
    taxRate:                 { type: Number, default: 0, min: 0, max: 100 },
    taxLabel:                { type: String, default: 'VAT' },
    receiptFooter:           { type: String, default: 'Thank you for shopping with N-Fashion!' },
    contactPhone:            { type: String },
    contactEmail:            { type: String },
    address:                 { type: String },
    minimumMarginPercent:    { type: Number, default: 0, min: 0 },
    lastBackupDate:          { type: Date },
  },
  { timestamps: true }
)

export const Settings: Model<ISettings> =
  models.Settings ?? model<ISettings>('Settings', SettingsSchema)

let cachedSettings: { doc: ISettings; expiresAt: number } | null = null

export function clearSettingsCache(): void {
  cachedSettings = null
}

/** Get or create the singleton settings document with in-memory caching */
export async function getSettings(): Promise<ISettings> {
  const now = Date.now()
  if (cachedSettings && cachedSettings.expiresAt > now) {
    return cachedSettings.doc
  }
  let s = await Settings.findOne()
  if (!s) s = await Settings.create({})
  cachedSettings = { doc: s, expiresAt: now + 60_000 }
  return s
}

/** Record that a manual backup was performed right now */
export async function recordBackupTimestamp(): Promise<Date> {
  const now = new Date()
  await Settings.findOneAndUpdate({}, { $set: { lastBackupDate: now } }, { upsert: true, new: true })
  clearSettingsCache()
  return now
}

