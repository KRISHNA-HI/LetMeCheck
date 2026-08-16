-- ==========================================================
-- MangaShelf / LetMeCheck Database Schema
-- Supabase PostgreSQL Migration
-- Free tier optimized, strict Row Level Security (RLS)
-- ==========================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (Extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Manga Metadata Table (Public read-only catalog cache)
CREATE TABLE IF NOT EXISTS public.manga (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    anilist_id INTEGER UNIQUE,
    mangadex_id TEXT UNIQUE,
    title TEXT NOT NULL,
    alternative_titles TEXT[] DEFAULT '{}',
    description TEXT,
    type TEXT DEFAULT 'Manga', -- 'Manga', 'Manhwa', 'Manhua', 'Light Novel'
    status TEXT DEFAULT 'Ongoing', -- 'Ongoing', 'Completed', 'Hiatus', 'Cancelled'
    author TEXT,
    artist TEXT,
    genres TEXT[] DEFAULT '{}',
    chapters INTEGER,
    volumes INTEGER,
    cover_url TEXT,
    banner_url TEXT,
    source TEXT DEFAULT 'AniList',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Manga Material Table (Volumes, Anime adaptations, Movies, OVAs, Specials, One-shots)
CREATE TABLE IF NOT EXISTS public.manga_material (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    manga_id UUID NOT NULL REFERENCES public.manga(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'Manga', 'Manhwa', 'Manhua', 'Light Novel', 'Anime', 'Movie', 'OVA', 'Special', 'One-shot', 'Other'
    title TEXT NOT NULL,
    number TEXT, -- e.g., "Vol. 1", "Season 1", "Movie 1"
    description TEXT,
    release_date TEXT,
    external_id TEXT,
    external_url TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_manga_external_material UNIQUE (manga_id, external_id)
);

-- 5. User Library Table (Tracks Reading/Pending/Completed/On Hold/Dropped)
CREATE TABLE IF NOT EXISTS public.user_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    manga_id UUID NOT NULL REFERENCES public.manga(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('Reading', 'Pending', 'Completed', 'On Hold', 'Dropped')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_user_manga_library UNIQUE (user_id, manga_id)
);

-- 6. User Reading Progress Table (Chapter and volume tracking)
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    manga_id UUID NOT NULL REFERENCES public.manga(id) ON DELETE CASCADE,
    chapters_read INTEGER DEFAULT 0 NOT NULL,
    volumes_read INTEGER DEFAULT 0 NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_user_manga_progress UNIQUE (user_id, manga_id)
);

-- 7. User Material Progress Table (Per-material granular status)
CREATE TABLE IF NOT EXISTS public.user_material_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES public.manga_material(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed')),
    progress INTEGER DEFAULT 0 NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_user_material_progress UNIQUE (user_id, material_id)
);

-- 8. User Favorites Table
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    manga_id UUID NOT NULL REFERENCES public.manga(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_user_manga_favorite UNIQUE (user_id, manga_id)
);

-- 9. User Notes Table (Private reading notes per manga)
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    manga_id UUID NOT NULL REFERENCES public.manga(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_user_manga_note UNIQUE (user_id, manga_id)
);

-- ==========================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_manga_anilist_id ON public.manga(anilist_id);
CREATE INDEX IF NOT EXISTS idx_manga_type ON public.manga(type);
CREATE INDEX IF NOT EXISTS idx_manga_status ON public.manga(status);
CREATE INDEX IF NOT EXISTS idx_manga_material_manga_id ON public.manga_material(manga_id);
CREATE INDEX IF NOT EXISTS idx_manga_material_external_id ON public.manga_material(external_id);
CREATE INDEX IF NOT EXISTS idx_user_library_user_id ON public.user_library(user_id);
CREATE INDEX IF NOT EXISTS idx_user_library_status ON public.user_library(status);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_material_progress_user_id ON public.user_material_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manga ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manga_material ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_material_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- 1. Profiles RLS
CREATE POLICY "Public profiles are viewable by everyone" 
    ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Manga Metadata RLS (Public read-only for anonymous users, authenticated insert/update)
CREATE POLICY "Manga catalog is viewable by everyone" 
    ON public.manga FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert cached manga" 
    ON public.manga FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update cached manga" 
    ON public.manga FOR UPDATE USING (auth.role() = 'authenticated');

-- 3. Manga Material RLS (Public read-only for anonymous users, authenticated insert/update)
CREATE POLICY "Manga materials are viewable by everyone" 
    ON public.manga_material FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert materials" 
    ON public.manga_material FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update materials" 
    ON public.manga_material FOR UPDATE USING (auth.role() = 'authenticated');

-- 4. User Library RLS (Strict user isolation)
CREATE POLICY "Users can view own library" 
    ON public.user_library FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into own library" 
    ON public.user_library FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own library" 
    ON public.user_library FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from own library" 
    ON public.user_library FOR DELETE USING (auth.uid() = user_id);

-- 5. User Progress RLS
CREATE POLICY "Users can view own progress" 
    ON public.user_progress FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" 
    ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" 
    ON public.user_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress" 
    ON public.user_progress FOR DELETE USING (auth.uid() = user_id);

-- 6. User Material Progress RLS
CREATE POLICY "Users can view own material progress" 
    ON public.user_material_progress FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own material progress" 
    ON public.user_material_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own material progress" 
    ON public.user_material_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own material progress" 
    ON public.user_material_progress FOR DELETE USING (auth.uid() = user_id);

-- 7. Favorites RLS
CREATE POLICY "Users can view own favorites" 
    ON public.favorites FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" 
    ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" 
    ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- 8. Notes RLS
CREATE POLICY "Users can view own notes" 
    ON public.notes FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes" 
    ON public.notes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" 
    ON public.notes FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" 
    ON public.notes FOR DELETE USING (auth.uid() = user_id);

-- ==========================================================
-- AUTO CREATE PROFILE ON SIGNUP TRIGGER
-- ==========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
