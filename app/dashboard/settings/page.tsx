"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/supabase-js';
import { Save, Moon, Sun, Bell, BellOff, Download, LogOut, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { getCurrentUser, signOut } from '../../../utils/auth-service';
import toast from 'react-hot-toast';
import { Profile } from '../../../types/database';

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState({
    fullName: '',
    currency: 'USD',
  });
  const [preferences, setPreferences] = useState({
    darkMode: false,
    notifications: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    async function fetchUserData() {
      try {
        const supabase = createClientComponentClient();
        
        // Get user using auth-service
        const { success, user } = await getCurrentUser();
        
        if (!success || !user) {
          setIsLoading(false);
          return;
        }
        
        setUser(user);
        
        // Fetch profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, currency, preferences')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setProfile({
            fullName: profile.full_name || '',
            currency: profile.currency || 'USD',
          });
          
          if (profile.preferences) {
            setPreferences({
              darkMode: profile.preferences.darkMode || false,
              notifications: profile.preferences.notifications !== false, // default to true
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUserData();
    
    // Check system dark mode preference
    if (typeof window !== 'undefined') {
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setPreferences(prev => ({ ...prev, darkMode: isDarkMode }));
    }
  }, []);

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      const supabase = createClientComponentClient();
      
      if (!user?.id) {
        throw new Error('User not found');
      }
      
      // Direct approach: Update user metadata
      // This is the most reliable way to update user profile data
      const { data, error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: profile.fullName,
          currency: profile.currency,
          preferences: preferences,
          updated_at: new Date().toISOString()
        }
      });
      
      if (updateError) {
        console.error('Error updating user:', updateError);
        throw updateError;
      }
      
      // Also update the user's name in the UI
      if (data?.user) {
        // Update the user state with the new data
        setUser(data.user);
        
        // Update the profile display name if it exists in metadata
        const metadata = data.user.user_metadata;
        if (metadata?.full_name) {
          setProfile(prev => ({
            ...prev,
            fullName: metadata.full_name
          }));
        }
      }
      
      console.log('Profile updated successfully:', data?.user?.user_metadata);
      
      // Show success message
      toast.success('Profile updated successfully!');
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      // As a backup, also try to update the profiles table if it exists
      try {
        // Check if the profiles table exists
        const { data: profileCheck, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);
        
        // If profiles table exists and there's no error, update or create profile
        if (!checkError && profileCheck) {
          // Check if profile exists
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();
          
          if (existingProfile) {
            // Update existing profile
            await supabase
              .from('profiles')
              .update({
                full_name: profile.fullName,
                currency: profile.currency,
                preferences: preferences,
                updated_at: new Date().toISOString(),
              })
              .eq('id', user.id);
          } else {
            // Create new profile
            await supabase
              .from('profiles')
              .insert({
                id: user.id,
                full_name: profile.fullName,
                currency: profile.currency,
                preferences: preferences,
                updated_at: new Date().toISOString(),
              });
          }
        }
      } catch (profileError) {
        // Just log the error but don't throw it - we already updated the user metadata
        console.log('Note: Could not update profiles table, but user metadata was updated:', profileError);
      }
      
      // Success has already been handled above
      
      // Show success message
      toast.success('Profile updated successfully!');
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      // Apply dark mode
      if (typeof document !== 'undefined') {
        if (preferences.darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } catch (error: any) {
      // More detailed error logging
      console.error('Error updating profile:', error);
      console.error('Error details:', error?.message, error?.details, error?.hint);
      
      // Show more specific error message if available
      const errorMessage = error?.message || 'Failed to update profile. Please try again.';
      toast.error(errorMessage);
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsSaving(false);
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    }
  };

  const handleSignOut = async () => {
    // Use the auth-service signOut function
    const { success } = await signOut();
    if (success) {
      // The signOut function already handles redirection
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
        <div className="mint-card p-8 text-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-32 bg-primary/20 rounded mb-4"></div>
            <div className="h-4 w-48 bg-primary/10 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type.toLowerCase() === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Settings */}
        <div className="mint-card p-6">
          <h2 className="text-xl font-semibold mb-4">Profile</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="email">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 border rounded-md bg-muted/50"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email cannot be changed
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="fullName">
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Your full name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="currency">
                Preferred Currency
              </label>
              <select
                id="currency"
                value={profile.currency}
                onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
            </div>
            
            {/* Save Profile Button */}
            <div className="pt-4 mt-4 border-t">
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="mint-button w-full flex items-center justify-center gap-2"
              >
                {isSaving ? 'Saving...' : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Profile
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* App Preferences */}
        <div className="mint-card p-6">
          <h2 className="text-xl font-semibold mb-4">App Preferences</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Dark Mode</h3>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark theme
                </p>
              </div>
              <button
                onClick={() => setPreferences({ ...preferences, darkMode: !preferences.darkMode })}
                className="p-2 rounded-md bg-muted/50 hover:bg-muted"
              >
                {preferences.darkMode ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Enable or disable app notifications
                </p>
              </div>
              <button
                onClick={() => setPreferences({ ...preferences, notifications: !preferences.notifications })}
                className="p-2 rounded-md bg-muted/50 hover:bg-muted"
              >
                {preferences.notifications ? (
                  <Bell className="h-5 w-5" />
                ) : (
                  <BellOff className="h-5 w-5" />
                )}
              </button>
            </div>
            
            <div className="pt-4 mt-4 border-t">
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="mint-button w-full flex items-center justify-center gap-2"
              >
                {isSaving ? 'Saving...' : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="mint-card p-6">
          <h2 className="text-xl font-semibold mb-4">Security</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Password</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Change your account password
              </p>
              <Link 
                href="/dashboard/settings/change-password"
                className="mint-button-sm"
              >
                Change Password
              </Link>
            </div>
            
            <div className="pt-4 mt-4 border-t">
              <h3 className="font-medium">Two-Factor Authentication</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Add an extra layer of security to your account
              </p>
              <Link 
                href="/dashboard/settings/two-factor"
                className="mint-button-sm"
              >
                Set Up 2FA
              </Link>
            </div>
          </div>
        </div>

        {/* Data & Account */}
        <div className="mint-card p-6">
          <h2 className="text-xl font-semibold mb-4">Data & Account</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Export Data</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Download all your financial data
              </p>
              <button className="mint-button-sm flex items-center gap-1">
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>
            
            <div className="pt-4 mt-4 border-t">
              <h3 className="font-medium text-[hsl(var(--expense))]">Sign Out</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Sign out of your account
              </p>
              <button 
                onClick={handleSignOut}
                className="mint-button-sm bg-[hsl(var(--expense))] text-white hover:bg-[hsl(var(--expense))] hover:opacity-90 flex items-center gap-1"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
            
            <div className="pt-4 mt-4 border-t">
              <h3 className="font-medium text-[hsl(var(--expense))]">Delete Account</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Permanently delete your account and all data
              </p>
              <Link 
                href="/dashboard/settings/delete-account"
                className="mint-button-sm bg-destructive text-destructive-foreground hover:bg-destructive hover:opacity-90 flex items-center gap-1"
              >
                <AlertTriangle className="h-4 w-4" />
                Delete Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
