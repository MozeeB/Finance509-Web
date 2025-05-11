"use client";

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Simple response type for auth operations
type AuthResponse = {
  success: boolean;
  error?: string;
  user?: any;
};

/**
 * Simple auth service for Finance509
 * Focused on core auth functions without redirects
 */

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<AuthResponse> {
  try {
    const supabase = createClientComponentClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      throw error;
    }
    
    return { 
      success: true,
      user: data.user 
    };
  } catch (error: any) {
    console.error('Sign in error:', error.message);
    return { 
      success: false, 
      error: error.message || 'Failed to sign in' 
    };
  }
}

/**
 * Sign up with email and password
 */
export async function signUp(email: string, password: string): Promise<AuthResponse> {
  try {
    const supabase = createClientComponentClient();
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    
    if (error) {
      throw error;
    }
    
    return { 
      success: true,
      user: data.user 
    };
  } catch (error: any) {
    console.error('Sign up error:', error.message);
    return { 
      success: false, 
      error: error.message || 'Failed to sign up' 
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<AuthResponse> {
  try {
    const supabase = createClientComponentClient();
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw error;
    }
    
    // Clear any local storage or cookies that might be causing issues
    if (typeof window !== 'undefined') {
      // Force clear any problematic items
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('sb-refresh-token');
      
      // Clear any cookies
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        if (name.includes('sb-') || name.includes('supabase')) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
        }
      });
    }
    
    // Force a page reload to clear any in-memory state
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.href = '/';
      }, 300);
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Sign out error:', error.message);
    return { 
      success: false, 
      error: error.message || 'Failed to sign out' 
    };
  }
}

/**
 * Check if the user is authenticated
 */
export async function checkAuth(): Promise<{ isAuthenticated: boolean; user?: any }> {
  try {
    const supabase = createClientComponentClient();
    
    const { data } = await supabase.auth.getSession();
    const hasSession = !!data.session;
    
    return { 
      isAuthenticated: hasSession,
      user: data.session?.user 
    };
  } catch (error) {
    console.error('Auth check error:', error);
    return { isAuthenticated: false };
  }
}

/**
 * Get the current user if authenticated
 */
export async function getCurrentUser(): Promise<{
  success: boolean;
  user?: any;
  error?: string;
}> {
  try {
    const supabase = createClientComponentClient();
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, user: data.user };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Failed to get user' 
    };
  }
}
