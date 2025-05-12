"use client";

import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import Link from "next/link";
import { LockKeyhole, Mail, UserPlus, CheckCircle } from "lucide-react";
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function SignUp() {
  // Initialize Supabase client
  const supabase = createClientComponentClient();
  const router = useRouter();
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Handle sign up
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    
    // Validate password length
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }
    
    try {
      // Sign up with email and password
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        throw error;
      }
      
      // Show success state
      setIsSuccess(true);
    } catch (error: any) {
      console.error("Sign-up error:", error);
      setErrorMessage(error.message || "Failed to sign up");
      setIsLoading(false);
    }
  }

  // Success screen
  if (isSuccess) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="mint-card p-8 shadow-lg rounded-xl text-center">
          <div className="mb-6 flex justify-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold mb-4">Sign up successful!</h2>
          <p className="text-muted-foreground mb-6">
            Please check your email for a confirmation link. Once confirmed, you can sign in to your account.
          </p>
          <Button 
            onClick={() => router.push('/sign-in')}
            className="mint-button py-2 px-6"
          >
            Go to Sign In
          </Button>
        </div>
      </div>
    );
  }
  
  // Sign up form
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mint-card p-8 shadow-lg rounded-xl">
        <div className="flex items-center justify-center mb-6">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
        </div>
        
        <h1 className="text-2xl font-semibold text-center mb-2">Create Account</h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          Start tracking your finances today
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
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-muted-foreground">
                  <LockKeyhole className="h-4 w-4" />
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password (min. 6 characters)"
                  className="pl-10 mint-input"
                  minLength={6}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Password must be at least 6 characters</p>
            </div>
            
            <Button 
              type="submit"
              className="mint-button w-full mt-2"
              disabled={isLoading}
            >
              {isLoading ? "Signing up..." : "Create Account"}
            </Button>
            
            {/* Display error message */}
            {errorMessage && (
              <div className="text-sm text-destructive border-l-2 border-destructive px-4 py-2">
                {errorMessage}
              </div>
            )}
            
            <p className="text-sm text-center text-muted-foreground mt-4">
              Already have an account?{" "}
              <Link className="text-primary hover:text-primary/80 font-medium" href="/sign-in">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
