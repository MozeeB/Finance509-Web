"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Save, LogOut } from "lucide-react";

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

const profileFormSchema = z.object({
  full_name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }).optional(),
  currency: z.string().min(1, { message: "Currency is required" }),
  dark_mode: z.boolean().default(false),
  notifications_enabled: z.boolean().default(true),
});

const securityFormSchema = z.object({
  current_password: z.string().min(1, { message: "Current password is required" }),
  new_password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirm_password: z.string().min(8, { message: "Password must be at least 8 characters" }),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [user, setUser] = useState<any>(null);
  const supabase = createClientComponentClient();
  
  // Initialize profile form
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: "",
      email: "",
      currency: "USD",
      dark_mode: false,
      notifications_enabled: true,
    },
  });
  
  // Initialize security form
  const securityForm = useForm<z.infer<typeof securityFormSchema>>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  // Fetch user profile data
  useEffect(() => {
    async function fetchUserProfile() {
      try {
        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error('Authentication error:', authError?.message || 'User not found');
          toast({
            title: "Authentication Required",
            description: "Please sign in to access settings",
            variant: "destructive"
          });
          router.push('/sign-in?returnUrl=/protected/settings');
          return;
        }
        
        setUser(user);
        
        if (user) {
          // Get user profile from users table
          const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (!error && profile) {
            profileForm.reset({
              full_name: profile.full_name || "",
              email: user.email || "",
              currency: profile.currency || "USD",
              dark_mode: profile.dark_mode || false,
              notifications_enabled: profile.notifications_enabled !== false, // default to true
            });
          } else {
            // If no profile exists, use auth data
            profileForm.reset({
              full_name: user.user_metadata?.full_name || "",
              email: user.email || "",
              currency: "USD",
              dark_mode: false,
              notifications_enabled: true,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        toast({
          title: "Error",
          description: "Failed to load user profile.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingProfile(false);
      }
    }
    
    fetchUserProfile();
  }, [supabase, profileForm, toast, router]);

  async function onSubmitProfile(values: z.infer<typeof profileFormSchema>) {
    setIsSubmittingProfile(true);
    
    try {
      // Make sure user is authenticated
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to update your profile",
          variant: "destructive"
        });
        router.push('/sign-in?returnUrl=/protected/settings');
        return;
      }
      // Update user profile in users table
      const { error } = await supabase
        .from('users')
        .update({
          full_name: values.full_name,
          currency: values.currency,
          dark_mode: values.dark_mode,
          notifications_enabled: values.notifications_enabled,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Update user metadata in auth
      await supabase.auth.updateUser({
        data: { full_name: values.full_name }
      });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "There was a problem updating your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingProfile(false);
    }
  }

  async function onSubmitSecurity(values: z.infer<typeof securityFormSchema>) {
    setIsSubmittingPassword(true);
    
    try {
      // Make sure user is authenticated
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to update your password",
          variant: "destructive"
        });
        router.push('/sign-in?returnUrl=/protected/settings');
        return;
      }
      
      // Update password
      const { error } = await supabase.auth.updateUser({
        password: values.new_password
      });
      
      if (error) throw error;
      
      toast({
        title: "Password updated",
        description: "Your password has been successfully updated.",
      });
      
      // Reset form
      securityForm.reset({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: "Error",
        description: "There was a problem updating your password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingPassword(false);
    }
  }

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive",
      });
    }
  }

  if (isLoadingProfile) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <div className="text-center py-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (isLoadingProfile) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8 items-center justify-center min-h-[300px]">
        <div className="mint-card p-8 text-center">
          <div className="animate-pulse mb-4">
            <div className="h-8 w-8 rounded-full bg-primary/20 mx-auto"></div>
          </div>
          <p className="text-muted-foreground">Loading profile data...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8 items-center justify-center min-h-[300px]">
        <div className="mint-card p-8 text-center">
          <p className="text-lg font-medium mb-4">Authentication Required</p>
          <p className="text-muted-foreground mb-6">Please sign in to access your settings</p>
          <Link href="/sign-in?returnUrl=/protected/settings" className="mint-button inline-flex">
            Sign In
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <h1 className="text-2xl font-bold">Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Manage your personal information and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={profileForm.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Your email" 
                              {...field} 
                              disabled 
                            />
                          </FormControl>
                          <FormDescription>
                            Email cannot be changed here.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={profileForm.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Currency</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                          >
                            <option value="USD">USD - US Dollar</option>
                            <option value="EUR">EUR - Euro</option>
                            <option value="GBP">GBP - British Pound</option>
                            <option value="JPY">JPY - Japanese Yen</option>
                            <option value="CAD">CAD - Canadian Dollar</option>
                            <option value="AUD">AUD - Australian Dollar</option>
                            <option value="CNY">CNY - Chinese Yuan</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Preferences</h3>
                    
                    <FormField
                      control={profileForm.control}
                      name="dark_mode"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Dark Mode</FormLabel>
                            <FormDescription>
                              Enable dark mode for the application.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="notifications_enabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Notifications</FormLabel>
                            <FormDescription>
                              Receive notifications for important events.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmittingProfile} className="mint-button">
                      {isSubmittingProfile ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Update your password and security settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...securityForm}>
                <form onSubmit={securityForm.handleSubmit(onSubmitSecurity)} className="space-y-6">
                  <FormField
                    control={securityForm.control}
                    name="current_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={securityForm.control}
                      name="new_password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={securityForm.control}
                      name="confirm_password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmittingPassword} className="mint-button">
                      {isSubmittingPassword ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>
                Manage your account settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full mint-button-outline"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
              
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={() => {
                  toast({
                    title: "Not implemented",
                    description: "This feature is not yet implemented.",
                  });
                }}
              >
                Delete Account
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Data Export</CardTitle>
              <CardDescription>
                Export your financial data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  toast({
                    title: "Not implemented",
                    description: "This feature is not yet implemented.",
                  });
                }}
              >
                Export as CSV
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  toast({
                    title: "Not implemented",
                    description: "This feature is not yet implemented.",
                  });
                }}
              >
                Export as PDF
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Finance Tracker v1.0.0
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                © 2025 Finance509
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
