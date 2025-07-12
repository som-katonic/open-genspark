import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // Check if user is authenticated (has the cookie)
  const isAuthenticated = request.cookies.has('zeroemail_user_id');

  // Public paths that don't require authentication
  const publicPaths = ['/signin', '/api/connecting-email'];
  const isPublicPath = publicPaths.some(publicPath => path.startsWith(publicPath));

  // If user is not authenticated and trying to access a protected route
  if (!isAuthenticated && !isPublicPath) {
    // Redirect to signin page
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  // If user is authenticated and trying to access signin page
  if (isAuthenticated && path === '/signin') {
    // Redirect to home page
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