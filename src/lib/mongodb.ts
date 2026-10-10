import 'server-only'
import mongoose from 'mongoose'
import dns from 'dns'

// Only set custom DNS on local development (Windows) — avoid overriding Vercel's internal VPC resolvers
if (process.env.NODE_ENV === 'development') {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1'])
  } catch {
    // fallback
  }
}

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable in .env')
}

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

// Use a global cache to preserve connection across HMR reloads in dev
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined
}

const cache: MongooseCache = global.mongooseCache ?? { conn: null, promise: null }
if (!global.mongooseCache) global.mongooseCache = cache

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn && mongoose.connection.readyState === 1) {
    return cache.conn
  }

  if (!cache.promise) {
    const opts = {
      dbName: process.env.MONGODB_DB ?? 'reselling',
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 45000,
      serverSelectionTimeoutMS: 6000,
      socketTimeoutMS: 20000,
      connectTimeoutMS: 6000,
    }

    cache.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((m) => {
        cache.conn = m
        return m
      })
      .catch((err) => {
        cache.promise = null
        cache.conn = null
        throw err
      })
  }

  cache.conn = await cache.promise
  return cache.conn
}

export default connectDB
