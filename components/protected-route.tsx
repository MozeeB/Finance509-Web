"use client";

import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  
  // Redirect to login if not authenticated and not loading
  useEffect(() => {
    if (!isLoading && !user) {
      // Get the current path to use as return URL
      const returnUrl = encodeURIComponent(window.location.pathname);
      router.push(`/sign-in?returnUrl=${returnUrl}`);
    }
  }, [user, isLoading, router]);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8 items-center justify-center min-h-[300px]">
        <div className="mint-card p-8 text-center">
          <div className="animate-pulse mb-4">
            <div className="h-8 w-8 rounded-full bg-primary/20 mx-auto"></div>
          </div>
          <p className="text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }
  
  // Show authentication required message
  if (!user) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8 items-center justify-center min-h-[300px]">
        <div className="mint-card p-8 text-center">
          <p className="text-lg font-medium mb-4">Authentication Required</p>
          <p className="text-muted-foreground mb-6">Please sign in to access this page</p>
          <Link 
            href={`/sign-in?returnUrl=${encodeURIComponent(window.location.pathname)}`} 
            className="mint-button inline-flex px-4 py-2 rounded-md"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }
  
  // User is authenticated, render children
  return <>{children}</>;
}
