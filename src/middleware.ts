import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';

export async function middleware(request: NextRequest) {
  const supabase = createMiddlewareClient<Database>({ req: request, res: NextResponse.next() });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // Define protected routes
  const protectedRoutes = ['/dashboard']; // Add any other routes that need protection

  // If user is not logged in and trying to access a protected route, redirect to login
  if (!session && protectedRoutes.some(route => pathname.startsWith(route))) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectedFrom', pathname); // Optional: pass original path
    return NextResponse.redirect(url);
  }

  // If user is logged in and trying to access login/signup, redirect to dashboard
  if (session && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }
  
  // Refresh session
  await supabase.auth.getSession();

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/callback).*)',
  ],
};
