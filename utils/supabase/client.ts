import { createClient as createSupabaseClient, AuthChangeEvent, Session } from '@supabase/supabase-js';

// Use environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a singleton instance
let clientInstance: any = null;

// Storage source for session data
const getStorageProvider = () => {
  if (typeof window === 'undefined') return undefined;
  return localStorage;
};

/**
 * Creates or returns a Supabase client instance
 * Uses a singleton pattern to ensure only one client is created
 */
export const createClient = () => {
  if (clientInstance) return clientInstance;
  
  // Create the client with auth configuration
  const client = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'implicit',
      storage: getStorageProvider()
    },
    global: {
      headers: {
        'x-client-info': 'finance509-app'
      }
    }
    // Debug mode is now configured through environment variables
  });
  
  // Add auth change listener to log events only (no auto-refresh)
  client.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
    console.log(`Auth state changed: ${event}`);
    // We're no longer auto-refreshing the page on auth state changes
    // This avoids the refresh loop issues
  });
  
  clientInstance = client;
  
  return clientInstance;
};

// Export a browser-safe instance
export const supabase = createClient();
