"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AddTransactionDebug() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    amount: 0,
    type: "Expense",
    accountId: "",
    category: "Miscellaneous",
    date: new Date().toISOString().split('T')[0]
  });
  const [message, setMessage] = useState<{text: string, type: "success" | "error"} | null>(null);
  
  const supabase = createClientComponentClient();
  
  // Load accounts
  useEffect(() => {
    async function loadAccounts() {
      try {
        setIsLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setMessage({
            text: "You must be logged in to add transactions",
            type: "error"
          });
          return;
        }
        
        // Fetch accounts for this user
        const { data, error } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', user.id);
          
        if (error) {
          console.error("Error loading accounts:", error);
          setMessage({
            text: "Failed to load accounts: " + error.message,
            type: "error"
          });
          return;
        }
        
        if (data && data.length > 0) {
          setAccounts(data);
          setFormData(prev => ({
            ...prev,
            accountId: data[0].id
          }));
        } else {
          setMessage({
            text: "No accounts found. Please create an account first.",
            type: "error"
          });
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setMessage({
          text: "An unexpected error occurred",
          type: "error"
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadAccounts();
  }, [supabase]);
  
  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "amount" ? parseFloat(value) : value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    
    try {
      // Format amount based on transaction type
      const amount = formData.type === "Expense" 
        ? -Math.abs(formData.amount) 
        : Math.abs(formData.amount);
      
      // Prepare transaction data
      const transactionData = {
        description: formData.description,
        total: amount,
        type: formData.type,
        category: formData.category,
        date: formData.date,
        account_id: formData.accountId
      };
      
      console.log("Submitting transaction:", transactionData);
      
      // Insert transaction
      const { error } = await supabase
        .from('transactions')
        .insert(transactionData);
        
      if (error) {
        console.error("Error inserting transaction:", error);
        setMessage({
          text: `Failed to add transaction: ${error.message}`,
          type: "error"
        });
        return;
      }
      
      // Update account balance
      const { data: account } = await supabase
        .from('accounts')
        .select('value')
        .eq('id', formData.accountId)
        .single();
        
      if (account) {
        const newBalance = (account.value || 0) + amount;
        
        await supabase
          .from('accounts')
          .update({ value: newBalance })
          .eq('id', formData.accountId);
      }
      
      setMessage({
        text: "Transaction added successfully!",
        type: "success"
      });
      
      // Reset form or redirect
      setTimeout(() => {
        router.push('/protected/transactions');
      }, 1500);
      
    } catch (err) {
      console.error("Unexpected error during submission:", err);
      setMessage({
        text: "An unexpected error occurred while adding the transaction",
        type: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="p-4 md:p-8">
      {/* Status message */}
      {message && (
        <div className={`p-4 mb-4 rounded-md ${
          message.type === "error" 
            ? "bg-red-50 border border-red-200 text-red-700" 
            : "bg-green-50 border border-green-200 text-green-700"
        }`}>
          {message.text}
        </div>
      )}
      
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Link href="/protected/transactions" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <CardTitle>Add Transaction (Debug Version)</CardTitle>
          </div>
          <CardDescription>
            Simplified form for debugging transaction issues
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading accounts...</div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-4">
              <p className="mb-4">No accounts found. Please create an account first.</p>
              <Button 
                onClick={() => router.push('/protected/accounts/add')}
                className="mint-button"
              >
                Create Account
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Account</label>
                <select 
                  name="accountId"
                  value={formData.accountId}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.value || 0})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Input
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="What was this transaction for?"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="Expense">Expense</option>
                    <option value="Income">Income</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Amount</label>
                  <Input
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="Food">Food</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Housing">Housing</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <Input
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/protected/transactions')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="mint-button"
                >
                  {isSubmitting ? "Saving..." : "Save Transaction"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
