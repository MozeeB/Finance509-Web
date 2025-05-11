import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, User, Bell } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get user profile info
  const { data: profile } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single();

  const userName = profile?.full_name || user.email?.split('@')[0] || 'User';

  return (
    <div className="flex min-h-screen flex-col bg-[#f9fafb]">
      {/* Top header */}
      <header className="sticky top-0 z-40 border-b bg-white">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Link href="/protected" className="flex items-center">
              <span className="text-xl font-bold text-primary">Finance509</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <button className="rounded-full p-2 text-muted-foreground hover:bg-muted">
              <Bell className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 rounded-full bg-secondary px-2 py-1.5">
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
        <aside className="fixed top-16 z-30 hidden h-[calc(100vh-4rem)] w-full shrink-0 overflow-y-auto border-r md:sticky md:block">
          <div className="h-full py-6 pl-4 pr-6">
            <div className="mb-6 rounded-xl bg-primary/5 p-4">
              <div className="mb-2 text-xs font-medium text-muted-foreground">NET WORTH</div>
              <div className="text-2xl font-bold">$117,500</div>
              <div className="mt-1 text-xs text-primary">+$2,500 this month</div>
            </div>
            <DashboardNav />
            <div className="mt-6 flex justify-center">
              <Link 
                href="/sign-out"
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex w-full flex-col">
          <div className="rounded-xl bg-white shadow-sm">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
