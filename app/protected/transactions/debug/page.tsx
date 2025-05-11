import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function TransactionDebugPage() {
  const supabase = await createClient();
  
  // Get the user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }
  
  // Fetch accounts for this user
  const { data: accounts } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', user.id);
    
  // Redirect to the debug version of the add transaction page
  // Pass the accounts as a URL parameter
  const accountsParam = encodeURIComponent(JSON.stringify(accounts || []));
  redirect(`/protected/transactions/add/debug?accounts=${accountsParam}`);
}
