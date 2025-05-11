import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { type NextRequest, NextResponse } from "next/server";

/**
 * Minimal middleware that only refreshes the Supabase session
 * No authentication checks or redirects to prevent loops
 */
export const updateSession = async (request: NextRequest) => {
  // Create a response object
  const response = NextResponse.next();

  // Skip middleware for assets and API routes
  if (
    request.nextUrl.pathname.includes('/_next/') ||
    request.nextUrl.pathname.includes('/api/') ||
    request.nextUrl.pathname.match(/\.(ico|svg|png|jpg|jpeg|css|js)$/)
  ) {
    return response;
  }

  try {
    // Create a Supabase client for the middleware
    const supabase = createMiddlewareClient({ req: request, res: response });
    
    // Just refresh the session cookies without any redirects
    await supabase.auth.getSession();
    
    // Return the response with updated cookies
    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    return response;
  }
};
