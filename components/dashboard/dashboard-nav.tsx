"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  CreditCard, 
  DollarSign, 
  PiggyBank, 
  BarChart3, 
  ArrowUpDown,
  Settings,
  Home,
  Wallet,
  LineChart,
  Shield
} from "lucide-react";

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <Home className="h-5 w-5" />
  },
  {
    title: "Accounts",
    href: "/dashboard/accounts",
    icon: <Wallet className="h-5 w-5" />
  },
  {
    title: "Transactions",
    href: "/dashboard/transactions",
    icon: <ArrowUpDown className="h-5 w-5" />
  },
  {
    title: "Budgets",
    href: "/dashboard/budgets",
    icon: <DollarSign className="h-5 w-5" />
  },
  {
    title: "Debts",
    href: "/dashboard/debts",
    icon: <LineChart className="h-5 w-5" />
  },
  {
    title: "Emergency Fund",
    href: "/dashboard/emergency-fund",
    icon: <Shield className="h-5 w-5" />
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: <Settings className="h-5 w-5" />
  }
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="grid items-start gap-2 p-2">
      {navItems.map((item, index) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={index}
            href={item.href}
            className={isActive ? "mint-nav-item mint-nav-item-active" : "mint-nav-item"}
          >
            <span className={`${isActive ? "text-primary" : "text-muted-foreground"}`}>
              {item.icon}
            </span>
            <span className="font-medium">{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
