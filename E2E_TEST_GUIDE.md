# End-to-End Data Persistence Test Guide

## Overview
This guide provides step-by-step instructions to verify that the data persistence fix is working correctly. The test checks that user data (Favorites, Library, reading progress, notes) persists through sign-out/sign-in cycles.

## Prerequisites
- Development server running on http://localhost:3001/LetMeCheck
- Browser with Developer Tools (F12 or right-click → Inspect)
- Valid Supabase configuration

## Test Steps

### STEP 1: Create a Test Account
1. Navigate to http://localhost:3001/LetMeCheck/register
2. Fill in:
   - Username: `testuser-[today's date]` (e.g., `testuser-20250816`)
   - Email: `test-[timestamp]@example.com` (e.g., `test-1723819200@example.com`)
   - Password: Any strong password (e.g., `TestPass123!@#`)
3. Click "Register"
4. **Expected Result**: Account created (may need email confirmation in some cases)

### STEP 2: Sign In
1. Navigate to http://localhost:3001/LetMeCheck/login
2. Enter the same email and password
3. Click "Sign In"
4. **Expected Result**: Redirected to home/discover page

### STEP 3: Verify Login Success in Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for messages indicating successful authentication
4. **What to Look For**:
   - No error messages like "Auth error" or "Failed to authenticate"
   - User data should be logged if auth hook logs anything

