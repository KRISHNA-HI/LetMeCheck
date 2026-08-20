import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Manga,
  UserProfile,
  UserLibraryEntry,
  UserProgress,
  UserMaterialProgress,
  UserNote,
  ReadingStatus,
  MaterialStatus
} from '../types';
import { localStorageService } from './storage';

const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('placeholder')
  );
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const getAuthRedirectUrl = (): string | undefined => {
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    if (origin && origin !== 'null') {
      return origin;
    }
  }
  return undefined;
};

export interface SignUpResult {
  user: any | null;
  session: any | null;
  needsEmailConfirmation: boolean;
  error: Error | null;
}

export const supabaseService = {
  isConfigured(): boolean {
    return isSupabaseConfigured();
  },

  // ----------------------------------------------------
  // AUTHENTICATION
  // ----------------------------------------------------
  async signUp(email: string, password: string, username: string): Promise<SignUpResult> {
    if (!supabase) {
      return {
        user: null,
        session: null,
        needsEmailConfirmation: false,
        error: new Error('Supabase client is not configured.')
      };
    }

    const redirectUrl = getAuthRedirectUrl();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: username
        },
        ...(redirectUrl ? { emailRedirectTo: redirectUrl } : {})
      }
    });

    if (error) {
      const msg = (error.message || '').toLowerCase();
      const status = (error as any).status;

      if (
        msg.includes('over_email_send_rate_limit') ||
        msg.includes('security purposes') ||
        (msg.includes('rate limit') && msg.includes('email'))
      ) {
        return {
          user: null,
          session: null,
          needsEmailConfirmation: false,
          error: new Error('Supabase email rate limit reached: Verification emails are limited to once every 60 seconds. Please wait a moment before trying again.')
        };
      }

      if (
        status === 429 ||
        msg.includes('rate limit') ||
        msg.includes('too many requests')
      ) {
        return {
          user: null,
          session: null,
          needsEmailConfirmation: false,
          error: new Error('Rate limit reached: Too many attempts in a short period. Please wait a moment before trying again.')
        };
      }

      if (
        msg.includes('already registered') ||
        msg.includes('user already exists') ||
        msg.includes('duplicate') ||
        status === 422
      ) {
        return {
          user: null,
          session: null,
          needsEmailConfirmation: false,
          error: new Error('An account with this email already exists. Please sign in instead.')
        };
      }

      return {
        user: null,
        session: null,
        needsEmailConfirmation: false,
        error
      };
    }

    if (!data.user) {
      return {
        user: null,
        session: null,
        needsEmailConfirmation: false,
        error: new Error('Unable to create account. Please try again.')
      };
    }

    if (data.user.identities && data.user.identities.length === 0) {
      return {
        user: null,
        session: null,
        needsEmailConfirmation: false,
        error: new Error('An account with this email already exists. Please sign in instead.')
      };
    }

    const needsEmailConfirmation =
      !data.session &&
      (!data.user.email_confirmed_at || data.user.confirmed_at == null);

    return {
      user: data.user,
      session: data.session,
      needsEmailConfirmation,
      error: null
    };
  },

  async signIn(email: string, password: string) {
    if (!supabase) {
      return { user: null, error: new Error('Supabase client is not configured.') };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      const msg = (error.message || '').toLowerCase();
      const status = (error as any).status;

      if (
        status === 429 ||
        msg.includes('rate limit') ||
        msg.includes('too many requests')
      ) {
        return {
          user: null,
          error: new Error('Too many login attempts. Please wait a moment before trying again.')
        };
      }

      if (msg.includes('email not confirmed')) {
        return {
          user: null,
          error: new Error('Email not confirmed. Please check your inbox to verify your email before signing in.')
        };
      }

      if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
        return {
          user: null,
          error: new Error('Invalid email or password. Please verify your credentials and try again.')
        };
      }

      return { user: null, error };
    }

    return { user: data.user, error: null };
  },

  async resendConfirmationEmail(email: string) {
    if (!supabase) {
      return { error: new Error('Supabase client is not configured.') };
    }

    const redirectUrl = getAuthRedirectUrl();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        ...(redirectUrl ? { emailRedirectTo: redirectUrl } : {})
      }
    });

    if (error) {
      const msg = (error.message || '').toLowerCase();
      const status = (error as any).status;

      if (
        status === 429 ||
        msg.includes('rate limit') ||
        msg.includes('over_email_send_rate_limit') ||
        msg.includes('too many') ||
        msg.includes('security purposes')
      ) {
        return {
          error: new Error('Verification emails can only be sent once every 60 seconds. Please wait before requesting another.')
        };
      }
      return { error };
    }

    return { error: null };
  },

  async signOut() {
    localStorageService.clearUserData();
    if (!supabase) {
      return { error: null };
    }
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async deleteAccount(): Promise<{ success: boolean; error: Error | null }> {
    try {
      const isConfig = isSupabaseConfigured();

      if (!isConfig || !supabase) {
        // In local/offline mode, delete local user storage
        const currentLocalUser = localStorageService.getLocalUser();
        if (currentLocalUser?.id) {
          localStorageService.purgeUserLocalData(currentLocalUser.id);
        } else {
          localStorageService.clearUserData();
        }
        return { success: true, error: null };
      }

      // 1. Get authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      const currentLocalUser = localStorageService.getLocalUser();
      const uid = user?.id || currentLocalUser?.id;

      if (!uid) {
        return { success: false, error: new Error('No authenticated user session found.') };
      }

      // 2. Explicitly delete user rows from all user-specific public tables (enforced by RLS auth.uid() = user_id)
      try {
        await supabase.from('notes').delete().eq('user_id', uid);
      } catch (e) {
        console.warn('Error deleting user notes:', e);
      }

      try {
        await supabase.from('favorites').delete().eq('user_id', uid);
      } catch (e) {
        console.warn('Error deleting user favorites:', e);
      }

      try {
        await supabase.from('user_material_progress').delete().eq('user_id', uid);
      } catch (e) {
        console.warn('Error deleting user material progress:', e);
      }

      try {
        await supabase.from('user_progress').delete().eq('user_id', uid);
      } catch (e) {
        console.warn('Error deleting user progress:', e);
      }

      try {
        await supabase.from('user_library').delete().eq('user_id', uid);
      } catch (e) {
        console.warn('Error deleting user library:', e);
      }

      try {
        await supabase.from('profiles').delete().eq('id', uid);
      } catch (e) {
        console.warn('Error deleting user profile:', e);
      }

      // 3. Delete Supabase Auth user record server-side
      let authDeleted = false;
      let deletionErrorMessage = '';

      // Get current session token for API / Edge functions
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      // Method A: Call server API route `/api/delete-account`
      if (accessToken) {
        try {
          const res = await fetch('/api/delete-account', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            }
          });
          if (res.ok) {
            const apiRes = await res.json();
            if (apiRes.success) {
              authDeleted = true;
            } else if (apiRes.error) {
              deletionErrorMessage = apiRes.error;
            }
          } else {
            const errData = await res.json().catch(() => null);
            if (errData?.error) {
              deletionErrorMessage = errData.error;
            }
          }
        } catch (apiErr: any) {
          console.warn('API /api/delete-account call error:', apiErr);
        }
      }

      // Method B: Invoke Supabase Edge Function 'delete-user-account'
      if (!authDeleted) {
        try {
          const { data: funcData, error: funcErr } = await supabase.functions.invoke('delete-user-account');
          if (!funcErr && funcData && (funcData.success || funcData.message)) {
            authDeleted = true;
          } else if (funcErr) {
            deletionErrorMessage = funcErr.message || deletionErrorMessage;
          }
        } catch (e: any) {
          deletionErrorMessage = e?.message || deletionErrorMessage;
        }
      }

      // Method C: Invoke PostgreSQL RPC 'delete_user_account' (SECURITY DEFINER)
      if (!authDeleted) {
        try {
          const { error: rpcErr } = await supabase.rpc('delete_user_account');
          if (!rpcErr) {
            authDeleted = true;
          } else {
            deletionErrorMessage = rpcErr.message || deletionErrorMessage;
          }
        } catch (e: any) {
          deletionErrorMessage = e?.message || deletionErrorMessage;
        }
      }

      // If server-side Auth deletion failed, do NOT claim success and do NOT wipe session
      if (!authDeleted) {
        const errText = deletionErrorMessage
          ? `Server failed to delete auth account: ${deletionErrorMessage}`
          : 'Failed to delete Auth account. Please ensure the delete_user_account RPC or Edge Function is installed on Supabase.';
        return { success: false, error: new Error(errText) };
      }

      // 4. Purge all local user-scoped storage data
      localStorageService.purgeUserLocalData(uid);

      // 5. Sign out from client session
      try {
        await supabase.auth.signOut();
      } catch (signOutErr) {
        console.warn('Sign out after delete:', signOutErr);
      }

      return { success: true, error: null };
    } catch (err: any) {
      console.error('Failed to delete account:', err);
      return { success: false, error: err instanceof Error ? err : new Error('Account deletion failed.') };
    }
  },

  async resetPassword(email: string) {
    if (!supabase) {
      return { data: null, error: new Error('Supabase client is not configured.') };
    }
    const redirectUrl = getAuthRedirectUrl();
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      ...(redirectUrl ? { redirectTo: redirectUrl } : {})
    });
    return { data, error };
  },

  async signInWithOAuth(provider: 'google' | 'github' | 'discord' | string) {
    if (!supabase) {
      return { data: null, error: new Error('Supabase client is not configured.') };
    }
    const redirectUrl = getAuthRedirectUrl();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: {
        ...(redirectUrl ? { redirectTo: redirectUrl } : {})
      }
    });
    return { data, error };
  },

  async getCurrentUser(): Promise<UserProfile | null> {
    if (!supabase) {
      return localStorageService.getLocalUser();
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return null;
      }

      let profile: any = null;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        profile = data;
      } catch {
        // Fallback to metadata if profiles table is not cached
      }

      const userProfile: UserProfile = {
        id: user.id,
        email: user.email,
        username: profile?.username || user.user_metadata?.username || user.email?.split('@')[0] || 'User',
        display_name: profile?.display_name || user.user_metadata?.display_name || 'Reader',
        avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || '',
        created_at: profile?.created_at || user.created_at
      };

      localStorageService.setLocalUser(userProfile);
      return userProfile;
    } catch (e) {
      console.warn('getCurrentUser error:', e);
      return localStorageService.getLocalUser();
    }
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    if (!supabase) {
      const current = localStorageService.getLocalUser();
      if (current) {
        localStorageService.setLocalUser({ ...current, ...updates });
      }
      return { data: { ...current, ...updates }, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          display_name: updates.display_name,
          avatar_url: updates.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (!error && data) {
        const current = localStorageService.getLocalUser();
        if (current) {
          localStorageService.setLocalUser({ ...current, ...data });
        }
      }
      return { data, error };
    } catch (err) {
      const current = localStorageService.getLocalUser();
      if (current) {
        localStorageService.setLocalUser({ ...current, ...updates });
      }
      return { data: updates, error: null };
    }
  },

  // ----------------------------------------------------
  // MANGA METADATA CACHE & CANONICAL UUID RESOLVER
  // ----------------------------------------------------
  async getOrCreateManga(manga: Manga): Promise<Manga> {
    if (!supabase) {
      return manga;
    }

    try {
      const isMangaIdUuid = typeof manga.id === 'string' && UUID_REGEX.test(manga.id);
      const anilistId = manga.anilist_id || (typeof manga.id === 'number' ? manga.id : null);

      let existingMangaRow: any = null;

      if (isMangaIdUuid) {
        const { data } = await supabase.from('manga').select('*').eq('id', manga.id).maybeSingle();
        if (data) existingMangaRow = data;
      }

      if (!existingMangaRow && anilistId) {
        const { data } = await supabase.from('manga').select('*').eq('anilist_id', anilistId).maybeSingle();
        if (data) existingMangaRow = data;
      }

      if (!existingMangaRow && manga.title) {
        const { data } = await supabase.from('manga').select('*').eq('title', manga.title).maybeSingle();
        if (data) existingMangaRow = data;
      }

      if (existingMangaRow) {
        return {
          ...manga,
          id: existingMangaRow.id,
          anilist_id: existingMangaRow.anilist_id,
          title: existingMangaRow.title || manga.title
        };
      }

      const { data: inserted, error } = await supabase
        .from('manga')
        .insert({
          anilist_id: anilistId,
          mangadex_id: manga.mangadex_id || null,
          title: manga.title,
          alternative_titles: manga.alternative_titles || [],
          description: manga.description || '',
          type: manga.type || 'Manga',
          status: manga.status || 'Ongoing',
          author: manga.author || null,
          artist: manga.artist || null,
          genres: manga.genres || [],
          chapters: manga.chapters || null,
          volumes: manga.volumes || null,
          cover_url: manga.cover_url || '',
          banner_url: manga.banner_url || null,
          source: manga.source || 'AniList'
        })
        .select('*')
        .single();

      if (error || !inserted) {
        return manga;
      }

      return {
        ...manga,
        id: inserted.id,
        anilist_id: inserted.anilist_id
      };
    } catch (err) {
      return manga;
    }
  },

  async ensureMangaCached(manga: Manga): Promise<string> {
    const canonical = await this.getOrCreateManga(manga);
    return canonical.id.toString();
  },

  // ----------------------------------------------------
  // USER LIBRARY
  // ----------------------------------------------------
  async getLibrary(userId: string): Promise<UserLibraryEntry[]> {
    if (!supabase) {
      return localStorageService.getLibrary(userId);
    }

    try {
      const { data, error } = await supabase
        .from('user_library')
        .select(`
          id,
          user_id,
          manga_id,
          status,
          created_at,
          updated_at,
          manga:manga_id (
            id,
            anilist_id,
            title,
            alternative_titles,
            description,
            type,
            status,
            author,
            artist,
            genres,
            chapters,
            volumes,
            cover_url,
            banner_url,
            source
          )
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error || !data) {
        return localStorageService.getLibrary(userId);
      }

      const formatted: UserLibraryEntry[] = data.map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        manga_id: row.manga_id,
        status: row.status as ReadingStatus,
        created_at: row.created_at,
        updated_at: row.updated_at,
        manga: row.manga
          ? {
              ...row.manga,
              id: row.manga.id,
              anilist_id: row.manga.anilist_id
            }
          : undefined
      }));

      localStorageService.setLibrary(formatted, userId);
      return formatted;
    } catch (err) {
      return localStorageService.getLibrary(userId);
    }
  },

  async upsertLibraryEntry(
    userId: string,
    manga: Manga,
    status: ReadingStatus
  ): Promise<{ success: boolean; entry: UserLibraryEntry; error?: any }> {
    let canonicalManga = manga;
    let dbMangaId = manga.id;

    if (supabase) {
      try {
        canonicalManga = await this.getOrCreateManga(manga);
        dbMangaId = canonicalManga.id;
      } catch (err) {
        // Continue with original manga ID
      }
    }

    const entry: UserLibraryEntry = {
      user_id: userId,
      manga_id: dbMangaId,
      status,
      manga: canonicalManga,
      updated_at: new Date().toISOString()
    };

    // Always persist to user-scoped local storage immediately
    localStorageService.saveLibraryEntry(entry, userId);

    if (!supabase) {
      return { success: true, entry };
    }

    try {
      let targetMangaUuid = dbMangaId.toString();
      if (!UUID_REGEX.test(targetMangaUuid)) {
        const { data } = await supabase
          .from('manga')
          .select('id')
          .eq('anilist_id', manga.anilist_id || (typeof manga.id === 'number' ? manga.id : null))
          .maybeSingle();
        if (data?.id) targetMangaUuid = data.id;
      }

      if (UUID_REGEX.test(targetMangaUuid)) {
        await supabase
          .from('user_library')
          .upsert(
            {
              user_id: userId,
              manga_id: targetMangaUuid,
              status,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'user_id,manga_id' }
          );
      }
      return { success: true, entry };
    } catch (err) {
      return { success: true, entry };
    }
  },

  async removeLibraryEntry(userId: string, mangaId: string | number): Promise<{ success: boolean; error?: any }> {
    localStorageService.removeLibraryEntry(mangaId, userId);

    if (!supabase) {
      return { success: true };
    }

    try {
      let dbId = mangaId.toString();
      if (!UUID_REGEX.test(dbId)) {
        const numId = typeof mangaId === 'number' ? mangaId : parseInt(mangaId.toString(), 10);
        if (!isNaN(numId)) {
          const { data } = await supabase
            .from('manga')
            .select('id')
            .eq('anilist_id', numId)
            .maybeSingle();
          if (data?.id) dbId = data.id;
        }
      }

      if (UUID_REGEX.test(dbId)) {
        await supabase
          .from('user_library')
          .delete()
          .eq('user_id', userId)
          .eq('manga_id', dbId);
      }
      return { success: true };
    } catch (err) {
      return { success: true };
    }
  },

  // ----------------------------------------------------
  // READING PROGRESS
  // ----------------------------------------------------
  async getAllProgress(userId: string): Promise<UserProgress[]> {
    if (!supabase) {
      return localStorageService.getAllProgress(userId);
    }

    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select(`
          id,
          user_id,
          manga_id,
          chapters_read,
          volumes_read,
          updated_at,
          manga:manga_id (
            anilist_id
          )
        `)
        .eq('user_id', userId);

      if (error || !data) {
        return localStorageService.getAllProgress(userId);
      }

      const list: UserProgress[] = [];
      data.forEach((row: any) => {
        const p: UserProgress = {
          id: row.id,
          user_id: row.user_id,
          manga_id: row.manga_id,
          chapters_read: row.chapters_read || 0,
          volumes_read: row.volumes_read || 0,
          updated_at: row.updated_at
        };
        list.push(p);

        // Also add entry mapped by anilist_id if present
        if (row.manga?.anilist_id) {
          list.push({
            ...p,
            manga_id: row.manga.anilist_id.toString()
          });
        }
      });

      localStorageService.setAllProgress(list, userId);
      return list;
    } catch {
      return localStorageService.getAllProgress(userId);
    }
  },

  async getProgress(userId: string, mangaId: string | number): Promise<UserProgress | null> {
    const local = localStorageService.getProgress(mangaId, userId);
    if (!supabase) return local;

    try {
      let dbId = mangaId.toString();
      if (!UUID_REGEX.test(dbId)) {
        const numId = typeof mangaId === 'number' ? mangaId : parseInt(mangaId.toString(), 10);
        if (!isNaN(numId)) {
          const { data } = await supabase
            .from('manga')
            .select('id')
            .eq('anilist_id', numId)
            .maybeSingle();
          if (data?.id) dbId = data.id;
        }
      }

      if (UUID_REGEX.test(dbId)) {
        const { data } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', userId)
          .eq('manga_id', dbId)
          .maybeSingle();

        if (data) {
          localStorageService.saveProgress(data, userId);
          return data;
        }
      }
      return local;
    } catch {
      return local;
    }
  },

  async saveProgress(
    userId: string,
    mangaId: string | number,
    chaptersRead: number,
    volumesRead: number
  ): Promise<{ success: boolean; progress: UserProgress; error?: any }> {
    const record: UserProgress = {
      user_id: userId,
      manga_id: mangaId.toString(),
      chapters_read: chaptersRead,
      volumes_read: volumesRead,
      updated_at: new Date().toISOString()
    };

    // Save to user-scoped local storage
    localStorageService.saveProgress(record, userId);

    if (!supabase) {
      return { success: true, progress: record };
    }

    try {
      let dbId = mangaId.toString();
      if (!UUID_REGEX.test(dbId)) {
        const numId = typeof mangaId === 'number' ? mangaId : parseInt(mangaId.toString(), 10);
        if (!isNaN(numId)) {
          const { data } = await supabase
            .from('manga')
            .select('id')
            .eq('anilist_id', numId)
            .maybeSingle();
          if (data?.id) dbId = data.id;
        }
      }

      if (UUID_REGEX.test(dbId)) {
        await supabase.from('user_progress').upsert(
          {
            user_id: userId,
            manga_id: dbId,
            chapters_read: chaptersRead,
            volumes_read: volumesRead,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id,manga_id' }
        );
      }
      return { success: true, progress: record };
    } catch (e) {
      return { success: true, progress: record };
    }
  },

  // ----------------------------------------------------
  // MATERIAL PROGRESS
  // ----------------------------------------------------
  async getAllMaterialProgress(userId: string): Promise<UserMaterialProgress[]> {
    if (!supabase) {
      return localStorageService.getAllMaterialProgress(userId);
    }

    try {
      const { data, error } = await supabase
        .from('user_material_progress')
        .select('*')
        .eq('user_id', userId);

      if (error || !data) {
        return localStorageService.getAllMaterialProgress(userId);
      }

      const list: UserMaterialProgress[] = data.map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        material_id: row.material_id,
        status: row.status as MaterialStatus,
        progress: row.progress || 0,
        updated_at: row.updated_at
      }));

      localStorageService.setAllMaterialProgress(list, userId);
      return list;
    } catch {
      return localStorageService.getAllMaterialProgress(userId);
    }
  },

  async getMaterialProgress(userId: string, materialId: string): Promise<UserMaterialProgress | null> {
    const local = localStorageService.getMaterialProgress(materialId, userId);
    if (!supabase) return local;

    try {
      if (UUID_REGEX.test(materialId)) {
        const { data } = await supabase
          .from('user_material_progress')
          .select('*')
          .eq('user_id', userId)
          .eq('material_id', materialId)
          .maybeSingle();

        if (data) {
          localStorageService.saveMaterialProgress(data, userId);
          return data;
        }
      }
      return local;
    } catch {
      return local;
    }
  },

  async saveMaterialProgress(
    userId: string,
    materialId: string,
    status: MaterialStatus,
    progress = 0
  ): Promise<{ success: boolean; data: UserMaterialProgress; error?: any }> {
    const record: UserMaterialProgress = {
      user_id: userId,
      material_id: materialId,
      status,
      progress,
      updated_at: new Date().toISOString()
    };

    localStorageService.saveMaterialProgress(record, userId);

    if (!supabase) {
      return { success: true, data: record };
    }

    try {
      if (UUID_REGEX.test(materialId)) {
        await supabase.from('user_material_progress').upsert(
          {
            user_id: userId,
            material_id: materialId,
            status,
            progress,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id,material_id' }
        );
      }
      return { success: true, data: record };
    } catch (e) {
      return { success: true, data: record };
    }
  },

  // ----------------------------------------------------
  // FAVORITES
  // ----------------------------------------------------
  async getFavorites(userId: string): Promise<string[]> {
    if (!supabase) {
      return localStorageService.getFavorites(userId);
    }

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          manga_id,
          manga:manga_id (
            id,
            anilist_id
          )
        `)
        .eq('user_id', userId);

      if (error || !data) {
        return localStorageService.getFavorites(userId);
      }

      const idList: string[] = [];
      data.forEach((row: any) => {
        if (row.manga?.anilist_id) {
          idList.push(row.manga.anilist_id.toString());
        }
        if (row.manga?.id) {
          idList.push(row.manga.id.toString());
        }
        idList.push(row.manga_id.toString());
      });

      const uniqueList = Array.from(new Set(idList));
      localStorageService.setFavorites(uniqueList, userId);
      return uniqueList;
    } catch {
      return localStorageService.getFavorites(userId);
    }
  },

  async toggleFavorite(userId: string, manga: Manga): Promise<{ success: boolean; isFavorite: boolean; error?: any }> {
    const idStr = manga.id.toString();

    // Toggle in local timestamp-tracked storage first
    const willBeFav = localStorageService.toggleFavorite(manga, userId);

    if (!supabase) {
      return { success: true, isFavorite: willBeFav };
    }

    try {
      let dbMangaId: string = idStr;
      if (!UUID_REGEX.test(dbMangaId)) {
        const numId = typeof manga.id === 'number' ? manga.id : manga.anilist_id;
        if (numId) {
          const { data } = await supabase
            .from('manga')
            .select('id')
            .eq('anilist_id', numId)
            .maybeSingle();
          if (data?.id) dbMangaId = data.id;
        }
      }

      if (UUID_REGEX.test(dbMangaId)) {
        if (willBeFav) {
          await supabase.from('favorites').upsert(
            {
              user_id: userId,
              manga_id: dbMangaId
            },
            { onConflict: 'user_id,manga_id' }
          );
        } else {
          await supabase
            .from('favorites')
            .delete()
            .eq('user_id', userId)
            .eq('manga_id', dbMangaId);
        }
      }
      return { success: true, isFavorite: willBeFav };
    } catch {
      return { success: true, isFavorite: willBeFav };
    }
  },

  // ----------------------------------------------------
  // NOTES
  // ----------------------------------------------------
  async getAllNotes(userId: string): Promise<UserNote[]> {
    if (!supabase) {
      return localStorageService.getAllNotes(userId);
    }

    try {
      const { data, error } = await supabase
        .from('notes')
        .select(`
          id,
          user_id,
          manga_id,
          content,
          created_at,
          updated_at,
          manga:manga_id (
            anilist_id
          )
        `)
        .eq('user_id', userId);

      if (error || !data) {
        return localStorageService.getAllNotes(userId);
      }

      const list: UserNote[] = [];
      data.forEach((row: any) => {
        const n: UserNote = {
          id: row.id,
          user_id: row.user_id,
          manga_id: row.manga_id,
          content: row.content,
          created_at: row.created_at,
          updated_at: row.updated_at
        };
        list.push(n);

        if (row.manga?.anilist_id) {
          list.push({
            ...n,
            manga_id: row.manga.anilist_id.toString()
          });
        }
      });

      localStorageService.setAllNotes(list, userId);
      return list;
    } catch {
      return localStorageService.getAllNotes(userId);
    }
  },

  async getNote(userId: string, mangaId: string | number): Promise<UserNote | null> {
    const local = localStorageService.getNotes(mangaId, userId);
    if (!supabase) return local;

    try {
      let dbId = mangaId.toString();
      if (!UUID_REGEX.test(dbId)) {
        const numId = typeof mangaId === 'number' ? mangaId : parseInt(mangaId.toString(), 10);
        if (!isNaN(numId)) {
          const { data } = await supabase
            .from('manga')
            .select('id')
            .eq('anilist_id', numId)
            .maybeSingle();
          if (data?.id) dbId = data.id;
        }
      }

      if (UUID_REGEX.test(dbId)) {
        const { data } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', userId)
          .eq('manga_id', dbId)
          .maybeSingle();

        if (data) {
          localStorageService.saveNote(data, userId);
          return data;
        }
      }
      return local;
    } catch {
      return local;
    }
  },

  async saveNote(userId: string, mangaId: string | number, content: string): Promise<{ success: boolean; note: UserNote; error?: any }> {
    const note: UserNote = {
      user_id: userId,
      manga_id: mangaId.toString(),
      content,
      updated_at: new Date().toISOString()
    };

    localStorageService.saveNote(note, userId);

    if (!supabase) {
      return { success: true, note };
    }

    try {
      let dbId = mangaId.toString();
      if (!UUID_REGEX.test(dbId)) {
        const numId = typeof mangaId === 'number' ? mangaId : parseInt(mangaId.toString(), 10);
        if (!isNaN(numId)) {
          const { data } = await supabase
            .from('manga')
            .select('id')
            .eq('anilist_id', numId)
            .maybeSingle();
          if (data?.id) dbId = data.id;
        }
      }

      if (UUID_REGEX.test(dbId)) {
        await supabase.from('notes').upsert(
          {
            user_id: userId,
            manga_id: dbId,
            content,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id,manga_id' }
        );
      }
      return { success: true, note };
    } catch (e) {
      return { success: true, note };
    }
  },

  async deleteNote(userId: string, mangaId: string | number): Promise<{ success: boolean; error?: any }> {
    localStorageService.deleteNote(mangaId, userId);

    if (!supabase) {
      return { success: true };
    }

    try {
      let dbId = mangaId.toString();
      if (!UUID_REGEX.test(dbId)) {
        const numId = typeof mangaId === 'number' ? mangaId : parseInt(mangaId.toString(), 10);
        if (!isNaN(numId)) {
          const { data } = await supabase
            .from('manga')
            .select('id')
            .eq('anilist_id', numId)
            .maybeSingle();
          if (data?.id) dbId = data.id;
        }
      }

      if (UUID_REGEX.test(dbId)) {
        await supabase
          .from('notes')
          .delete()
          .eq('user_id', userId)
          .eq('manga_id', dbId);
      }
      return { success: true };
    } catch (e) {
      return { success: true };
    }
  }
};
