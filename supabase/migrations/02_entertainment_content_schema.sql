-- ==========================================================
-- LetMeCheck Entertainment Platform Schema
-- Supabase PostgreSQL Migration (Phase 1 Foundation)
-- Multi-Industry Entertainment: Movies, TV Series, Web Series,
-- Anime, Japanese/Korean Drama, Hollywood, Indian Regional Cinemas (Bollywood, Tollywood, Kollywood, Mollywood, Sandalwood, Bengali, Marathi, etc.)
-- ==========================================================

-- 1. Enable UUID Extension if not already active
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Content Types Master Table
CREATE TABLE IF NOT EXISTS public.content_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL, -- 'movie', 'tv_series', 'web_series', 'anime', 'drama', 'manga', 'manhwa'
    name TEXT NOT NULL,
    description TEXT,
    is_visual BOOLEAN DEFAULT true,
    is_literary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Countries Master Table
CREATE TABLE IF NOT EXISTS public.countries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL, -- ISO Alpha-2/Alpha-3 code (e.g. 'IN', 'US', 'JP', 'KR', 'GB', 'FR')
    name TEXT NOT NULL,
    flag_emoji TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Languages Master Table
CREATE TABLE IF NOT EXISTS public.languages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL, -- ISO 639-1 code (e.g. 'en', 'hi', 'te', 'ta', 'ml', 'kn', 'bn', 'mr', 'ja', 'ko', 'zh')
    name TEXT NOT NULL,
    native_name TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Industries & Regional Film Hubs Master Table
CREATE TABLE IF NOT EXISTS public.industries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL, -- 'hollywood', 'bollywood', 'tollywood', 'kollywood', 'mollywood', 'sandalwood', 'bengali_cinema', 'marathi_cinema', 'japanese_cinema', 'korean_cinema', 'chinese_cinema', 'anime_industry'
    name TEXT NOT NULL,
    region TEXT,
    country_code TEXT REFERENCES public.countries(code) ON DELETE SET NULL,
    primary_language_code TEXT REFERENCES public.languages(code) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Genres Master Table
CREATE TABLE IF NOT EXISTS public.genres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Franchises Master Table
CREATE TABLE IF NOT EXISTS public.franchises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    original_name TEXT,
    slug TEXT UNIQUE,
    description TEXT,
    poster_url TEXT,
    backdrop_url TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. Core Content Table (Universal Catalog Entity)
