import Link from "next/link";
import { BarChart3, CreditCard, DollarSign, PieChart, TrendingUp, Wallet } from "lucide-react";

export default function Header() {
  return (
    <div className="w-full bg-gradient-to-b from-primary/5 to-transparent py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          {/* Hero content */}
          <div className="flex-1 space-y-6">
            <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
              Take control of your finances
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Smart Finance Tracker for <span className="text-primary">Better Decisions</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-xl">
              Track expenses, manage budgets, plan debt repayment, and build your emergency fund - all in one beautiful dashboard.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link 
                href="/sign-in" 
                className="mint-button py-3 px-6 text-center rounded-lg"
              >
                Sign In
              </Link>
              <Link 
                href="/sign-up" 
                className="mint-button-outline py-3 px-6 text-center rounded-lg"
              >
                Create Account
              </Link>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
              <DollarSign className="h-4 w-4" />
              <span>Secure, private, and free to use</span>
            </div>
          </div>
          
          {/* Hero image/graphic */}
          <div className="flex-1 relative">
            <div className="mint-card p-6 rounded-xl shadow-xl relative z-10 max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold">Financial Overview</h3>
                <span className="text-primary font-medium">May 2025</span>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Wallet className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">Total Balance</span>
                  </div>
                  <span className="font-bold">$12,580.45</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-500/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                    <span className="font-medium">Income</span>
                  </div>
                  <span className="font-bold text-green-500">+$3,240.00</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-red-500/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-red-500/20 flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-red-500" />
                    </div>
                    <span className="font-medium">Expenses</span>
                  </div>
                  <span className="font-bold text-red-500">-$1,890.30</span>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Budget Status</span>
                  </div>
                  <span className="text-sm text-muted-foreground">75% on track</span>
                </div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-primary/10 z-0"></div>
            <div className="absolute -bottom-8 -left-8 h-16 w-16 rounded-full bg-primary/5 z-0"></div>
          </div>
        </div>
        
        {/* Feature highlights */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="mint-card p-6 rounded-xl">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Budget Management</h3>
            <p className="text-muted-foreground">Create custom budgets for different categories and track your spending in real-time.</p>
          </div>
          
          <div className="mint-card p-6 rounded-xl">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Debt Repayment</h3>
            <p className="text-muted-foreground">Plan your debt repayment strategy with Avalanche or Snowball methods to become debt-free faster.</p>
          </div>
          
          <div className="mint-card p-6 rounded-xl">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <PieChart className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Emergency Fund</h3>
            <p className="text-muted-foreground">Build your financial safety net with customizable emergency fund goals and progress tracking.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
