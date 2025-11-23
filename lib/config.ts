/**
 * App Configuration
 * All app-wide settings and constants
 */

export const APP_CONFIG = {
  // App metadata
  name: 'QR Attendance',
  version: '1.0.0',
  
  // Feature flags
  enableOfflineMode: true,
  enablePushNotifications: false,
  enableDataSync: false, // For future cloud sync
  
  // Scan settings
  scanCooldownSeconds: 60, // Minimum seconds between scans for same student
  qrScanFPS: 10, // Frames per second for QR scanner
  qrBoxSize: { width: 250, height: 250 },
  
  // Database
  databaseName: 'attendance.db',
  
  // UI/UX
  theme: {
    primaryColor: '#007AFF',
    successColor: '#34C759',
    errorColor: '#FF3B30',
    warningColor: '#FF9500',
    backgroundColor: '#f5f5f5',
    cardBackground: '#ffffff',
  },
  
  // Validation rules
  validation: {
    minNameLength: 2,
    maxNameLength: 100,
    minStudentIdLength: 5,
    maxStudentIdLength: 20,
    minSectionNameLength: 2,
    maxSectionNameLength: 50,
    minPasswordLength: 6,
  },
  
  // Features
  features: {
    qrScanning: true,
    dashboardView: true,
    adminPanel: true,
    sectionManagement: true,
    attendanceHistory: true,
    userAuthentication: true,
    twoFactorAuth: true, // QR-based 2FA
  },
};

/**
 * QR Code Data Format
 * Expected format: "FULL NAME STUDENT_ID DEPARTMENT"
 * Example: "NHEM DAY G. ACLO 20203300076 BSIT"
 */
export const QR_CODE_FORMAT = {
  description: 'Full Name Student ID Department',
  example: 'NHEM DAY G. ACLO 20203300076 BSIT',
  parsingRule: 'Last value is department, second-to-last is student ID, rest is name',
};

/**
 * Storage Keys for AsyncStorage
 */
export const STORAGE_KEYS = {
  userEmail: 'user_email',
  authToken: 'auth_token',
  lastSync: 'last_sync',
};

/**
 * API Endpoints (for future use if sync is implemented)
 */
export const API_ENDPOINTS = {
  baseUrl: 'https://api.example.com',
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
  },
  sync: {
    attendance: '/sync/attendance',
    students: '/sync/students',
  },
};

export default APP_CONFIG;
