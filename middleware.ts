import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Extremely minimal middleware that just passes through all requests
 * No authentication checks, no redirects, no Supabase calls
 */
export function middleware(request: NextRequest) {
  // Just pass through all requests
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
