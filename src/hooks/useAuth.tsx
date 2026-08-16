import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserProfile } from '../types';
import { supabaseService, supabase } from '../services/supabase';

interface AuthContextType {
  user: UserProfile | null;
  profile: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  isSupabaseOnline: boolean;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; error?: { message?: string } | string | null }>;
  signUp: (email: string, pass: string, username: string) => Promise<{ success: boolean; error?: { message?: string } | string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const isSupabaseOnline = supabaseService.isConfigured();

  const loadUser = async () => {
    try {
      setLoading(true);
      const currentUser = await supabaseService.getCurrentUser();
      setUser(currentUser);
    } catch (e) {
      console.warn('Failed to load user:', e);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();

    if (supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const u = await supabaseService.getCurrentUser();
          setUser(u);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  const signIn = async (email: string, pass: string) => {
    try {
      const { user: authUser, error } = await supabaseService.signIn(email, pass);
      if (error) {
        return { success: false, error: { message: error.message || 'Login failed' } };
      }
      const loaded = await supabaseService.getCurrentUser();
      setUser(loaded);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: { message: err.message || 'Login failed' } };
    }
  };

  const signUp = async (email: string, pass: string, username: string) => {
    try {
      const { user: authUser, error } = await supabaseService.signUp(email, pass, username);
      if (error) {
        return { success: false, error: { message: error.message || 'Registration failed' } };
      }

      // Signup returned success - now load and verify the user profile
      const loaded = await supabaseService.getCurrentUser();
      
      // If profile loaded, verify the username matches the signup attempt
      if (loaded && loaded.username) {
        // Check if the profile username matches what we tried to create (case-insensitive)
        if (loaded.username.toLowerCase() !== username.toLowerCase()) {
          // Username mismatch = duplicate email scenario
          return {
            success: false,
            error: { message: 'An account with this email already exists. Please sign in instead.' }
          };
        }
        // Username matches - successful new account
        setUser(loaded);
        return { success: true, error: null };
      }

      // Profile didn't load or has no username
      // If we have an authUser, this might be a duplicate email with permission/timing issues
      if (authUser) {
        return {
          success: false,
          error: { message: 'An account with this email already exists. Please sign in instead.' }
        };
      }

      // No profile and no authUser - genuine account creation failure
      return {
        success: false,
        error: { message: 'Failed to create account. Please try again.' }
      };
    } catch (err: any) {
      return { success: false, error: { message: err.message || 'Registration failed' } };
    }
  };

  const signOut = async () => {
    await supabaseService.signOut();
    setUser(null);
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    if (!user) return false;
    const { error } = await supabaseService.updateProfile(user.id, updates);
    if (!error) {
      setUser((prev) => (prev ? { ...prev, ...updates } : null));
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile: user,
        loading,
        isConfigured: isSupabaseOnline,
        isSupabaseOnline,
        signIn,
        signUp,
        signOut,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