### STEP 4: Navigate to Discover & Add to Favorites
1. Click on "Discover" in the nav (or go to http://localhost:3001/LetMeCheck/discover)
2. Find any manga and hover over its card
3. Click the heart icon (♡) in the top-right of the card
4. The heart should fill in (♥) indicating it's been added
5. **Note down the manga title for later verification**

### STEP 5: Verify Supabase Operation Succeeded
1. Keep Developer Tools open, go to Console tab
2. Look for any "console.error" messages mentioning:
   - "Toggle favorite exception"
   - "Failed to"
   - "error" (case-insensitive)
3. **Expected Result**: NO error messages
4. Go to Network tab and look for requests to `supabase.co`
5. **Expected Result**: Should see a successful 200/201 response

### STEP 6: Navigate to Favorites & Verify It's There
1. Click "Favorites" in the nav (or go to http://localhost:3001/LetMeCheck/favorites)
2. Verify the manga you just added is displayed
3. **Expected Result**: The manga card appears in Favorites

### STEP 7: Refresh Page & Verify Persistence
1. Press F5 or Ctrl+R to refresh
2. The page should reload and show the Favorites page
3. **Expected Result**: The same manga is still visible in Favorites
4. **Verification**: If it disappeared, data persistence to localStorage is working but not to Supabase
5. Open Console and check for errors

### STEP 8: Sign Out
1. Click your username/profile button in the top-right corner
2. Click "Sign Out" or "Logout"
3. **Expected Result**: Redirected to login or home page

### STEP 9: Sign Back In
1. Navigate to http://localhost:3001/LetMeCheck/login
2. Enter your email and password
3. Click "Sign In"
4. **Expected Result**: Successfully signed in

### STEP 10: Navigate to Favorites & Verify Data Loaded from Supabase
1. Go to Favorites page
2. The manga you added should be there
3. **This is the KEY TEST**: If the manga appears, it was loaded from Supabase database
4. **Expected Result**: The favorite manga is visible
5. **If it's missing**: 
   - Open Console and check for errors
   - Look for messages about failed Supabase queries
   - Check Network tab for failed requests

### STEP 11: Test Removal Persistence
1. While on Favorites page, hover over the manga
2. Click the filled heart (♥) to remove it
3. The heart should become empty (♡)
4. **Expected Result**: Manga disappears from Favorites list

### STEP 12: Refresh & Verify Removal Persists
1. Press F5 to refresh
2. **Expected Result**: Favorites list is empty (0 manga shown)
3. If still showing the manga, removal didn't persist to Supabase

### STEP 13: Final Verification - Sign Out & Back In
1. Sign out (click profile → Sign Out)
2. Sign back in with same credentials
3. Go to Favorites
4. **Expected Result**: Favorites list is empty
5. **This confirms**: Removal was saved to Supabase and loaded correctly

## What to Check in Browser Console

### ✓ GOOD SIGNS (Data Persistence Working):
```
[LOG] Supabase client initialized
[LOG] User authenticated: [user-id]
[NETWORK] 200 POST /rest/v1/favorites
[NETWORK] 200 GET /rest/v1/favorites
```

### ✗ BAD SIGNS (Data Persistence Failing):
```
[ERROR] Toggle favorite exception: ...
[ERROR] Failed to: ...
[ERROR] RLS policy violation
[NETWORK] 401/403 ...
[ERROR] undefined is not a function
```

### Network Tab - Look For:
- **POST** requests to `supabase.co` with `favorites` endpoint → Should be 200/201
- **GET** requests to `supabase.co` with `favorites` endpoint → Should be 200
- **DELETE** requests to remove favorites → Should be 200/204
- Any request returning 401/403 indicates auth/RLS issue

## Expected Test Results

### Full Success (All Data Persistence Working):
- ✓ Add to Favorites → appears immediately
- ✓ Refresh → favorite persists
- ✓ Sign out & sign in → favorite still there (loaded from DB)
- ✓ Remove favorite → disappears immediately
- ✓ Refresh → removal persists
- ✓ Sign out & sign in → still empty (removal saved to DB)
- ✓ NO error messages in console

### Partial Success (Some Issues):
- Favorites appear but disappear after refresh → Only saving to localStorage, not Supabase
- Favorites appear after refresh but not after re-login → Data not loading from Supabase
- Error messages in console about Supabase → Check RLS policies or network

### Complete Failure:
- Favorites don't appear even on same page → Issue with UI state or data not saving at all
- Errors on every operation → Authentication or Supabase configuration issue

## Troubleshooting

### If Favorites Disappear After Refresh
**Problem**: Data not persisting to Supabase
**Solution**:
1. Check browser console for "Toggle favorite exception" errors
2. Check Network tab for failed Supabase requests
3. Verify Supabase credentials are correct in `.env.local`
4. Check that RLS policies allow the user to insert/select from favorites table

### If Favorites Disappear After Sign Out & Sign In
**Problem**: Data loading from Supabase failing
**Solution**:
1. Sign in again and check console for "Failed to load favorites" messages
2. Go to Network tab and check GET /rest/v1/favorites response
3. If getting 401/403, RLS policy may be rejecting the query
4. If getting empty [] result, check Supabase favorites table directly

### If See Errors Like "RLS policy violation"
**Problem**: Row Level Security (RLS) policies blocking operations
**Solution**:
1. Check that user is properly authenticated (signed in)
2. Verify RLS policies in Supabase dashboard: Database → favorites table → RLS
3. Policy should allow authenticated users to select/insert/delete their own favorites

### If See "undefined is not a function" Errors
**Problem**: Code issue or missing data
**Solution**:
1. Check browser console for full error stack
2. Refresh page and try again
3. Check that manga data is loading properly from Discover page

## Report Template

After running the test, record results:

```
TEST RUN - [Date/Time]
Tester: [Name]

Test Account: [email used]
Manga Added: [manga title]

RESULTS:
Step 1 (Register): ✓ ✗
Step 2 (Sign In): ✓ ✗
Step 4 (Add Favorite): ✓ ✗
Step 6 (Verify in Favorites): ✓ ✗
Step 7 (Refresh - persist): ✓ ✗
Step 9 (Re-login): ✓ ✗
Step 10 (Load from DB): ✓ ✗
Step 11 (Remove): ✓ ✗
Step 12 (Removal persists): ✓ ✗
Step 13 (Final verify): ✓ ✗

ERRORS FOUND:
[List any console errors]

NETWORK ISSUES:
[List any failed Supabase requests]

CONCLUSION:
[ ] Data persistence fully working
[ ] Partially working with issues
[ ] Not working
```

## Summary

**Data persistence is confirmed working when**:
1. Favorites/Library data saves to Supabase without errors
2. Data is visible after page refresh
3. Data loads from Supabase when user signs back in
4. Removals persist and update in Supabase

**If any step fails**, check the browser console for specific error messages and report them for debugging.
