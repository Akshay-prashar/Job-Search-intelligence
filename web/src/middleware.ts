import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'supersecretjwttokendesignchangeinproduction'
)

const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/resume',
  '/jobs',
  '/saved',
  '/applications',
  '/companies',
  '/interviews',
  '/skills',
  '/settings',
]

const authRoutes = ['/login', '/register']
const adminRoutes = ['/admin']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('token')?.value

  // Check if user is authenticated
  let isAuthenticated = false
  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET)
      isAuthenticated = true
    } catch {
      isAuthenticated = false
    }
  }

  // Redirect authenticated users away from auth pages
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // Protect dashboard routes
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // Protect admin routes
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    // For now, just check authentication. Role checks happen in API routes.
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/resume/:path*',
    '/jobs/:path*',
    '/saved/:path*',
    '/applications/:path*',
    '/companies/:path*',
    '/interviews/:path*',
    '/skills/:path*',
    '/settings/:path*',
    '/admin/:path*',
    '/login',
    '/register',
  ],
}
