import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/session'

// Routes that require authentication
const PROTECTED_PATHS = [
  '/dashboard',
  '/products',
  '/inventory',
  '/batches',
  '/purchases',
  '/sales',
  '/customers',
  '/suppliers',
  '/expenses',
  '/returns',
  '/reports',
  '/stock-movements',
  '/users',
  '/settings',
]

// Public routes (no auth needed)
const PUBLIC_PATHS = ['/login', '/api/auth']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Check if this is a protected path
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  // Verify session
  const token = request.cookies.get('nfashion_session')?.value
  const session = await decrypt(token)

  if (!session || new Date(session.expiresAt) < new Date()) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Enforce admin-only access for user management
  if (pathname.startsWith('/users') && session.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico, public files
     * - api routes not requiring auth
     */
    '/((?!_next/static|_next/image|favicon.ico|public|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)',
  ],
}
