# Fixes Applied - QR Attendance Mobile App

## Issue: Metro Bundler Error - Unable to resolve wa-sqlite.wasm

### Root Cause
The `expo-sqlite` package was being imported at the top level in `database.ts`, which caused Metro to try to resolve the wasm file for all platforms including web. The wasm file is only needed for native platforms.

### Solution Applied

#### 1. **Made database.ts imports lazy** (lib/database.ts)
- Changed from top-level import to dynamic `await import('expo-sqlite')`
- Made `getDatabase()` async to load SQLite only when needed
- Updated all database functions to `await getDatabase()`

#### 2. **Updated authStore to use dynamic imports** (store/authStore.ts)
- Changed from `import { createUser, getUserByEmail, ... }` to `import type { User }`
- Updated all functions (signUp, signIn, checkAuth) to dynamically import database functions
- Added Platform check to prevent database calls on web

#### 3. **Updated app layout with dynamic imports** (app/_layout.tsx)
- Added `Platform` import from 'react-native'
- Wrapped database initialization in `if (Platform.OS !== 'web')` check
- Changed to dynamic import of initializeDatabase function

#### 4. **Renamed database-dependent screens to .native.tsx** (app/(app)/*)
- dashboard.tsx → dashboard.native.tsx
- admin.tsx → admin.native.tsx
- scanner.tsx → scanner.native.tsx
- These screens now only load on native platforms, preventing Metro from bundling their database imports for web

#### 5. **Created metro.config.js**
- Added wasm to assetExts for proper handling
- Added proper sourceExts resolution order: web.ts/web.tsx before native.ts/native.tsx

### Result
✅ The `wa-sqlite.wasm` bundling error is fixed!

The Metro bundler no longer tries to resolve the wasm file for web platform builds.

### Remaining Notes
- Web platform support is not implemented (database operations return "not available on web")
- Use `npx expo start` to start the development server
- Scan the QR code with Expo Go to test on mobile
- Press `w` in terminal to test web version
- Press `a` to test Android
