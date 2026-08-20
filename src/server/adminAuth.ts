import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

export const ADMIN_EMAIL = 'krishnavasudev099@gmail.com';

/**
 * Normalizes email address by trimming whitespace and converting to lowercase.
 */
export function normalizeEmail(email: string | null | undefined): string {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

/**
 * Validates whether an email string matches the designated administrator email.
 */
export function isUserAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return normalizeEmail(email) === normalizeEmail(ADMIN_EMAIL);
}

/**
 * Server-side Express middleware for strict admin-only routes.
 *
 * Resolves the authenticated user from the Supabase auth JWT token
 * and verifies that user.email === 'krishnavasudev099@gmail.com'.
 * Internal services can also authenticate via INGESTION_SECRET or SUPABASE_SERVICE_ROLE_KEY.
 *
 * Unauthorized or non-admin requests receive HTTP 403 Forbidden.
 */
export async function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || '';
  const customHeader = (req.headers['x-ingestion-secret'] as string) || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.substring(7).trim()
    : authHeader.trim() || customHeader;

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
  const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  const ingestionSecret = process.env.INGESTION_SECRET || '';

  // 1. Allow internal automated background cron / server tasks with valid secrets
  if (token && (
    (ingestionSecret && token === ingestionSecret) ||
    (supabaseServiceKey && token === supabaseServiceKey)
  )) {
    return next();
  }

  // 2. Reject if no token is provided
  if (!token) {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Missing administrator authorization token.'
    });
  }

  // 3. Verify user authentication token via Supabase Auth
  if (!supabaseUrl) {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Supabase configuration unavailable.'
    });
  }

  try {
    const authClient = createClient(supabaseUrl, supabaseAnonKey || supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: { user }, error } = await authClient.auth.getUser(token);

    if (error || !user) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Invalid or expired authentication session.'
      });
    }

    if (!isUserAdmin(user.email)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Administrator privileges required for this resource.'
      });
    }

    // Attach verified user to request
    (req as any).adminUser = user;
    return next();
  } catch (err: any) {
    console.error('Admin authorization verification error:', err);
    return res.status(403).json({
      success: false,
      error: 'Access denied. Authorization check failed.'
    });
  }
}
