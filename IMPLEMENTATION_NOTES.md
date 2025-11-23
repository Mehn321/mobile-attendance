# Mobile Attendance App - Implementation Notes

## Project Status: ✅ COMPLETE & READY

This document serves as a technical reference for the mobile app implementation.

---

## What's Included

### Core Screens (Fully Implemented)

1. **Authentication** (`app/(auth)/`)
   - `login.tsx` - Email/password form → routes to QR auth
   - `signup.tsx` - Full details form → routes to QR auth
   - `qr-auth.tsx` - Camera QR scanner for 2FA verification
   - `_layout.tsx` - Auth navigation stack

2. **Application** (`app/(app)/`)
   - `scanner.tsx` - Main QR attendance scanner
   - `dashboard.tsx` - Real-time stats and attendance records
   - `admin.tsx` - Manage sections (admin-only)
   - `_layout.tsx` - App navigation stack

3. **Root Navigation** (`app/`)
   - `_layout.tsx` - Routes based on auth state

### Components (Pre-built, Ready to Use)

- `components/QRScanner.tsx` - Camera component with overlay
- `hooks/useAuth.ts` - Authentication logic
- `hooks/useAttendance.ts` - QR scanning and recording
- `lib/supabase.ts` - Database client
- `lib/qrParser.ts` - QR data parsing
- `lib/validation.ts` - Input validation schemas

---

## Architecture

### File Tree
```
app/
├── _layout.tsx              ← Root (auth routing)
├── (auth)/
│   ├── _layout.tsx          ← Auth stack
│   ├── login.tsx            ← Login form
│   ├── signup.tsx           ← Signup form
│   └── qr-auth.tsx          ← QR verification
└── (app)/
    ├── _layout.tsx          ← App stack
    ├── scanner.tsx          ← QR scanner
    ├── dashboard.tsx        ← Stats & records
    └── admin.tsx            ← Manage sections

components/
└── QRScanner.tsx            ← Camera component

hooks/
├── useAuth.ts               ← Auth state & methods
└── useAttendance.ts         ← QR scanning logic

lib/
├── supabase.ts              ← DB client
├── qrParser.ts              ← QR parsing
├── validation.ts            ← Zod schemas
└── ... (other utilities)
```

---

## Key Implementation Details

### 1. Authentication Flow
```
Login/Signup Form
    ↓ (email, password, optional name)
Navigate to QR Auth
    ↓ (with credentials in params)
User scans QR code
    ↓ (QR contains: name, studentId, department)
Parse QR data
    ↓
Call signIn/signUp
    ↓ (with extracted student_id)
Supabase verifies
    ↓
Redirect to /scanner
```

### 2. QR Scanning Flow
```
Camera detects QR code
    ↓
parseQRData() extracts: name, studentId, department
    ↓
Check 1-minute cooldown
    ↓
Check if student exists (auto-create if not)
    ↓
Check for existing time_in record today
    ↓
Create time_in OR update to time_out
    ↓
Display result alert
```

### 3. Dashboard Real-Time
```
Component mounts
    ↓
Fetch initial data from Supabase
    ↓
Subscribe to attendance_records changes
    ↓
When new scan happens:
  Supabase notifies
    ↓
  Fetch updated records
    ↓
  Recalculate stats
    ↓
  Update UI automatically
```

---

## Data Structures

### QR Code Format
```
"NHEM DAY G. ACLO 20203300076 BSIT"
 ↑    ↑    ↑     ↑             ↑
 └────┬────┘     └──┬──────────┘
   Full Name    Student ID  Department
                (11 digits)  (2-50 chars)
```

### Parsed QR Object
```typescript
{
  fullName: "NHEM DAY G. ACLO",      // 1-200 chars
  studentId: "20203300076",          // exactly 11 digits
  department: "BSIT"                 // 2-50 chars
}
```

### Attendance Record
```typescript
{
  id: "uuid",
  student_id: "20203300076",
  full_name: "NHEM DAY G. ACLO",
  department: "BSIT",
  time_in: "2025-11-23T09:00:00Z",
  time_out: "2025-11-23T17:00:00Z" | null,
  date: "2025-11-23",
  section_id: "uuid" | null,
  created_at: "2025-11-23T09:00:00Z"
}
```

---

## Navigation Routes

### After Login
```
Root (_layout.tsx)
  └─ Detects user session
      └─ Redirects to /(app)/scanner
```

