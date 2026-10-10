import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'

// Simple zero-dependency .env loader for standalone script
const envPath = path.resolve(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...rest] = trimmed.split('=')
      const val = rest.join('=').replace(/^["']|["']$/g, '')
      if (key && !process.env[key]) {
        process.env[key] = val
      }
    }
  }
}

const MONGODB_URI = process.env.MONGODB_URI!
if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI')
  process.exit(1)
}

async function runSeed() {
  await mongoose.connect(MONGODB_URI, { dbName: 'reselling' })
  console.log('Connected to MongoDB Atlas')

  const db = mongoose.connection.db!

  // Check if already seeded
  const userCount = await db.collection('users').countDocuments()
  if (userCount > 0) {
    console.log('Database already has users. Seeder will ensure admin exists.')
  } else {
    // 1. Seed Admin User
    const passwordHash = await bcrypt.hash('admin123', 10)
    await db.collection('users').insertOne({
      name: 'N-Fashion Admin',
      email: 'admin@nfashion.lk',
      passwordHash,
      role: 'admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    console.log('Admin user created: admin@nfashion.lk / admin123')
  }

  // 2. Seed Default Settings
  const settingsCount = await db.collection('settings').countDocuments()
  if (settingsCount === 0) {
    await db.collection('settings').insertOne({
      businessName: 'N-Fashion Reselling',
      currency: 'LKR',
      locale: 'en-LK',
      timezone: 'Asia/Colombo',
      dateFormat: 'dd/MM/yyyy',
      categories: ['T-Shirts', 'Shirts', 'Trousers', 'Jeans', 'Dresses', 'Skirts', 'Hoodies', 'Jackets', 'Shorts', 'Other'],
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'],
      colors: ['Black', 'White', 'Navy', 'Red', 'Blue', 'Green', 'Grey', 'Pink', 'Yellow', 'Beige'],
      channels: ['Physical', 'Facebook', 'Instagram', 'WhatsApp', 'Other'],
      expenseCategories: ['Advertising', 'Packaging', 'Delivery', 'Transport', 'Utilities', 'Rent', 'Platform Fees', 'Other'],
      lowStockThreshold: 3,
      batchAllocation: 'fifo',
      taxEnabled: false,
      receiptFooter: 'Thank you for shopping with N-Fashion! Visit us again.',
      contactPhone: '077 123 4567',
      address: '124 Galle Road, Colombo 03, Sri Lanka',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    console.log('Default ERP settings initialized')
  }

  console.log('Database initialization complete.')
  await mongoose.disconnect()
}

runSeed().catch((err) => {
  console.error('Seed error:', err)
  process.exit(1)
})
