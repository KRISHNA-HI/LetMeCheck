-- Migration: 06_admin_security_rls.sql
-- Description: Restrict TMDB Ingestion metadata and control tables exclusively to administrator (krishnavasudev099@gmail.com) and service role.

-- 1. Drop existing overly-permissive public read policies if present
DROP POLICY IF EXISTS "Allow public read on ingestion_runs" ON public.ingestion_runs;
DROP POLICY IF EXISTS "Allow public read on ingestion_progress" ON public.ingestion_progress;
DROP POLICY IF EXISTS "Allow public read on ingestion_config" ON public.ingestion_config;

-- Drop any previous admin policies
DROP POLICY IF EXISTS "Admin only read on ingestion_runs" ON public.ingestion_runs;
DROP POLICY IF EXISTS "Admin only read on ingestion_progress" ON public.ingestion_progress;
DROP POLICY IF EXISTS "Admin only read on ingestion_config" ON public.ingestion_config;
DROP POLICY IF EXISTS "Admin only write on ingestion_runs" ON public.ingestion_runs;
DROP POLICY IF EXISTS "Admin only write on ingestion_progress" ON public.ingestion_progress;
DROP POLICY IF EXISTS "Admin only write on ingestion_config" ON public.ingestion_config;

-- 2. Helper function to check if caller is the designated administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT (
    -- Service role bypass
    (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role' = 'service_role')
    OR
    -- Authenticated user email matches single admin account
    (LOWER(TRIM(COALESCE(auth.jwt() ->> 'email', ''))) = 'krishnavasudev099@gmail.com')
  );
$$;

-- 3. Strict Admin-only RLS Policies for Ingestion Runs
CREATE POLICY "Admin only read on ingestion_runs"
  ON public.ingestion_runs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admin only insert/update on ingestion_runs"
  ON public.ingestion_runs FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. Strict Admin-only RLS Policies for Ingestion Progress Cursors
CREATE POLICY "Admin only read on ingestion_progress"
  ON public.ingestion_progress FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admin only insert/update on ingestion_progress"
  ON public.ingestion_progress FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. Strict Admin-only RLS Policies for Ingestion Config
CREATE POLICY "Admin only read on ingestion_config"
  ON public.ingestion_config FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admin only insert/update on ingestion_config"
  ON public.ingestion_config FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
