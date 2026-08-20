-- ==========================================================
-- Account Deletion RPC Function
-- Supabase PostgreSQL Migration
-- Enables secure, self-service account deletion for authenticated users
-- ==========================================================

-- Function to allow an authenticated user to permanently delete their account and data
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get current authenticated user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Explicitly clean up all user-specific data from public tables
  DELETE FROM public.notes WHERE user_id = current_user_id;
  DELETE FROM public.favorites WHERE user_id = current_user_id;
  DELETE FROM public.user_material_progress WHERE user_id = current_user_id;
  DELETE FROM public.user_progress WHERE user_id = current_user_id;
  DELETE FROM public.user_library WHERE user_id = current_user_id;
  DELETE FROM public.profiles WHERE id = current_user_id;

  -- 2. Delete the user from auth.users (requires security definer)
  -- Foreign key ON DELETE CASCADE will also clean up any remaining references
  DELETE FROM auth.users WHERE id = current_user_id;

  RETURN true;
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