CREATE TABLE IF NOT EXISTS public.content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_type TEXT NOT NULL REFERENCES public.content_types(code) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    original_title TEXT,
    alternative_titles TEXT[] DEFAULT '{}',
    overview TEXT,
    poster_url TEXT,
    backdrop_url TEXT,
    trailer_url TEXT,
    release_date DATE,
    year INTEGER,
    runtime INTEGER, -- In minutes (for movie / typical episode length)
    status TEXT DEFAULT 'Released', -- 'Planned', 'In Production', 'Ongoing', 'Completed', 'Released', 'Cancelled', 'Hiatus'
    age_rating TEXT, -- 'U', 'U/A 13+', 'U/A 16+', 'A', 'PG-13', 'R', 'TV-MA'
    rating_average NUMERIC(3,1) DEFAULT 0.0,
    rating_count INTEGER DEFAULT 0,
    popularity NUMERIC(10,2) DEFAULT 0.0,
    source TEXT DEFAULT 'Supabase',
    external_ids JSONB DEFAULT '{}'::jsonb, -- e.g. {"tmdb_id": 123, "imdb_id": "tt1234", "anilist_id": 5678}
    franchise_id UUID REFERENCES public.franchises(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. Content Genres Junction Table
CREATE TABLE IF NOT EXISTS public.content_genres (
    content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    genre_id UUID NOT NULL REFERENCES public.genres(id) ON DELETE CASCADE,
    PRIMARY KEY (content_id, genre_id)
);

-- 10. Content Languages Junction Table
CREATE TABLE IF NOT EXISTS public.content_languages (
    content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    language_id UUID NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    PRIMARY KEY (content_id, language_id)
);

-- 11. Content Countries Junction Table
CREATE TABLE IF NOT EXISTS public.content_countries (
    content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    country_id UUID NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
    PRIMARY KEY (content_id, country_id)
);

-- 12. Content Industries Junction Table
CREATE TABLE IF NOT EXISTS public.content_industries (
    content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    industry_id UUID NOT NULL REFERENCES public.industries(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    PRIMARY KEY (content_id, industry_id)
);

-- 13. Franchise Items Table
CREATE TABLE IF NOT EXISTS public.franchise_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    franchise_id UUID NOT NULL REFERENCES public.franchises(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    order_in_franchise INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_franchise_content UNIQUE (franchise_id, content_id)
);

-- 14. Watch Orders Master Table
CREATE TABLE IF NOT EXISTS public.watch_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    franchise_id UUID NOT NULL REFERENCES public.franchises(id) ON DELETE CASCADE,
    title TEXT NOT NULL, -- e.g. "Release Order", "Chronological Timeline", "Recommended Order"
    order_type TEXT NOT NULL DEFAULT 'release_order', -- 'release_order', 'chronological', 'recommended', 'custom'
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 15. Watch Order Items Table
CREATE TABLE IF NOT EXISTS public.watch_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    watch_order_id UUID NOT NULL REFERENCES public.watch_orders(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    order_number INTEGER NOT NULL,
    title TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_watch_order_step UNIQUE (watch_order_id, order_number)
);

-- 16. Content Relationships Table (Prequels, Sequels, Spin-offs, Adaptations, Remakes)
CREATE TABLE IF NOT EXISTS public.content_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    target_content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL, -- 'prequel', 'sequel', 'spin_off', 'adaptation', 'remake', 'side_story', 'alternative_version', 'shared_universe'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_content_relationship UNIQUE (source_content_id, target_content_id, relationship_type)
);

-- 17. Seasons Table (For TV Series, Web Series, Anime, Dramas)
CREATE TABLE IF NOT EXISTS public.seasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    season_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    overview TEXT,
    poster_url TEXT,
    air_date DATE,
    episode_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_content_season UNIQUE (content_id, season_number)
);

-- 18. Episodes Table
CREATE TABLE IF NOT EXISTS public.episodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    episode_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    overview TEXT,
    still_url TEXT,
    air_date DATE,
    runtime INTEGER, -- In minutes
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_season_episode UNIQUE (season_id, episode_number)
);

-- ==========================================================
-- BACKWARD-COMPATIBLE USER PERSISTENCE EXPANSIONS
-- ==========================================================

-- Allow user_library to reference content_id (while preserving existing manga_id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_library' AND column_name = 'content_id'
    ) THEN
        ALTER TABLE public.user_library ADD COLUMN content_id UUID REFERENCES public.content(id) ON DELETE CASCADE;
        ALTER TABLE public.user_library ALTER COLUMN manga_id DROP NOT NULL;
    END IF;
END $$;

-- Allow favorites to reference content_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'favorites' AND column_name = 'content_id'
    ) THEN
        ALTER TABLE public.favorites ADD COLUMN content_id UUID REFERENCES public.content(id) ON DELETE CASCADE;
        ALTER TABLE public.favorites ALTER COLUMN manga_id DROP NOT NULL;
    END IF;
END $$;

-- Allow user_progress to track entertainment seasons, episodes, runtime, and content_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_progress' AND column_name = 'content_id'
    ) THEN
        ALTER TABLE public.user_progress ADD COLUMN content_id UUID REFERENCES public.content(id) ON DELETE CASCADE;
        ALTER TABLE public.user_progress ADD COLUMN season_number INTEGER DEFAULT 1;
        ALTER TABLE public.user_progress ADD COLUMN episode_number INTEGER DEFAULT 0;
        ALTER TABLE public.user_progress ADD COLUMN progress_seconds INTEGER DEFAULT 0;
        ALTER TABLE public.user_progress ADD COLUMN is_completed BOOLEAN DEFAULT false;
        ALTER TABLE public.user_progress ALTER COLUMN manga_id DROP NOT NULL;
    END IF;
