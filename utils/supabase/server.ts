import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Create a singleton instance to ensure we're using the same client throughout the app
let supabaseServerInstance: ReturnType<typeof createServerClient> | null = null;

export const createClient = async () => {
  const cookieStore = await cookies();
  
  // If we already have an instance, return it
  if (typeof window === 'undefined' && supabaseServerInstance) {
    return supabaseServerInstance;
  }

  // Create a new instance if one doesn't exist
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
            console.log('Cookie set error (can be ignored if using middleware):', error);
          }
        },
      },
    },
  );
  
  // Store the instance if we're on the server
  if (typeof window === 'undefined') {
    supabaseServerInstance = client;
  }
  
  return client;
};
