import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('admin_session')?.value;
  const { pathname } = request.nextUrl;

  // Exclude Next.js internal files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // If session is missing and user is not on login page, redirect to login
  if (!session && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If session exists and user is trying to access login, redirect to dashboard home
  if (session && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Support both 'middleware' and 'proxy' exports to ensure compatibility across Next.js versions
export { middleware as proxy };
export default middleware;

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
