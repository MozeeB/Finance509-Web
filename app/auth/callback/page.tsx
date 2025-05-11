'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function AuthCallback() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Get the auth code from the URL
    const handleRedirectCallback = async () => {
      const { searchParams } = new URL(window.location.href)
      const code = searchParams.get('code')
      
      if (code) {
        try {
          // Exchange the code for a session
          await supabase.auth.exchangeCodeForSession(code)
          
          // Redirect to the protected area after successful authentication
          router.push('/dashboard')
        } catch (error) {
          console.error('Error exchanging code for session:', error)
          router.push('/sign-in?error=Authentication failed. Please try again.')
        }
      } else {
        // No code found, redirect to sign-in
        router.push('/sign-in')
      }
    }

    handleRedirectCallback()
  }, [router, supabase])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f9fafb] dark:bg-[hsl(var(--background))]">
      <div className="mint-card p-8 text-center">
        <div className="animate-pulse mb-4">
          <div className="h-8 w-8 rounded-full bg-primary/20 mx-auto"></div>
        </div>
        <p className="text-muted-foreground">Verifying your authentication...</p>
      </div>
    </div>
  )
}