END $$;

-- Allow notes to reference content_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'notes' AND column_name = 'content_id'
    ) THEN
        ALTER TABLE public.notes ADD COLUMN content_id UUID REFERENCES public.content(id) ON DELETE CASCADE;
        ALTER TABLE public.notes ALTER COLUMN manga_id DROP NOT NULL;
    END IF;
END $$;

-- ==========================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_content_content_type ON public.content(content_type);
CREATE INDEX IF NOT EXISTS idx_content_title ON public.content(title);
CREATE INDEX IF NOT EXISTS idx_content_year ON public.content(year);
CREATE INDEX IF NOT EXISTS idx_content_popularity ON public.content(popularity DESC);
CREATE INDEX IF NOT EXISTS idx_content_rating ON public.content(rating_average DESC);
CREATE INDEX IF NOT EXISTS idx_content_franchise_id ON public.content(franchise_id);
CREATE INDEX IF NOT EXISTS idx_content_genres_genre ON public.content_genres(genre_id);
CREATE INDEX IF NOT EXISTS idx_content_languages_lang ON public.content_languages(language_id);
CREATE INDEX IF NOT EXISTS idx_content_countries_country ON public.content_countries(country_id);
CREATE INDEX IF NOT EXISTS idx_content_industries_ind ON public.content_industries(industry_id);
CREATE INDEX IF NOT EXISTS idx_watch_orders_franchise ON public.watch_orders(franchise_id);
CREATE INDEX IF NOT EXISTS idx_watch_order_items_order ON public.watch_order_items(watch_order_id, order_number);
CREATE INDEX IF NOT EXISTS idx_seasons_content ON public.seasons(content_id);
CREATE INDEX IF NOT EXISTS idx_episodes_season ON public.episodes(season_id);
CREATE INDEX IF NOT EXISTS idx_content_rel_source ON public.content_relationships(source_content_id);
CREATE INDEX IF NOT EXISTS idx_content_rel_target ON public.content_relationships(target_content_id);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================
ALTER TABLE public.content_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.franchises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.franchise_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

-- Public Read-Only for Reference & Catalog Tables
CREATE POLICY "Public read content_types" ON public.content_types FOR SELECT USING (true);
CREATE POLICY "Public read countries" ON public.countries FOR SELECT USING (true);
CREATE POLICY "Public read languages" ON public.languages FOR SELECT USING (true);
CREATE POLICY "Public read industries" ON public.industries FOR SELECT USING (true);
CREATE POLICY "Public read genres" ON public.genres FOR SELECT USING (true);
CREATE POLICY "Public read franchises" ON public.franchises FOR SELECT USING (true);
CREATE POLICY "Public read content" ON public.content FOR SELECT USING (true);
CREATE POLICY "Public read content_genres" ON public.content_genres FOR SELECT USING (true);
CREATE POLICY "Public read content_languages" ON public.content_languages FOR SELECT USING (true);
CREATE POLICY "Public read content_countries" ON public.content_countries FOR SELECT USING (true);
CREATE POLICY "Public read content_industries" ON public.content_industries FOR SELECT USING (true);
CREATE POLICY "Public read franchise_items" ON public.franchise_items FOR SELECT USING (true);
CREATE POLICY "Public read watch_orders" ON public.watch_orders FOR SELECT USING (true);
CREATE POLICY "Public read watch_order_items" ON public.watch_order_items FOR SELECT USING (true);
CREATE POLICY "Public read content_relationships" ON public.content_relationships FOR SELECT USING (true);
CREATE POLICY "Public read seasons" ON public.seasons FOR SELECT USING (true);
CREATE POLICY "Public read episodes" ON public.episodes FOR SELECT USING (true);

-- Authenticated modifications for catalog caching/admin
CREATE POLICY "Auth users insert content" ON public.content FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth users update content" ON public.content FOR UPDATE USING (auth.role() = 'authenticated');
