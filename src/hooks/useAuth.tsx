import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserProfile } from '../types';
import { supabaseService, supabase } from '../services/supabase';
import { localStorageService } from '../services/storage';

interface AuthContextType {
  user: UserProfile | null;
  profile: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  isSupabaseOnline: boolean;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; error?: { message?: string } | string | null }>;
  signUp: (email: string, pass: string, username: string) => Promise<{ success: boolean; needsEmailConfirmation?: boolean; error?: { message?: string } | string | null }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; error?: string | null }>;
  resendConfirmationEmail: (email: string) => Promise<{ success: boolean; error?: string | null }>;
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
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: { message: err.message || 'Login failed' } };
    }
  };

  const signUp = async (email: string, pass: string, username: string) => {
    try {
      const { user: authUser, session, needsEmailConfirmation, error } = await supabaseService.signUp(
        email,
        pass,
        username
      );

      if (error) {
        return { success: false, error: { message: error.message || 'Registration failed' } };
      }

      // If email confirmation is required (no session yet)
      if (needsEmailConfirmation) {
        return {
          success: true,
          needsEmailConfirmation: true,
          error: null
        };
      }

      // Instant session confirmed (e.g. email confirmation disabled)
      if (session || authUser) {
        const loaded = await supabaseService.getCurrentUser();
        setUser(loaded);
        return {
          success: true,
          needsEmailConfirmation: false,
          error: null
        };
      }

      return {
        success: true,
        needsEmailConfirmation: true,
        error: null
      };
    } catch (err: any) {
      return { success: false, error: { message: err.message || 'Registration failed' } };
    }
  };

  const resendConfirmationEmail = async (email: string): Promise<{ success: boolean; error?: string | null }> => {
    try {
      const { error } = await supabaseService.resendConfirmationEmail(email);
      if (error) {
        return { success: false, error: error.message || 'Failed to resend confirmation email.' };
      }
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to resend confirmation email.' };
    }
  };

  const signOut = async () => {
    await supabaseService.signOut();
    setUser(null);
  };

  const deleteAccount = async (): Promise<{ success: boolean; error?: string | null }> => {
    try {
      const currentUid = user?.id;
      const result = await supabaseService.deleteAccount();
      if (result.success) {
        if (currentUid) {
          localStorageService.purgeUserLocalData(currentUid);
        } else {
          localStorageService.purgeUserLocalData();
        }
        setUser(null);
        return { success: true, error: null };
      }
      return { success: false, error: result.error?.message || 'Failed to delete account.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to delete account.' };
    }
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
        deleteAccount,
        resendConfirmationEmail,
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
