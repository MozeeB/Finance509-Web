"use client";

import Link from "next/link";

/**
 * Simple component to show a dashboard link for users
 * No auto-redirects, no auto-checks, no refresh loops
 */
export function RootAuthCheck() {
  // This component no longer performs any automatic checks
  // It will only show the dashboard link when explicitly rendered
  
  // Simple dashboard link without any checks
  return (
    <div className="fixed bottom-4 right-4 z-50 mint-card p-4 shadow-lg rounded-lg hover:shadow-xl transition-shadow">
      <Link 
        href="/dashboard" 
        className="mint-button text-sm py-1 px-3 block text-center"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
