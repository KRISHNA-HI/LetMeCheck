-- ==========================================================
-- LetMeCheck TMDB Catalog Ingestion & pg_cron Scheduling
-- Supabase PostgreSQL Migration (Phase 5 / Ingestion Engine)
-- ==========================================================

-- 1. Enable pg_cron and pg_net extensions if supported by the environment
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- 2. Ensure public.content table has unique constraints / indexes for TMDB identity
-- Allows idempotent ON CONFLICT (tmdb_id, content_type) upserting
ALTER TABLE IF EXISTS public.content 
  ADD COLUMN IF NOT EXISTS tmdb_id INTEGER;

-- Create an index and unique constraint on (tmdb_id, content_type) where tmdb_id is not null
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_tmdb_identity 
  ON public.content (tmdb_id, content_type) 
  WHERE tmdb_id IS NOT NULL;

-- Also ensure external_ids JSONB has a gin index for fast lookup
CREATE INDEX IF NOT EXISTS idx_content_external_ids ON public.content USING gin (external_ids);
CREATE INDEX IF NOT EXISTS idx_content_popularity ON public.content (popularity DESC);
CREATE INDEX IF NOT EXISTS idx_content_release_date ON public.content (release_date DESC);
CREATE INDEX IF NOT EXISTS idx_content_type_status ON public.content (content_type, status);

-- 3. Ingestion Configuration Table
CREATE TABLE IF NOT EXISTS public.ingestion_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Seed default configuration
INSERT INTO public.ingestion_config (key, value, description)
VALUES 
  ('daily_ingestion_limit', '100'::jsonb, 'Default maximum number of titles processed per scheduled ingestion run'),
  ('target_regional_counts', '{
    "hollywood": 500,
    "bollywood": 300,
    "tollywood": 300,
    "kollywood": 300,
    "mollywood": 300,
    "sandalwood": 300,
    "korean_cinema": 300,
    "japanese_cinema": 300,
    "anime_industry": 500
  }'::jsonb, 'Target catalog size per regional industry before shifting priority to new releases')
ON CONFLICT (key) DO NOTHING;

-- 4. Ingestion Runs History Table
CREATE TABLE IF NOT EXISTS public.ingestion_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id TEXT UNIQUE NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    finished_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'RUNNING' CHECK (status IN ('RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED')),
    titles_scanned INTEGER DEFAULT 0,
    titles_inserted INTEGER DEFAULT 0,
    titles_updated INTEGER DEFAULT 0,
    duplicates_skipped INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    tmdb_pages_processed INTEGER DEFAULT 0,
    categories_processed TEXT[] DEFAULT '{}',
    error_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ingestion_runs_created ON public.ingestion_runs (created_at DESC);

-- 5. Ingestion Progress Cursors Table
CREATE TABLE IF NOT EXISTS public.ingestion_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL, -- 'korean_cinema', 'mollywood', 'tollywood', etc.
    media_type TEXT NOT NULL, -- 'movie', 'tv'
    ingestion_strategy TEXT NOT NULL DEFAULT 'historical', -- 'historical', 'new_releases', 'popular'
    current_page INTEGER NOT NULL DEFAULT 1,
    last_successful_page INTEGER NOT NULL DEFAULT 0,
    total_pages_available INTEGER DEFAULT 1,
    last_run_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'IDLE' CHECK (status IN ('IDLE', 'RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED')),
    retry_count INTEGER DEFAULT 0,
    last_error TEXT,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_category_type_strategy UNIQUE (category, media_type, ingestion_strategy)
);

-- Seed initial ingestion progress tracking for all 8 major regional categories
INSERT INTO public.ingestion_progress (category, media_type, ingestion_strategy, current_page, last_successful_page)
VALUES
  ('mollywood', 'movie', 'historical', 1, 0),
  ('mollywood', 'tv', 'historical', 1, 0),
  ('korean_cinema', 'movie', 'historical', 1, 0),
  ('korean_cinema', 'tv', 'historical', 1, 0),
  ('sandalwood', 'movie', 'historical', 1, 0),
  ('sandalwood', 'tv', 'historical', 1, 0),
  ('tollywood', 'movie', 'historical', 1, 0),
  ('tollywood', 'tv', 'historical', 1, 0),
  ('kollywood', 'movie', 'historical', 1, 0),
  ('kollywood', 'tv', 'historical', 1, 0),
  ('bollywood', 'movie', 'historical', 1, 0),
  ('bollywood', 'tv', 'historical', 1, 0),
  ('japanese_cinema', 'movie', 'historical', 1, 0),
  ('japanese_cinema', 'tv', 'historical', 1, 0),
  ('hollywood', 'movie', 'historical', 1, 0),
  ('hollywood', 'tv', 'historical', 1, 0),
  ('anime_industry', 'tv', 'historical', 1, 0),
  ('anime_industry', 'movie', 'historical', 1, 0)
ON CONFLICT (category, media_type, ingestion_strategy) DO NOTHING;

-- 6. Row Level Security for Ingestion Tables
ALTER TABLE public.ingestion_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_config ENABLE ROW LEVEL SECURITY;

-- Allow public read of non-sensitive ingestion stats, restrict write to service role / admin
CREATE POLICY "Allow public read on ingestion_runs" 
  ON public.ingestion_runs FOR SELECT USING (true);

CREATE POLICY "Allow public read on ingestion_progress" 
  ON public.ingestion_progress FOR SELECT USING (true);

CREATE POLICY "Allow public read on ingestion_config" 
  ON public.ingestion_config FOR SELECT USING (true);

-- 7. SQL Helper Function to Get Regional Catalog Distribution
CREATE OR REPLACE FUNCTION public.get_regional_catalog_counts()
RETURNS TABLE (
  industry_code TEXT,
  industry_name TEXT,
  total_count BIGINT,
  movie_count BIGINT,
  tv_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    i.code AS industry_code,
    i.name AS industry_name,
    COUNT(DISTINCT c.id) AS total_count,
    COUNT(DISTINCT CASE WHEN c.content_type = 'movie' THEN c.id END) AS movie_count,
    COUNT(DISTINCT CASE WHEN c.content_type IN ('series', 'tv_series', 'web_series', 'drama', 'anime') THEN c.id END) AS tv_count
  FROM public.industries i
  LEFT JOIN public.content_industries ci ON ci.industry_id = i.id
  LEFT JOIN public.content c ON c.id = ci.content_id
  GROUP BY i.code, i.name
  ORDER BY total_count DESC;
$$;

-- 8. Register pg_cron Scheduled Job
-- Automatically runs nightly at 02:00 AM IST (20:30 UTC: '30 20 * * *')
-- Safely wrapped in DO block so it won't crash if pg_cron is not loaded in local test runners
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Unschedule existing if any to avoid duplication
    PERFORM cron.unschedule('nightly-letmecheck-tmdb-ingestion');
    
    -- Schedule nightly execution at 02:00 AM IST (20:30 UTC)
    PERFORM cron.schedule(
      'nightly-letmecheck-tmdb-ingestion',
      '30 20 * * *',
      $cron$
        SELECT net.http_post(
          url := COALESCE(current_setting('app.settings.edge_function_url', true), 'https://' || current_setting('request.headers', true)::json->>'host' || '/functions/v1/ingest-tmdb-content'),
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || COALESCE(current_setting('app.settings.service_role_key', true), '')
          ),
          body := jsonb_build_object('trigger', 'pg_cron_nightly')
        );
      $cron$
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron registration skipped or not supported in this environment: %', SQLERRM;
END $$;
