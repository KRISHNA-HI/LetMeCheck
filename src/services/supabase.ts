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

export const supabaseService = {
  isConfigured(): boolean {
    return isSupabaseConfigured();
  },

  // ----------------------------------------------------
  // AUTHENTICATION
  // ----------------------------------------------------
  async signUp(email: string, password: string, username: string) {
    if (!supabase) {
      return { user: null, error: new Error('Supabase client is not configured.') };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: username
        },
        emailRedirectTo: window.location.origin
      }
    });

    if (error) {
      // Detect duplicate email error from Supabase
      const errorMessage = error.message || '';
      if (
        errorMessage.toLowerCase().includes('already registered') ||
        errorMessage.toLowerCase().includes('user already exists') ||
        errorMessage.toLowerCase().includes('duplicate') ||
        error.status === 422
      ) {
        return {
          user: null,
          error: new Error('An account with this email already exists. Please sign in instead.')
        };
      }
      return { user: null, error };
    }

    // Success from Supabase - but verify this is a NEW profile creation
    // If the email already existed, Supabase might return success with the existing user
    // We need to check if the profile matches what we tried to create
    if (data.user && data.user.id) {
      try {
        // Wait a moment for the profile trigger to complete
        await new Promise(resolve => setTimeout(resolve, 100));

        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('username, created_at, id')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Error checking profile after signup:', profileError);
          return { user: data.user, error: null };
        }

        // If a profile exists for this user ID, verify it matches our signup attempt
        if (existingProfile) {
          // Profile exists - check if it was created for this signup or if it's a pre-existing account
          // If the username doesn't match what we tried to create, this is a duplicate email scenario
          if (
            existingProfile.username &&
            existingProfile.username.toLowerCase() !== username.toLowerCase()
          ) {
            // The profile already exists with a different username - duplicate email!
            return {
              user: null,
              error: new Error('An account with this email already exists. Please sign in instead.')
            };
          }
        }
      } catch (e) {
        console.error('Error validating signup:', e);
        // Fall through and return the user - something went wrong with validation
      }
    }

    return { user: data.user, error: null };
  },

  async signIn(email: string, password: string) {
    if (!supabase) {
      return { user: null, error: new Error('Supabase client is not configured.') };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) return { user: null, error };
    return { user: data.user, error: null };
  },

  async signOut() {
    localStorageService.clearUserData();
    if (!supabase) {
      return { error: null };
    }
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async resetPassword(email: string) {
    if (!supabase) {
      return { data: null, error: new Error('Supabase client is not configured.') };
    }
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    return { data, error };
  },

  async getCurrentUser(): Promise<UserProfile | null> {
    if (!supabase) {
      return null;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return null;
      }

      // Fetch profile row
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

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
      return null;
    }
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    if (!supabase) {
      return { data: null, error: new Error('Supabase client is not configured.') };
    }

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

      // 1. Check if manga already exists in database
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

      // 2. If already in database, fetch its materials and return canonical Manga object
      if (existingMangaRow) {
        const { data: dbMaterials } = await supabase
          .from('manga_material')
          .select('*')
          .eq('manga_id', existingMangaRow.id);

        const materialsList = dbMaterials && dbMaterials.length > 0
          ? dbMaterials.map((m: any) => ({
              id: m.id,
              manga_id: m.manga_id,
              type: m.type,
              title: m.title,
              number: m.number,
              description: m.description,
              release_date: m.release_date,
              external_id: m.external_id,
              external_url: m.external_url
            }))
          : manga.materials;

        return {
          id: existingMangaRow.id, // Supabase UUID
          anilist_id: existingMangaRow.anilist_id,
          mangadex_id: existingMangaRow.mangadex_id,
          title: existingMangaRow.title,
          alternative_titles: existingMangaRow.alternative_titles || [],
          description: existingMangaRow.description || '',
          type: existingMangaRow.type || 'Manga',
          status: existingMangaRow.status || 'Ongoing',
          author: existingMangaRow.author || undefined,
          artist: existingMangaRow.artist || undefined,
          genres: existingMangaRow.genres || [],
          chapters: existingMangaRow.chapters,
          volumes: existingMangaRow.volumes,
          cover_url: existingMangaRow.cover_url,
          banner_url: existingMangaRow.banner_url,
          score: manga.score,
          popularity: manga.popularity,
          release_year: manga.release_year,
          source: existingMangaRow.source || 'AniList',
          materials: materialsList
        };
      }

      // 3. Insert fresh manga record into database WITHOUT id (let postgres generate UUID)
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
        console.warn('Could not insert manga row into Supabase:', error);
        return manga;
      }

      // 4. Insert materials if provided
      let canonicalMaterials = manga.materials || [];
      if (canonicalMaterials.length > 0) {
        const matsToInsert = canonicalMaterials.map((m) => ({
          manga_id: inserted.id,
          type: m.type,
          title: m.title,
          number: m.number || null,
          description: m.description || null,
          release_date: m.release_date || null,
          external_id: m.external_id || (typeof m.id === 'string' && !UUID_REGEX.test(m.id) ? m.id : null),
          external_url: m.external_url || null
        }));

        const { data: insertedMats } = await supabase
          .from('manga_material')
          .upsert(matsToInsert, { onConflict: 'manga_id,external_id' })
          .select('*');

        if (insertedMats && insertedMats.length > 0) {
          canonicalMaterials = insertedMats.map((m: any) => ({
            id: m.id, // Supabase generated UUID
            manga_id: m.manga_id,
            type: m.type,
            title: m.title,
            number: m.number,
            description: m.description,
            release_date: m.release_date,
            external_id: m.external_id,
            external_url: m.external_url
          }));
        }
      }

      return {
        ...manga,
        id: inserted.id, // Supabase generated UUID
        anilist_id: inserted.anilist_id,
        materials: canonicalMaterials
      };
    } catch (err) {
      console.warn('getOrCreateManga exception:', err);
      return manga;
    }
  },

  async ensureMangaCached(manga: Manga): Promise<string> {
    const canonical = await this.getOrCreateManga(manga);
    return canonical.id;
  },

  // ----------------------------------------------------
  // USER LIBRARY
  // ----------------------------------------------------
  async getLibrary(userId: string): Promise<UserLibraryEntry[]> {
    if (!supabase) {
      return localStorageService.getLibrary();
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

      if (error) throw error;

      const formatted: UserLibraryEntry[] = (data || []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        manga_id: row.manga_id, // Always Supabase UUID
        status: row.status as ReadingStatus,
        created_at: row.created_at,
        updated_at: row.updated_at,
        manga: row.manga
          ? {
              ...row.manga,
              id: row.manga.id, // Supabase UUID
              anilist_id: row.manga.anilist_id
            }
          : undefined
      }));

      // Cache locally for fast offline access
      localStorageService.setLibrary(formatted);
      return formatted;
    } catch (err) {
      console.warn('Supabase getLibrary error, returning cached:', err);
      return localStorageService.getLibrary();
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
        console.warn('ensureMangaCached in upsertLibraryEntry failed:', err);
        // Continue with original manga ID and try to save anyway
      }
    }

    const entry: UserLibraryEntry = {
      user_id: userId,
      manga_id: dbMangaId,
      status,
      manga: canonicalManga,
      updated_at: new Date().toISOString()
    };

    if (!supabase) {
      // Fallback: save locally only
      localStorageService.saveLibraryEntry(entry);
      return { success: true, entry };
    }

    try {
      // Save to Supabase first
      const { data, error } = await supabase
        .from('user_library')
        .upsert(
          {
            user_id: userId,
            manga_id: dbMangaId,
            status,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id,manga_id' }
        )
        .select(`
          id,
          user_id,
          manga_id,
          status,
          created_at,
          updated_at
        `)
        .single();

      if (error) {
        console.error('Error saving library entry to Supabase:', error);
        return { success: false, entry, error };
      }

      const fullEntry: UserLibraryEntry = {
        ...data,
        manga: canonicalManga
      };

      // Only update local storage after Supabase succeeds
      localStorageService.saveLibraryEntry(fullEntry);
      return { success: true, entry: fullEntry };
    } catch (err) {
      console.error('upsertLibraryEntry exception:', err);
      return { success: false, entry, error: err };
    }
  },

  async removeLibraryEntry(userId: string, mangaId: string | number): Promise<{ success: boolean; error?: any }> {
    if (!supabase) {
      // Fallback: remove locally only
      localStorageService.removeLibraryEntry(mangaId);
      return { success: true };
    }

    try {
      // Find the correct manga ID in the database
      let dbId = mangaId.toString();
      if (typeof mangaId === 'number' || !UUID_REGEX.test(dbId)) {
        const { data } = await supabase
          .from('manga')
          .select('id')
          .eq('anilist_id', mangaId)
          .maybeSingle();
        if (data?.id) dbId = data.id;
      }

      // Delete from Supabase first
      const { error } = await supabase
        .from('user_library')
        .delete()
        .eq('user_id', userId)
        .eq('manga_id', dbId);

      if (error) {
        console.error('Error removing library entry from Supabase:', error);
        return { success: false, error };
      }

      // Only update local storage after Supabase succeeds
      localStorageService.removeLibraryEntry(mangaId);
      return { success: true };
    } catch (err) {
      console.error('removeLibraryEntry exception:', err);
      return { success: false, error: err };
    }
  },

  // ----------------------------------------------------
  // READING PROGRESS
  // ----------------------------------------------------
  async getProgress(userId: string, mangaId: string | number): Promise<UserProgress | null> {
    if (!supabase) {
      return localStorageService.getProgress(mangaId);
    }

    try {
      let dbId = mangaId.toString();
      if (typeof mangaId === 'number' || !UUID_REGEX.test(dbId)) {
        const { data } = await supabase
          .from('manga')
          .select('id')
          .eq('anilist_id', mangaId)
          .maybeSingle();
        if (data?.id) dbId = data.id;
      }

      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('manga_id', dbId)
        .maybeSingle();

      if (error) throw error;
      return data || localStorageService.getProgress(mangaId);
    } catch {
      return localStorageService.getProgress(mangaId);
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

    if (!supabase) {
      // Fallback: save locally only
      localStorageService.saveProgress(record);
      return { success: true, progress: record };
    }

    try {
      // Find the correct manga ID in the database
      let dbId = mangaId.toString();
      if (typeof mangaId === 'number' || !UUID_REGEX.test(dbId)) {
        const { data } = await supabase
          .from('manga')
          .select('id')
          .eq('anilist_id', mangaId)
          .maybeSingle();
        if (data?.id) dbId = data.id;
      }

      // Save to Supabase first
      const { error } = await supabase.from('user_progress').upsert(
        {
          user_id: userId,
          manga_id: dbId,
          chapters_read: chaptersRead,
          volumes_read: volumesRead,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id,manga_id' }
      );

      if (error) {
        console.error('Error saving progress to Supabase:', error);
        return { success: false, progress: record, error };
      }

      // Only update local storage after Supabase succeeds
      localStorageService.saveProgress(record);
      return { success: true, progress: record };
    } catch (e) {
      console.error('Supabase saveProgress exception:', e);
      return { success: false, progress: record, error: e };
    }
  },

  // ----------------------------------------------------
  // MATERIAL PROGRESS
  // ----------------------------------------------------
  async getMaterialProgress(userId: string, materialId: string): Promise<UserMaterialProgress | null> {
    if (!supabase) {
      return localStorageService.getMaterialProgress(materialId);
    }

    try {
      const { data } = await supabase
        .from('user_material_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('material_id', materialId)
        .maybeSingle();

      return data || localStorageService.getMaterialProgress(materialId);
    } catch {
      return localStorageService.getMaterialProgress(materialId);
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

    if (!supabase) {
      // Fallback: save locally only
      localStorageService.saveMaterialProgress(record);
      return { success: true, data: record };
    }

    try {
      // Save to Supabase first
      const { error } = await supabase.from('user_material_progress').upsert(
        {
          user_id: userId,
          material_id: materialId,
          status,
          progress,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id,material_id' }
      );

      if (error) {
        console.error('Error saving material progress to Supabase:', error);
        return { success: false, data: record, error };
      }

      // Only update local storage after Supabase succeeds
      localStorageService.saveMaterialProgress(record);
      return { success: true, data: record };
    } catch (e) {
      console.error('Supabase saveMaterialProgress exception:', e);
      return { success: false, data: record, error: e };
    }
  },

  // ----------------------------------------------------
  // FAVORITES
  // ----------------------------------------------------
  async getFavorites(userId: string): Promise<string[]> {
    if (!supabase) {
      return localStorageService.getFavorites();
    }

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          manga_id,
          manga:manga_id (
            anilist_id
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      if (data) {
        const idList: string[] = [];
        data.forEach((row: any) => {
          if (row.manga?.anilist_id) {
            idList.push(row.manga.anilist_id.toString());
          }
          idList.push(row.manga_id.toString());
        });
        localStorageService.setFavorites(idList);
        return idList;
      }
      return localStorageService.getFavorites();
    } catch {
      return localStorageService.getFavorites();
    }
  },

  async toggleFavorite(userId: string, manga: Manga): Promise<{ success: boolean; isFavorite: boolean; error?: any }> {
    if (!supabase) {
      // Fallback: save locally only
      const localRes = localStorageService.toggleFavorite(manga.id);
      return { success: true, isFavorite: localRes };
    }

    try {
      // First, ensure manga is in the database
      const dbMangaId = await this.ensureMangaCached(manga);

      // Check current favorite status from Supabase
      const { data: existing, error: selectError } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('manga_id', dbMangaId)
        .maybeSingle();

      if (selectError) {
        console.error('Error checking favorite status:', selectError);
        return { success: false, isFavorite: false, error: selectError };
      }

      const currentlyFavorited = !!existing;
      const shouldBeFavorited = !currentlyFavorited;

      // Toggle on Supabase
      if (shouldBeFavorited) {
        const { error: insertError } = await supabase.from('favorites').insert({
          user_id: userId,
          manga_id: dbMangaId
        });

        if (insertError) {
          console.error('Error adding to favorites:', insertError);
          return { success: false, isFavorite: currentlyFavorited, error: insertError };
        }
      } else {
        const { error: deleteError } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('manga_id', dbMangaId);

        if (deleteError) {
          console.error('Error removing from favorites:', deleteError);
          return { success: false, isFavorite: currentlyFavorited, error: deleteError };
        }
      }

      // Only update local storage after Supabase succeeds
      const idStr = manga.id.toString();
      const anilistIdStr = manga.anilist_id?.toString();
      
      if (shouldBeFavorited) {
        localStorageService.setFavorites([
          ...localStorageService.getFavorites(),
          idStr,
          ...(anilistIdStr ? [anilistIdStr] : [])
        ]);
      } else {
        const current = localStorageService.getFavorites();
        localStorageService.setFavorites(
          current.filter((id) => id !== idStr && id !== anilistIdStr)
        );
      }

      return { success: true, isFavorite: shouldBeFavorited };
    } catch (e) {
      console.error('Supabase toggleFavorite exception:', e);
      return { success: false, isFavorite: false, error: e };
    }
  },

  // ----------------------------------------------------
  // NOTES
  // ----------------------------------------------------
  async getNote(userId: string, mangaId: string | number): Promise<UserNote | null> {
    if (!supabase) {
      return localStorageService.getNotes(mangaId);
    }

    try {
      let dbId = mangaId.toString();
      if (typeof mangaId === 'number' || !UUID_REGEX.test(dbId)) {
        const { data } = await supabase
          .from('manga')
          .select('id')
          .eq('anilist_id', mangaId)
          .maybeSingle();
        if (data?.id) dbId = data.id;
      }

      const { data } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .eq('manga_id', dbId)
        .maybeSingle();

      return data || localStorageService.getNotes(mangaId);
    } catch {
      return localStorageService.getNotes(mangaId);
    }
  },

  async saveNote(userId: string, mangaId: string | number, content: string): Promise<{ success: boolean; note: UserNote; error?: any }> {
    const note: UserNote = {
      user_id: userId,
      manga_id: mangaId.toString(),
      content,
      updated_at: new Date().toISOString()
    };

    if (!supabase) {
      // Fallback: save locally only
      localStorageService.saveNote(note);
      return { success: true, note };
    }

    try {
      // Find the correct manga ID in the database
      let dbId = mangaId.toString();
      if (typeof mangaId === 'number' || !UUID_REGEX.test(dbId)) {
        const { data } = await supabase
          .from('manga')
          .select('id')
          .eq('anilist_id', mangaId)
          .maybeSingle();
        if (data?.id) dbId = data.id;
      }

      // Save to Supabase first
      const { error } = await supabase.from('notes').upsert(
        {
          user_id: userId,
          manga_id: dbId,
          content,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id,manga_id' }
      );

      if (error) {
        console.error('Error saving note to Supabase:', error);
        return { success: false, note, error };
      }

      // Only update local storage after Supabase succeeds
      localStorageService.saveNote(note);
      return { success: true, note };
    } catch (e) {
      console.error('Supabase saveNote exception:', e);
      return { success: false, note, error: e };
    }
  },

  async deleteNote(userId: string, mangaId: string | number): Promise<{ success: boolean; error?: any }> {
    if (!supabase) {
      // Fallback: delete locally only
      localStorageService.deleteNote(mangaId);
      return { success: true };
    }

    try {
      // Find the correct manga ID in the database
      let dbId = mangaId.toString();
      if (typeof mangaId === 'number' || !UUID_REGEX.test(dbId)) {
        const { data } = await supabase
          .from('manga')
          .select('id')
          .eq('anilist_id', mangaId)
          .maybeSingle();
        if (data?.id) dbId = data.id;
      }

      // Delete from Supabase first
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('user_id', userId)
        .eq('manga_id', dbId);

      if (error) {
        console.error('Error deleting note from Supabase:', error);
        return { success: false, error };
      }

      // Only update local storage after Supabase succeeds
      localStorageService.deleteNote(mangaId);
      return { success: true };
    } catch (e) {
      console.error('Supabase deleteNote exception:', e);
      return { success: false, error: e };
    }
  }
};
