import 'server-only'
import mongoose from 'mongoose'
import dns from 'dns'

// Use reliable DNS resolvers (Google & Cloudflare) for Atlas SRV lookups on local environments
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1'])
} catch {
  // fallback to system resolver
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
  if (cache.conn) return cache.conn

  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI, {
      dbName: process.env.MONGODB_DB ?? 'reselling',
      bufferCommands: false,
      maxPoolSize: 10,
    })
  }

  cache.conn = await cache.promise
  return cache.conn
}

export default connectDB
