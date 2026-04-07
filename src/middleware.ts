import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = request.cookies.get('promanager_session')?.value

  // FAST BYPASS: Skip security for static files, fonts, and images
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('/static/') ||
    pathname.includes('/favicon.ico') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.js')
  ) {
    return NextResponse.next()
  }

  const isLoginPage = pathname.startsWith('/login')
  const isAuthCallback = pathname.startsWith('/auth/callback')

  // Not logged in -> Redirect to login
  if (!session && !isLoginPage && !isAuthCallback) {
    const url = new URL('/login', request.url)
    return NextResponse.redirect(url)
  }

  // Logged in -> redirect from login to home
  if (session && isLoginPage) {
    const url = new URL('/', request.url)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
