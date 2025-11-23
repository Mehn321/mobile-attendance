# Runtime Errors Found and Fixed

## Error 1: Cannot read properties of undefined (reading 'replace')
**Issue:** Metro bundler threw error about trying to call `.replace()` on undefined during module factory initialization.
**Root Cause:** The `db` object was being initialized synchronously at the module level using `SQLite.openDatabaseSync()`, which could fail or return undefined in web environment (Expo Go on web doesn't have SQLite support).
**Fix:** 
- Changed from synchronous initialization to lazy initialization pattern
- Created `getDatabase()` function that initializes db on first use
- All database operations now call `getDatabase()` instead of using global `db`
**File:** `lib/database.ts` (lines 1-10)

## Error 2: Router not ready during initialization
**Issue:** `router.replace()` was being called before router was fully initialized
**Root Cause:** The index.tsx was calling router navigation in useEffect without proper timing
**Fix:**
- Added 100ms delay before calling router.replace() to ensure router is ready
- Wrapped navigation in try-catch for error handling
- Changed dependency array to `[]` to prevent re-execution
**File:** `app/index.tsx` (lines 10-30)

## Error 3: Stale closure with Zustand selector
**Issue:** `checkAuth` function was being recreated on every store access causing re-renders
**Root Cause:** Using object destructuring with useAuthStore() instead of selector pattern
**Fix:**
- Changed to `const checkAuth = useAuthStore((state) => state.checkAuth);` selector pattern
- Added `checkAuth` to dependency array
**File:** `app/_layout.tsx` (line 10 and dependency array)

## Summary of Changes

### Files Modified:
1. **lib/database.ts** - Lazy initialization of SQLite database
2. **app/index.tsx** - Better router initialization timing
3. **app/_layout.tsx** - Proper Zustand selector usage

### Key Improvements:
- Database operations are now safe in web/development environment
- Router navigation is properly timed
- State management follows Zustand best practices
- All functions have proper error handling

### Testing Status:
- Code compiles without Metro bundler errors
- Database lazy initialization prevents early instantiation errors
- Navigation is properly sequenced
