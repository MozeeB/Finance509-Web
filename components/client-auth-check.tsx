"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from "next/link";

/**
 * Client-side authentication check component
 * Use this in protected pages instead of relying on middleware
 */
export function ClientAuthCheck({ 
  children,
  fallback
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    let isMounted = true;
    
    async function checkAuth() {
      try {
        const supabase = createClientComponentClient();
        const { data } = await supabase.auth.getSession();
        
        if (isMounted) {
          if (data.session) {
            // User is authenticated, show the protected content
            setIsAuthenticated(true);
          } else {
            // Not authenticated, stay on the page but show fallback content
            console.log('User not authenticated');
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    
    checkAuth();
    
    // Cleanup function to prevent state updates after unmounting
    return () => {
      isMounted = false;
    };
  }, []);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="mint-card p-6 rounded-lg shadow-lg">
          <p className="text-center">Loading...</p>
        </div>
      </div>
    );
  }
  
  // If authenticated, show the protected content
  if (isAuthenticated) {
    return <>{children}</>;
  }
  
  // If not authenticated and fallback is provided, show it
  if (fallback) {
    return <>{fallback}</>;
  }
  
  // Default fallback - sign in prompt
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="mint-card p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4 text-center">Authentication Required</h2>
        <p className="text-center mb-6">Please sign in to access this page.</p>
        <div className="flex justify-center">
          <Link 
            href="/sign-in" 
            className="mint-button py-2 px-4 rounded-md text-center"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
