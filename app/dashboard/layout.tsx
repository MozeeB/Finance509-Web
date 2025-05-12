"use client";

import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import Link from "next/link";
import { User, Bell, BarChart3 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/sign-out-button";
import { Suspense, useState, useEffect } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('User');
  const [netWorth, setNetWorth] = useState(0);
  const [monthlyChange, setMonthlyChange] = useState(0);

  // Get user data on component mount
  useEffect(() => {
    async function getUserProfile() {
      try {
        // Get current user session 
        const supabase = createClientComponentClient();
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        
        if (user?.email) {
          // Set user name from email
          setUserName(user.email.split('@')[0] || 'User');
          
          // Fetch accounts to calculate net worth
          const { data: accountsData } = await supabase
            .from('accounts')
            .select('*')
            .eq('user_id', user.id);
          
          // Fetch debts
          const { data: debtsData } = await supabase
            .from('debts')
            .select('*');
          // Note: No user_id filter as the column doesn't exist in the debts table
          
          // Calculate assets and liabilities
          const assets = (accountsData || []).filter(a => Number(a.value) > 0).reduce((sum, a) => sum + Number(a.value), 0);
          const liabilitiesFromAccounts = (accountsData || []).filter(a => Number(a.value) < 0).reduce((sum, a) => sum + Math.abs(Number(a.value)), 0);
          
          // Calculate total debt amount
          const debtAmount = (debtsData || []).reduce((sum, debt) => sum + Number(debt.amount || 0), 0);
          
          // Calculate total liabilities (negative accounts + debts)
          const totalLiabilities = liabilitiesFromAccounts + debtAmount;
          
          // Calculate net worth (assets - liabilities)
          const totalNetWorth = assets - totalLiabilities;
          
          setNetWorth(totalNetWorth);
          
          // Calculate monthly change (simplified version)
          // In a real app, you would compare with previous month's data
          const monthlyChangeValue = (accountsData || [])
            .filter(account => account.created_at && new Date(account.created_at).getMonth() === new Date().getMonth())
            .reduce((sum, account) => sum + Number(account.value), 0);
          
          setMonthlyChange(monthlyChangeValue);
        }
      } catch (error) {
        console.error('Error getting user profile:', error);
      } finally {
        // Always set loading to false even if there's an error
        setIsLoading(false);
      }
    }
    
    getUserProfile();
  }, []);
  
  // Show simple loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9fafb] dark:bg-[hsl(var(--background))]">
        <div className="mint-card p-8 text-center">
          <div className="animate-pulse mb-4">
            <div className="h-8 w-8 rounded-full bg-primary/20 mx-auto"></div>
          </div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Main dashboard layout for authenticated users
  return (
    <div className="flex min-h-screen flex-col bg-[#f9fafb] dark:bg-[hsl(var(--background))]">
      {/* Top header */}
        <header className="sticky top-0 z-40 border-b bg-white dark:bg-[hsl(var(--card))] transition-colors">
          <div className="container flex h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-2">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <span className="text-xl font-bold text-primary">Finance509</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <button className="mint-button-icon">
                <Bell className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2 rounded-full bg-secondary/50 px-2 py-1.5 hover:bg-secondary transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <User className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">{userName}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="container flex-1 items-start py-6 md:grid md:grid-cols-[240px_minmax(0,1fr)] md:gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10">
          {/* Sidebar */}
          <aside className="fixed top-16 z-30 hidden h-[calc(100vh-4rem)] w-full shrink-0 overflow-y-auto border-r dark:border-r-border md:sticky md:block transition-colors">
            <div className="h-full py-6 pl-4 pr-6">
              <div className="mb-6 mint-card bg-primary/5 dark:bg-primary/10 p-4 hover:border-primary/20 transition-all">
                <div className="mb-2 text-xs font-medium text-muted-foreground">NET WORTH</div>
                <div className="text-2xl font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(netWorth)}</div>
                <div className="mt-1 text-xs text-primary">
                  {monthlyChange >= 0 ? '+' : ''}
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(monthlyChange)} this month
                </div>
              </div>
              <DashboardNav />
              <div className="mt-6 flex justify-center">
                <SignOutButton />
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex w-full flex-col">
            <div className="mint-card mint-fade-in">
              <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
                {children}
              </Suspense>
            </div>
          </main>
        </div>
    </div>
  );
}
