"use client";

import { Session, User } from '@supabase/supabase-js';
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

// Import the client directly to avoid cookie parsing issues
import { createClient } from "../utils/supabase/client";

// Create a context for authentication
type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
  refreshSession: async () => {},
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component that wraps the app and makes auth available
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  // Create the Supabase client using our custom client
  const supabase = createClient();

  // Sign out function
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    router.push("/sign-in");
  };
  
  // Function to refresh the session
  const refreshSession = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user || null);
    } catch (error) {
      console.error("Error refreshing session:", error);
    }
  };

  useEffect(() => {
    // Check if we have a session
    const getSession = async () => {
      try {
        console.log('Checking auth session...');
        
        // Get the session using the direct client
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          console.log('Session found, user is authenticated');
          setSession(data.session);
          setUser(data.session.user);
        } else {
          console.log('No session found');
          setSession(null);
          setUser(null);
        }
      } catch (error) {
        console.error("Error getting session:", error);
        setSession(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Call getSession immediately
    getSession();

    // Set up listener for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        console.log("Auth state changed:", event);
        
        if (session?.user) {
          console.log('User authenticated via state change:', session.user.id);
          setSession(session);
          setUser(session.user);
          
          // If on sign-in page, redirect to protected area
          const currentPath = window.location.pathname;
          if (currentPath === '/' || currentPath.startsWith('/sign-in') || currentPath.startsWith('/sign-up')) {
            console.log('Redirecting authenticated user to protected area');
            window.location.href = '/dashboard';
            return;
          }
        } else {
          console.log('No user in auth state change');
          setSession(null);
          setUser(null);
          
          // If on protected page with no session, redirect to sign-in
          const currentPath = window.location.pathname;
          if (currentPath.startsWith('/dashboard') && event === 'SIGNED_OUT') {
            console.log('User signed out from protected area, redirecting to sign-in');
            window.location.href = '/sign-in';
            return;
          }
        }
        
        setIsLoading(false);
        
        // Force a router refresh to update server components
        router.refresh();
      }
    );

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  // Value to be provided by the context
  const value = {
    user,
    session,
    isLoading,
    signOut,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
