import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function AddTransactionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch accounts for the dropdown
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, name, type')
    .eq('user_id', user.id);

  // Encode accounts data to pass via URL
  const encodedAccounts = encodeURIComponent(JSON.stringify(accounts || []));
  
  // Redirect to the same page but with accounts data in URL
  const url = new URL(
    `/protected/transactions/add?accounts=${encodedAccounts}`,
    process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:3000"
  );

  return <>{children}</>;
}