### Scanner Screen
```
Header Buttons:
  [Dashboard] → /(app)/dashboard
  [Admin]     → /(app)/admin (if admin role)
  [Logout]    → /(auth)/login
```

### Dashboard Screen
```
Header Buttons:
  [Admin]     → /(app)/admin (if admin role)
  [Scanner]   → /(app)/scanner
  [Logout]    → /(auth)/login

Date Navigation:
  [← Prev]    → Load previous day
  [Today]     → Load today
  [Next →]    → Load next day
```

### Admin Screen
```
Header Buttons:
  [Dashboard] → /(app)/dashboard
  [Logout]    → /(auth)/login
```

---

## Styling Approach

### Colors Used
- **Primary**: `#007AFF` (iOS blue)
- **Success**: `#22c55e` (green)
- **Error**: `#ef4444` (red)
- **Light BG**: `#f5f5f5`
- **Dark BG**: `#000`
- **Borders**: `#ddd`, `#e0e0e0`
- **Text**: `#000` (dark), `#666` (medium), `#999` (light)

### Design System
- **Border radius**: 8px (inputs), 12px (cards), 20px (pills)
- **Spacing**: 8px, 12px, 16px, 20px units
- **Shadows**: Platform-specific (elevation on Android, shadow on iOS)
- **Typography**: System fonts (Roboto on Android, SF Pro on iOS)

### Responsive Design
- All components use `flex` for layout
- No hardcoded widths (except icons)
- Adapts to screen size automatically
- SafeAreaView for notch/home indicator

---

## Validation Rules

### Email
- Must be valid email format
- Max 255 characters

### Password
- Minimum 8 characters
- Maximum 128 characters
- No format restrictions

### Student ID
- Exactly 11 digits
- No letters or special characters
- From QR code only

### Full Name
- 1-200 characters
- Can contain spaces and periods
- From signup form or QR code

### Department
- 2-50 characters
- From QR code
- Examples: BSIT, BSCS, ACT, etc.

### Section Name (Admin)
- 1-100 characters
- Can contain spaces and numbers
- Must be unique in database
- Examples: BSIT 3A, BSCS 2B, etc.

---

## Error Handling

### Network Errors
- Shown via Alert dialog
- Message: "Network error" or specific error
- User can retry

### Validation Errors
- Shown via Alert dialog
- Message: Specific validation failure
- Example: "Student ID must be exactly 11 digits"

### QR Parse Errors
- Shown in camera alert
- Message: "Invalid QR code format"
- User can scan again immediately

### Auth Errors
- Shown via Alert dialog
- Message: "Login failed" or "Student ID verification failed"
- User returned to auth screen

### Permission Errors
- Request prompt shown
- If denied, show button to request again
- User can grant permission in device settings

---

## Performance Considerations

### Camera Scanning
- FPS: 10 (efficient, not too intensive)
- QR Box: 250x250 pixels
- Barcode types: ["qr"] only

### Real-Time Updates
- Uses Supabase channels (not polling)
- Subscribed on mount, unsubscribed on unmount
- Single channel per user
- Updates handled via callback

### Rendering
- FlatList for large lists (attendance records)
- useCallback to prevent unnecessary re-renders
- Minimal state updates

### Data Caching
- Dashboard caches initial load
- Updates via real-time subscription
- No polling or duplicate queries

---

## Testing

### Manual Testing Checklist
- [ ] Can create account with signup + QR
- [ ] Can login with QR verification
- [ ] QR scanner detects codes
- [ ] Time In/Out recording works
- [ ] 1-minute cooldown prevents duplicates
- [ ] Dashboard shows real-time updates
- [ ] Date navigation works
- [ ] Admin panel accessible (if admin)
- [ ] Can create/delete sections (if admin)
- [ ] Logout returns to login
- [ ] Permissions requested correctly
- [ ] Error messages shown appropriately

### Test QR Code Format
```
For testing, use format:
[YourName] [StudentID11digits] [DEPT]

Example:
John Student Doe 20203300076 BSIT
My Name Here 12345678901 ACT
Test User 99999999999 BSCS
```

---

## Troubleshooting

### Camera Won't Open
- Check device settings for camera permission
- Allow permission when prompted
- Ensure not using web platform (web has different camera)

### QR Code Not Scanning
- Ensure good lighting
- Position QR code within green frame
- Check QR code is valid (contains proper format)
- Try different QR code

