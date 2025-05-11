import Hero from "@/components/hero";
import { ArrowRight, CheckCircle2, Shield } from "lucide-react";
import Link from "next/link";
import { RootAuthCheck } from "@/components/root-auth-check";

export default function Home() {
  return (
    <>
      {/* Client component to handle auth redirects */}
      <RootAuthCheck />
      <Hero />
      
      {/* Testimonials section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Why Users Love Our Finance Tracker</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="mint-card p-6 rounded-xl">
              <div className="flex flex-col h-full">
                <div className="mb-4 text-primary">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.9999 2L15.0938 8.2918L22 9.27319L16.9999 14.1369L18.1876 21.0106L11.9999 17.7918L5.81215 21.0106L6.99988 14.1369L1.99976 9.27319L8.90592 8.2918L11.9999 2Z" fill="currentColor"/>
                  </svg>
                </div>
                <p className="text-muted-foreground flex-grow">"This app has completely transformed how I manage my money. The budget tracking is intuitive and the debt repayment tools helped me create a solid plan."</p>
                <div className="mt-4 pt-4 border-t">
                  <p className="font-medium">Sarah K.</p>
                  <p className="text-sm text-muted-foreground">Financial Analyst</p>
                </div>
              </div>
            </div>
            
            <div className="mint-card p-6 rounded-xl">
              <div className="flex flex-col h-full">
                <div className="mb-4 text-primary">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.9999 2L15.0938 8.2918L22 9.27319L16.9999 14.1369L18.1876 21.0106L11.9999 17.7918L5.81215 21.0106L6.99988 14.1369L1.99976 9.27319L8.90592 8.2918L11.9999 2Z" fill="currentColor"/>
                  </svg>
                </div>
                <p className="text-muted-foreground flex-grow">"I've tried many finance apps, but this one stands out with its clean design and comprehensive features. The emergency fund tracker keeps me motivated."</p>
                <div className="mt-4 pt-4 border-t">
                  <p className="font-medium">Michael T.</p>
                  <p className="text-sm text-muted-foreground">Software Developer</p>
                </div>
              </div>
            </div>
            
            <div className="mint-card p-6 rounded-xl">
              <div className="flex flex-col h-full">
                <div className="mb-4 text-primary">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.9999 2L15.0938 8.2918L22 9.27319L16.9999 14.1369L18.1876 21.0106L11.9999 17.7918L5.81215 21.0106L6.99988 14.1369L1.99976 9.27319L8.90592 8.2918L11.9999 2Z" fill="currentColor"/>
                  </svg>
                </div>
                <p className="text-muted-foreground flex-grow">"As someone new to budgeting, this app made it easy to get started. The mint theme is beautiful, and the dark mode is perfect for late-night planning."</p>
                <div className="mt-4 pt-4 border-t">
                  <p className="font-medium">Jessica L.</p>
                  <p className="text-sm text-muted-foreground">Graphic Designer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto mint-card p-8 md:p-12 rounded-xl text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-6">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Take Control of Your Finances?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">Join thousands of users who have transformed their financial habits with our easy-to-use tools and beautiful interface.</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/sign-up" 
              className="mint-button py-3 px-6 text-center rounded-lg inline-flex items-center justify-center gap-2"
            >
              Get Started Now
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link 
              href="/sign-in" 
              className="mint-button-outline py-3 px-6 text-center rounded-lg"
            >
              Sign In
            </Link>
          </div>
          
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>Free to use</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>Secure & private</span>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-muted-foreground">&copy; 2025 Finance Tracker. All rights reserved.</p>
          </div>
          <div className="flex gap-6">
            <Link href="/sign-in" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign In</Link>
            <Link href="/sign-up" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
