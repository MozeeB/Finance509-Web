import { Toaster } from "@/components/ui/toaster";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import Link from "next/link";
import "./globals.css";
import HeaderAuth from "@/components/header-auth";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Finance Tracker | Manage Your Money",
  description: "A modern finance tracker to manage your budgets, debts, and emergency fund",
};

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} font-sans`} suppressHydrationWarning>
      <body className="bg-background text-foreground min-h-screen">
        <ThemeProvider>
          <AuthProvider>
            <main className="min-h-screen flex flex-col" suppressHydrationWarning>
              {children}
              <Toaster />
            </main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
