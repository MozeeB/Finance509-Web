"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { CreditCard, LockKeyhole, Mail, CheckCircle } from "lucide-react";
import { useRouter } from 'next/navigation';
import { FormEvent, useState, useEffect } from 'react';
import { signIn } from "@/utils/auth-service";

export default function SignIn() {
  const router = useRouter();
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [returnUrl, setReturnUrl] = useState("/protected");
  
  // Get return URL from query parameters on component mount
  useEffect(() => {
    // Extract return URL from query params
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const returnUrlParam = params.get('returnUrl');
      if (returnUrlParam) {
        // Replace any protected paths with dashboard
        const updatedUrl = returnUrlParam.replace('/protected', '/dashboard');
        setReturnUrl(updatedUrl);
      } else {
        // Default to dashboard
        setReturnUrl('/dashboard');
      }
    }
  }, []);
  
  // Handle sign in
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    
    try {
      // Use our auth service to sign in
      const result = await signIn(email, password);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      // Show success state instead of auto-redirecting
      setIsSuccess(true);
    } catch (error: any) {
      console.error("Sign-in error:", error);
      setErrorMessage(error.message || "Failed to sign in");
      setIsLoading(false);
    }
  }
  
  // Handle manual navigation to dashboard
  function navigateToDashboard() {
    // Navigate to the dashboard without relying on protected routes
    // Use a direct navigation to avoid any middleware issues
    window.location.href = '/dashboard';
  }

  // Success screen
  if (isSuccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="mint-card p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-center mb-2">Sign In Successful!</h1>
          <p className="text-center text-gray-600 mb-6">
            You have successfully signed in to your account.
          </p>
          <button
            onClick={navigateToDashboard}
            className="mint-button w-full py-2 rounded-md"
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Regular sign in form
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mint-card p-8 shadow-lg rounded-xl">
        <div className="flex items-center justify-center mb-6">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
        </div>
        
        <h1 className="text-2xl font-semibold text-center mb-2">Welcome Back</h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          Sign in to access your financial dashboard
        </p>
        
        <form className="flex-1 flex flex-col" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                </div>
                <Input 
                  id="email"
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" 
                  className="pl-10 mint-input" 
                  required 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Link
                  className="text-xs text-primary hover:text-primary/80 transition-colors"
                  href="/forgot-password"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute left-3 top-3 text-muted-foreground">
                  <LockKeyhole className="h-4 w-4" />
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="pl-10 mint-input"
                  required
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="remember" className="text-sm text-muted-foreground">
                Keep me signed in for 30 days
              </Label>
            </div>
            
            <Button 
              type="submit"
              className="mint-button w-full mt-2"
              disabled={isLoading}
            >
              {isLoading ? "Signing In..." : "Sign in"}
            </Button>
            
            {/* Display error message */}
            {errorMessage && (
              <div className="text-sm text-destructive border-l-2 border-destructive px-4 py-2">
                {errorMessage}
              </div>
            )}
            
            <p className="text-sm text-center text-muted-foreground mt-4">
              Don't have an account?{" "}
              <Link className="text-primary hover:text-primary/80 font-medium" href="/sign-up">
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
