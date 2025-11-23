# Setup and Run Guide

## ✅ What's Already Done

Your project is **95% complete**. All you need is to add your Supabase credentials!

- ✅ All dependencies installed
- ✅ Metro bundler fixed
- ✅ All screens created (Auth, Scanner, Dashboard, Admin)
- ✅ All hooks and logic implemented
- ✅ Realtime database subscriptions ready
- ✅ Navigation configured

## 🔧 Step 1: Get Your Supabase Credentials

Your credentials are in the web app's `.env` file.

**From**: `scan-attendance/.env`
**Copy these values:**
```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_KEY=...
```

## 📝 Step 2: Create .env File

1. Create a new file: `mobile-attendance/.env`
2. Copy your credentials into it:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ Important**: Never commit `.env` file to git!

## 🚀 Step 3: Start the Dev Server

```bash
# Navigate to project
cd mobile-attendance

# Start expo
npm start
```

You'll see output like:
```
Starting project at /path/to/mobile-attendance
✓ Expo Go loaded
› Metro waiting on exp://192.168.100.92:8081
```

## 📱 Step 4: Open App

### Option A: Android Emulator
```
Press 'a' in terminal
```
Android emulator will open with your app.

### Option B: iOS Simulator
```
Press 'i' in terminal
```
iOS simulator will launch.

### Option C: Physical Phone
1. Install **Expo Go** app from App Store or Google Play
2. In terminal, scan the QR code with your camera
3. Opens in Expo Go app

## 🧪 Step 5: Test the App

### Test 1: Signup
1. Click "Create Account"
2. Enter:
   - Full Name: `Test User`
   - Email: `test@example.com`
   - Password: `password123` (min 8 chars)
3. Click "Continue to QR Scan"
4. **Scan this QR code**: `Test User 20203300076 BSIT`
   - Or use your own: `NAME 11DIGITID DEPARTMENT`
5. Account created! ✅

### Test 2: Login
1. Back on login screen
2. Enter:
   - Email: `test@example.com`
   - Password: `password123`
3. Click "Continue to QR Scan"
4. Scan: `Test User 20203300076 BSIT`
5. Logged in! ✅

### Test 3: Scanner
1. Scan QR code first time → Time In recorded ✅
2. Scan same QR code again (after 60 seconds) → Time Out recorded ✅
3. See success message with student info

### Test 4: Dashboard
1. From scanner, tap 📊 button
2. See:
   - 3 stat cards (Total Scans, Currently Present, Total Students)
   - Today's attendance records
3. Try:
   - ← Prev and Next → to change date
   - Section dropdown to filter by section
4. Tap 📷 to go back to scanner
5. Realtime updates: Scan on web app, see update on mobile!

### Test 5: Admin (if admin user)
1. From dashboard, tap ⚙️ button (only shows if you're admin)
2. Create new section: `BSIT 3A`
3. See section in list
4. Delete section (with confirmation)
5. See list update

## 🔄 Restart Instructions

If you make changes to code:

```bash
# Press 'r' in terminal to reload
# or
# Press 's' to switch platforms
# or
# Press 'q' to quit and restart
```

## 🐛 Troubleshooting

### Problem: Camera Permission Denied
**Solution**: Grant camera permission when prompted

### Problem: QR Code Not Scanning
**Solution**: Make sure QR code has exactly this format:
```
NAME 11DIGITID DEPARTMENT
Example: John Doe 20203300001 BSIT
```

### Problem: "Cannot find module" errors
**Solution**: Delete node_modules and reinstall:
```bash
rm -rf node_modules
npm install
npm start
```

### Problem: Supabase Connection Failed
**Solution**: Check .env file has correct values:
```bash
cat .env
```

### Problem: Port 8081 already in use
**Solution**: 
```bash
# Terminal will ask, press 'y' to use 8082 instead
```

## 📊 Project Structure

```
mobile-attendance/
├── app/                    # Screens & navigation
│   ├── (auth)/            # Login/Signup screens
│   ├── (app)/             # Scanner/Dashboard/Admin screens
│   └── _layout.tsx        # Root navigation
├── components/            # Reusable components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities (supabase, validation, parsing)
├── .env                   # ← ADD THIS FILE (Supabase credentials)
└── package.json           # Dependencies
```

## 🎯 Key Files to Know

- **lib/supabase.ts** - Supabase client
- **hooks/useAuth.ts** - Login/signup logic
- **hooks/useAttendance.ts** - Scanner logic
- **hooks/useAttendanceData.ts** - Dashboard data
- **app/(auth)/login.tsx** - Login screen
- **app/(auth)/signup.tsx** - Signup screen
- **app/(app)/scanner.tsx** - Scanner screen
- **app/(app)/dashboard.tsx** - Dashboard screen
- **app/(app)/admin.tsx** - Admin panel

## 📞 If You Get Stuck

1. **Check .env exists** with correct credentials
2. **Check internet connection** (Supabase needs network)
3. **Check QR format** is correct: `NAME 11DIGITS DEPARTMENT`
4. **Clear cache**: `npm start -- --clear`
5. **Restart phone/emulator** sometimes helps
6. **Check logs**: Look for red errors in terminal

## ✨ You're All Set!

Once you see "Metro waiting on exp://..." in terminal, the app is ready to test!

```bash
Press 'a' or 'i' or scan QR with Expo Go to open the app
```

**Happy testing! 🎉**
