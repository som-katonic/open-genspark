import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const hasSheetCookie = request.cookies.has('googlesheet_user_id');
  const hasDocCookie = request.cookies.has('googledoc_user_id');
  const isAuthenticated = hasSheetCookie && hasDocCookie;

  const publicPaths = ['/signin', '/api/connection/google-sheet', '/api/connection/google-docs'];
  const isPublicPath = publicPaths.some(publicPath => path.startsWith(publicPath));

  if (!isAuthenticated && !isPublicPath) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  if (isAuthenticated && path === '/signin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 