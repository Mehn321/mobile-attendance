# QR Attendance Mobile App - Expo Go

A complete offline-first mobile attendance system built with React Native and Expo that mirrors all features from the web application.

## Features

### ✅ Fully Implemented Features

#### Authentication
- **Login System**: Email + Password with QR code verification (2FA)
- **Signup System**: Create new accounts with QR code verification
- **Persistent Sessions**: Auto-login using AsyncStorage
- **Role-based Access**: Admin and User roles

#### QR Scanning
- **Real-time QR Scanner**: Built-in camera QR code scanning
- **Student ID Recognition**: Parses QR data (Name, Student ID, Department)
- **Smart Attendance Recording**:
  - Auto Time-In on first scan
  - Auto Time-Out on second scan
  - 1-minute scan cooldown to prevent duplicate entries
- **Instant Feedback**: Success/error notifications with student details

#### Attendance Dashboard
- **Real-time Statistics**:
  - Total scans today
  - Currently present students
- **Attendance Records Table**:
  - Student name, ID, department
  - Check-in and check-out times
  - Status badges (Present/Completed)
- **Filtering Options**:
  - Filter by section
  - Filter by date
- **Section Selection**: View attendance for specific sections

#### Admin Panel
- **Section Management**:
  - Create new sections
  - View all sections
  - Delete sections
  - Duplicate prevention
- **Access Control**: Admin-only access with role verification

### 🗄️ Offline Storage

**SQLite Database** (`expo-sqlite`):
- Users table: Email, password hash, student ID, role
- Students table: Student details, section assignment
- Attendance records: Check-in/out times, dates, student info
- Sections table: Section management

### 🔒 Security

- **Password Hashing**: SHA256 hashing using `expo-crypto`
- **Student ID Verification**: 2FA using QR code scan
- **Local Storage**: All data stored locally on device
- **Async Storage**: Secure session persistence

## Tech Stack

### Frontend
- **React Native** with Expo
- **Expo Router**: Navigation and routing
- **React Native Gesture Handler**: Smooth interactions
- **Expo Camera**: QR code scanning
- **expo-sqlite**: Offline database

### State Management
- **Zustand**: Lightweight auth state
- **Expo SQLite**: Data persistence

### UI & Styling
- **React Native StyleSheet**: Native styling
- **Expo Vector Icons**: Icon library

### Utilities
- **date-fns**: Date formatting and manipulation
- **zod**: Input validation
- **expo-crypto**: Secure password hashing

## Installation & Setup

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`

### Install Dependencies
```bash
cd mobile-attendance
npm install
```

### Run the App

#### Using Expo Go (Recommended for development)
```bash
npm start
# Then scan QR code with Expo Go app
```

#### Android
```bash
npm run android
```

#### iOS (requires macOS)
```bash
npm run ios
```

#### Web
```bash
npm run web
```

## Project Structure

```
mobile-attendance/
├── app/
│   ├── _layout.tsx              # Root layout
│   ├── index.tsx                # Splash/Loading screen
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx            # Login screen
│   │   └── signup.tsx           # Signup screen
│   └── (app)/
│       ├── _layout.tsx
│       ├── scanner.tsx          # QR scanner screen
│       ├── dashboard.tsx        # Attendance dashboard
│       └── admin.tsx            # Admin panel
├── lib/
│   ├── database.ts              # SQLite operations
│   └── validation.ts            # Input validation schemas
├── store/
│   └── authStore.ts             # Zustand auth store
├── package.json
└── app.json
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  student_id TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Students Table
```sql
CREATE TABLE students (
  id INTEGER PRIMARY KEY,
  student_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  department TEXT NOT NULL,
  section_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Attendance Records Table
```sql
CREATE TABLE attendance_records (
  id INTEGER PRIMARY KEY,
  student_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  department TEXT NOT NULL,
  time_in DATETIME NOT NULL,
  time_out DATETIME,
  date TEXT NOT NULL,
  section_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Sections Table
```sql
CREATE TABLE sections (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

## Key Components

### AuthStore (Zustand)
Manages user authentication state and operations:
- `signUp()`: Register new user with QR verification
- `signIn()`: Login with email, password, and QR verification
- `signOut()`: Logout user
- `checkAuth()`: Restore session from AsyncStorage

### Database Operations
All CRUD operations for:
- Users, Students, Attendance Records, Sections
- Real-time statistics
- Data export/import

### Validation Schemas (Zod)
Input validation for:
- Email, Password, Names
- Student IDs, Section names
- QR data parsing

## Usage Guide

### For Students/Users

1. **Sign Up**
   - Enter full name, email, password
   - Scan student ID QR code
   - Account created with 2FA enabled

2. **Login**
   - Enter email and password
   - Scan student ID QR code for verification
   - Access scanner or dashboard

3. **Attendance**
   - Open Scanner tab
   - First scan = Check-in
   - Second scan = Check-out
   - View history in Dashboard

4. **Dashboard**
   - View today's attendance stats
   - Filter by section and date
   - See attendance records with times

### For Administrators

1. **Access Admin Panel**
   - Navigate from Dashboard
   - Must have admin role

2. **Manage Sections**
   - Create new sections
   - Delete existing sections
   - Organize student groups

3. **Monitor Attendance**
   - Access full dashboard features
   - View all sections' attendance

## Offline Functionality

- ✅ All data stored locally using SQLite
- ✅ No internet connection required
- ✅ Real-time QR scanning
- ✅ Instant notifications
- ✅ Full app functionality offline
- ✅ Data persists between sessions

## File Size Optimization

- Minimal dependencies
- Optimized React Native components
- Efficient SQLite queries
- Small bundle size (~50-60MB with Expo)

## Performance

- Fast QR scanning (10 FPS)
- Instant database operations
- Smooth animations
- Low memory footprint
- Efficient screen rendering

## Troubleshooting

### Camera Not Working
- Check camera permissions in device settings
- Restart app
- Clear cache: `npm start -- -c`

### Database Issues
- Clear app data from device settings
- App will reinitialize database on restart

### Login Issues
- Ensure QR code matches student ID
- Check password matches signup password
- Clear AsyncStorage if session corrupt

## Future Enhancements

- [ ] Biometric authentication (fingerprint/face)
- [ ] Data sync with cloud when online
- [ ] PDF report generation
- [ ] Photo ID verification
- [ ] Geolocation tracking
- [ ] Push notifications
- [ ] Offline data export

## Permissions Required

- **Camera**: QR code scanning
- **Storage**: SQLite database (automatic)

## Contributing

When making changes:
1. Test all auth flows
2. Verify database operations
3. Test offline functionality
4. Check performance with large datasets

## License

MIT

## Support

For issues or questions, refer to:
- Expo Documentation: https://docs.expo.dev
- React Native Docs: https://reactnative.dev
- Expo Router Guide: https://docs.expo.dev/routing/introduction

---

**Note**: This mobile app is a complete replication of the web application features, optimized for offline use with SQLite storage and native mobile experience.