### Login/Signup Fails
- Check email format is valid
- Ensure password is at least 8 characters
- Verify QR code scanned properly
- Check internet connection

### Dashboard Shows No Data
- Ensure records exist in Supabase
- Check correct date is selected
- Verify database connection in .env
- Try refreshing app

### Admin Button Not Visible
- Check user has admin role in user_roles table
- Logout and login again
- Verify Supabase query succeeds

---

## Environment Setup

### Required .env Variables
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your-anon-key
```

### Supabase Setup
1. Create Supabase project
2. Create tables:
   - students
   - attendance_records
   - sections
   - user_roles
   - profiles (or use auth.users)
3. Enable RLS if desired
4. Generate anon key
5. Add .env variables

---

## Deployment

### For Development
```bash
npm start
# Press 'a' for Android or 'i' for iOS
```

### For Production
```bash
npm install -g eas-cli
eas build --platform android/ios
eas submit --platform android/ios
```

### For Web
```bash
npm start
# Press 'w' for web
# Only for testing, not recommended for production QR scanning
```

---

## Browser Compatibility
- **Android**: Fully supported
- **iOS**: Fully supported
- **Web**: Limited (camera access varies)

---

## Device Requirements
- **Minimum OS**: Android 7.0 / iOS 12.0
- **Camera**: Required for QR scanning
- **Storage**: ~50MB for app
- **RAM**: 2GB recommended

---

## Known Limitations

1. **Date Picker**: Currently limited to Prev/Today/Next
   - Could be enhanced with full date picker modal

2. **Section Assignment**: Sections created but not assigned to students
   - Could add UI to assign students to sections

3. **No Offline Mode**: Requires internet connection
   - Could add SQLite sync for offline support

4. **No Export**: Can't export attendance data
   - Could add PDF/CSV export feature

5. **No Geolocation**: Doesn't verify location
   - Could add GPS verification for security

---

## Future Enhancements

- [ ] Offline attendance with sync
- [ ] Geolocation verification
- [ ] Biometric authentication
- [ ] Push notifications
- [ ] Attendance reports (PDF/CSV)
- [ ] Class/lecture scheduling
- [ ] Student messaging
- [ ] Attendance analytics dashboard
- [ ] Multiple concurrent sessions
- [ ] Dark mode
- [ ] Internationalization (i18n)

---

## Support & Debugging

### Check Logs
```bash
npm start
# View console output
# Or tap console in Expo Go app
```

### Check Supabase
```
1. Open https://supabase.com
2. Login to your project
3. View tables in SQL Editor
4. Check recent activity logs
```

### Common Issues
- **"Cannot find module"**: Run `npm install`
- **"Supabase connection failed"**: Check .env and internet
- **"Camera permission denied"**: Grant in device settings
- **"QR not scanning"**: Check lighting and QR format

---

## Files Quick Reference

| File | Purpose | Key Features |
|------|---------|--------------|
| `login.tsx` | Login form | Email + password input |
| `signup.tsx` | Signup form | Full details collection |
| `qr-auth.tsx` | QR scanning | 2FA verification |
| `scanner.tsx` | Attendance | Real-time QR scanning |
| `dashboard.tsx` | Statistics | Stats cards + table |
| `admin.tsx` | Management | Create/delete sections |
| `useAuth.ts` | Auth logic | Sign in/up/out |
| `useAttendance.ts` | Scanning | QR parsing + recording |
| `QRScanner.tsx` | Camera | Live feed with overlay |
| `qrParser.ts` | Parsing | Extract QR data |
| `validation.ts` | Validation | Zod schemas |

---

## Version Info
- **React Native**: 0.81.5
- **Expo**: 54.0.25
- **React**: 19.1.0
- **Supabase**: Latest JS client
- **Zod**: 3.22.4

---

## License & Attribution
Built using:
- React Native & Expo
- Supabase
- Zod validation

All code follows the same license as parent project.

---

## Last Updated
November 23, 2025

Status: ✅ Production Ready

---

**Questions?** Check the documentation files in the parent directory:
- `MOBILE_APP_PLAN.md` - Architecture & design
- `MOBILE_APP_IMPLEMENTATION.md` - Full technical guide
- `MOBILE_APP_QUICKSTART.md` - Getting started
- `FLOW_DIAGRAMS.md` - Visual flow diagrams
