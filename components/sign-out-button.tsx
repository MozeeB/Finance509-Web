"use client";

import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { supabase } from "@/utils/supabase/client";
import { useState } from "react";

export function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignOut() {
    setIsLoading(true);
    try {
      // Sign out directly with Supabase
      await supabase.auth.signOut();
      
      // Let the middleware handle the redirect
      window.location.href = "/sign-in";
    } catch (error) {
      console.error("Error signing out:", error);
      setIsLoading(false);
    }
  }

  return (
    <Button 
      onClick={handleSignOut}
      disabled={isLoading}
      variant="outline" 
      size="sm" 
      className="w-full mint-button-outline flex items-center justify-center gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Signing out...</span>
        </>
      ) : (
        <>
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </>
      )}
    </Button>
  );
}
