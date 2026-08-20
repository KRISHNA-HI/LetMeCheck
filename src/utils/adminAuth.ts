/**
 * Centralized Administrator Access Control & Authorization for LetMeCheck
 * 
 * Strict single-admin account: krishnavasudev099@gmail.com
 * Case-insensitive, whitespace-safe email normalization.
 */

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
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return normalizeEmail(email) === normalizeEmail(ADMIN_EMAIL);
}

/**
 * Validates whether a user profile/object represents the authenticated administrator.
 */
export function isUserAdmin(user: { email?: string | null } | null | undefined): boolean {
  if (!user || !user.email) return false;
  return isAdminEmail(user.email);
}
