import { forgotPasswordAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";
import { KeyRound, Mail } from "lucide-react";

export default async function ForgotPassword(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mint-card p-8 shadow-lg rounded-xl">
        <div className="flex items-center justify-center mb-6">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
        </div>
        
        <h1 className="text-2xl font-semibold text-center mb-2">Reset Password</h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          Enter your email to receive a password reset link
        </p>
        
        <form className="flex-1 flex flex-col">
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                </div>
                <Input 
                  name="email" 
                  placeholder="you@example.com" 
                  className="pl-10 mint-input" 
                  required 
                />
              </div>
            </div>
            
            <SubmitButton 
              formAction={forgotPasswordAction}
              className="mint-button w-full mt-2"
            >
              Send Reset Link
            </SubmitButton>
            
            <FormMessage message={searchParams} />
            
            <p className="text-sm text-center text-muted-foreground mt-4">
              Remember your password?{" "}
              <Link className="text-primary hover:text-primary/80 font-medium" href="/sign-in">
                Back to Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
      <SmtpMessage />
    </div>
  );
}
