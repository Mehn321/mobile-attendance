import { format } from 'date-fns';
import { Platform } from 'react-native';
import { openDatabaseAsync, SQLiteAsyncDatabase } from './sqliteAsync';

let db: SQLiteAsyncDatabase | null = null;

const getDatabase = async (): Promise<SQLiteAsyncDatabase | null> => {
  if (Platform.OS === 'web') {
    return null;
  }

  if (!db) {
    db = openDatabaseAsync('attendance.db');
  }

  return db;
};

export interface Student {
  id?: number;
  student_id: string;
  full_name: string;
  department: string;
  section_id?: string;
}

export interface AttendanceRecord {
  id?: number;
  student_id: string;
  full_name: string;
  department: string;
  time_in: string;
  time_out?: string | null;
  date: string;
  section_id?: string;
  created_at?: string;
}

export interface Section {
  id?: string;
  name: string;
  created_at?: string;
}

export interface User {
  id?: number;
  email: string;
  password_hash: string;
  full_name: string;
  student_id: string;
  role: 'user' | 'admin';
  created_at?: string;
}

export const initializeDatabase = async () => {
  try {
    const database = await getDatabase();
    if (!database) {
      throw new Error('Database not available');
    }
    // Create users table
    await database.runAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        student_id TEXT UNIQUE NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create students table
    await database.runAsync(`
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        department TEXT NOT NULL,
        section_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create attendance_records table
    await database.runAsync(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT NOT NULL,
        full_name TEXT NOT NULL,
        department TEXT NOT NULL,
        time_in DATETIME NOT NULL,
        time_out DATETIME,
        date TEXT NOT NULL,
        section_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(student_id)
      );
    `);

    // Create sections table
    await database.runAsync(`
      CREATE TABLE IF NOT EXISTS sections (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create student_sessions table for tracking login/logout and cooldown
    await database.runAsync(`
      CREATE TABLE IF NOT EXISTS student_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT NOT NULL,
        section_id TEXT NOT NULL,
        login_time DATETIME NOT NULL,
        logout_time DATETIME,
        cooldown_until DATETIME,
        date TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(student_id),
        FOREIGN KEY (section_id) REFERENCES sections(id)
      );
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// User functions
export const createUser = async (user: User) => {
  try {
    const database = await getDatabase();
    if (!database) {
      throw new Error('Database not available');
    }
    const result = await database.runAsync(
      `INSERT INTO users (email, password_hash, full_name, student_id, role) 
       VALUES (?, ?, ?, ?, ?)`,
      [user.email, user.password_hash, user.full_name, user.student_id, user.role || 'user']
    );
    return result;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const getUserByEmail = async (email: string) => {
  try {
    const database = await getDatabase();
    if (!database) {
      return null;
    }
    const result = await database.getFirstAsync(
      `SELECT * FROM users WHERE email = ?`,
      [email]
    );
    return result as User | null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

export const getUserByStudentId = async (studentId: string) => {
  try {
    const database = await getDatabase();
    if (!database) {
      return null;
    }
    const result = await database.getFirstAsync(
      `SELECT * FROM users WHERE student_id = ?`,
      [studentId]
    );
    return result as User | null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

export const updateUserRole = async (userId: number, role: 'user' | 'admin') => {
  try {
    const database = await getDatabase();
    if (!database) {
      throw new Error('Database not available');
    }
    await database.runAsync(
      `UPDATE users SET role = ? WHERE id = ?`,
      [role, userId]
    );
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

// Student functions
export const createStudent = async (student: Student) => {
  try {
    const database = await getDatabase();
    if (!database) {
      throw new Error('Database not available');
    }
    const result = await database.runAsync(
      `INSERT INTO students (student_id, full_name, department, section_id) 
       VALUES (?, ?, ?, ?)`,
      [student.student_id, student.full_name, student.department, student.section_id || null]
    );
    return result;
  } catch (error) {
    console.error('Error creating student:', error);
    throw error;
  }
};

export const getStudentByStudentId = async (studentId: string) => {
  try {
    const database = await getDatabase();
    if (!database) {
      return null;
    }
    const result = await database.getFirstAsync(
      `SELECT * FROM students WHERE student_id = ?`,
      [studentId]
    );
    return result as Student | null;
  } catch (error) {
    console.error('Error getting student:', error);
    return null;
  }
};

export const getAllStudents = async () => {
  try {
    const database = await getDatabase();
    if (!database) {
      return [];
    }
    const result = await database.getAllAsync(`SELECT * FROM students ORDER BY full_name`);
    return result as Student[];
  } catch (error) {
    console.error('Error getting students:', error);
    return [];
  }
};

export const updateStudent = async (studentId: string, student: Partial<Student>) => {
  try {
    const database = await getDatabase();
    if (!database) {
      throw new Error('Database not available');
    }
    const updates: string[] = [];
    const values: any[] = [];
    
    if (student.full_name) {
      updates.push('full_name = ?');
      values.push(student.full_name);
    }
    if (student.department) {
      updates.push('department = ?');
      values.push(student.department);
    }
    if (student.section_id !== undefined) {
      updates.push('section_id = ?');
      values.push(student.section_id);
    }
    
    values.push(studentId);
    
    await database.runAsync(
      `UPDATE students SET ${updates.join(', ')} WHERE student_id = ?`,
      values
    );
  } catch (error) {
    console.error('Error updating student:', error);
    throw error;
  }
};

// Attendance functions
export const recordAttendance = async (record: AttendanceRecord) => {
  try {
    const database = await getDatabase();
    if (!database) {
      throw new Error('Database not available');
    }
    const result = await database.runAsync(
      `INSERT INTO attendance_records (student_id, full_name, department, time_in, date, section_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [record.student_id, record.full_name, record.department, record.time_in, record.date, record.section_id || null]
    );
    return result;
  } catch (error) {
    console.error('Error recording attendance:', error);
    throw error;
  }
};

export const recordTimeOut = async (recordId: number) => {
  try {
    const database = await getDatabase();
    if (!database) {
      throw new Error('Database not available');
    }
    await database.runAsync(
      `UPDATE attendance_records SET time_out = ? WHERE id = ?`,
      [new Date().toISOString(), recordId]
    );
  } catch (error) {
    console.error('Error recording time out:', error);
    throw error;
  }
};

export const getAttendanceForDate = async (date: string, sectionId?: string) => {
  try {
    const database = await getDatabase();
    if (!database) {
      return [];
    }
    
    let query = `SELECT * FROM attendance_records WHERE date = '${date}'`;
    
    if (sectionId && sectionId !== 'all') {
      query += ` AND section_id = '${sectionId}'`;
    }
    
    query += ` ORDER BY time_in DESC`;
    
    const result = await database.getAllAsync(query);
    return result as AttendanceRecord[];
  } catch (error) {
    console.error('Error getting attendance records:', error);
    return [];
  }
};

export const getAttendanceStats = async (date: string, sectionId?: string) => {
  try {
    const database = await getDatabase();
    if (!database) {
      return { totalToday: 0, presentNow: 0 };
    }
    
    let query = `SELECT COUNT(*) as count FROM attendance_records WHERE date = '${date}'`;
    
    if (sectionId && sectionId !== 'all') {
      query += ` AND section_id = '${sectionId}'`;
    }
    
    const totalToday = await database.getFirstAsync(query);
    
    let query2 = `SELECT COUNT(*) as count FROM attendance_records WHERE date = '${date}' AND time_out IS NULL`;
    
    if (sectionId && sectionId !== 'all') {
      query2 += ` AND section_id = '${sectionId}'`;
    }
    
    const presentNow = await database.getFirstAsync(query2);
    
    return {
      totalToday: (totalToday as any)?.count || 0,
      presentNow: (presentNow as any)?.count || 0,
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    return { totalToday: 0, presentNow: 0 };
  }
};

export const getLastAttendanceForStudent = async (studentId: string, date: string) => {
  try {
    const database = await getDatabase();
    if (!database) {
      return null;
    }
    const result = await database.getFirstAsync(
      `SELECT * FROM attendance_records WHERE student_id = ? AND date = ? 
       ORDER BY created_at DESC LIMIT 1`,
      [studentId, date]
    );
    return result as AttendanceRecord | null;
  } catch (error) {
    console.error('Error getting last attendance:', error);
    return null;
  }
};

export const checkRecentScan = async (studentId: string, date: string) => {
  try {
    const database = await getDatabase();
    if (!database) {
      return null;
    }
    const result = await database.getFirstAsync(
      `SELECT * FROM attendance_records WHERE student_id = ? AND date = ? 
       ORDER BY created_at DESC LIMIT 1`,
      [studentId, date]
    );
    return result as AttendanceRecord | null;
  } catch (error) {
    console.error('Error checking recent scan:', error);
    return null;
  }
};

// Section functions
export const createSection = async (section: Section) => {
  try {
    const database = await getDatabase();
    if (!database) {
      throw new Error('Database not available');
    }
    const id = `section_${Date.now()}`;
    const result = await database.runAsync(
      `INSERT INTO sections (id, name) VALUES (?, ?)`,
      [id, section.name]
    );
    return { id, ...section };
  } catch (error) {
    console.error('Error creating section:', error);
    throw error;
  }
};

export const getAllSections = async () => {
  try {
    const database = await getDatabase();
    if (!database) {
      return [];
    }
    const result = await database.getAllAsync(
      `SELECT * FROM sections ORDER BY name`
    );
    return result as Section[];
  } catch (error) {
    console.error('Error getting sections:', error);
    return [];
  }
};

export const deleteSection = async (sectionId: string) => {
  try {
    const database = await getDatabase();
    if (!database) {
      throw new Error('Database not available');
    }
    await database.runAsync(
      `DELETE FROM sections WHERE id = ?`,
      [sectionId]
    );
  } catch (error) {
    console.error('Error deleting section:', error);
    throw error;
  }
};

// Export/import functions
export const exportData = async () => {
  try {
    const database = await getDatabase();
    if (!database) {
      return null;
    }
    const students = await database.getAllAsync(`SELECT * FROM students`);
    const records = await database.getAllAsync(`SELECT * FROM attendance_records`);
    const sections = await database.getAllAsync(`SELECT * FROM sections`);
    
    return {
      students,
      records,
      sections,
      exportedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error exporting data:', error);
    return null;
  }
};

// Student session functions (for login/logout tracking and cooldown)
export const createStudentSession = async (studentId: string, sectionId: string, date: string) => {
  try {
    const database = await getDatabase();
    if (!database) {
      throw new Error('Database not available');
    }
    const result = await database.runAsync(
      `INSERT INTO student_sessions (student_id, section_id, login_time, date)
       VALUES (?, ?, ?, ?)`,
      [studentId, sectionId, new Date().toISOString(), date]
    );
    return result;
  } catch (error) {
    console.error('Error creating student session:', error);
    throw error;
  }
};

export const getActiveSession = async (studentId: string, sectionId: string, date: string) => {
  try {
    const database = await getDatabase();
    if (!database) {
      return null;
    }
    const result = await database.getFirstAsync(
      `SELECT * FROM student_sessions 
       WHERE student_id = ? AND section_id = ? AND date = ? AND logout_time IS NULL`,
      [studentId, sectionId, date]
    );
    return result as any | null;
  } catch (error) {
    console.error('Error getting active session:', error);
    return null;
  }
};

export const logoutStudentSession = async (sessionId: number, cooldownMinutes: number = 5) => {
  try {
    const database = await getDatabase();
    if (!database) {
      throw new Error('Database not available');
    }
    const logoutTime = new Date();
    const cooldownUntil = new Date(logoutTime.getTime() + cooldownMinutes * 60000);
    
    await database.runAsync(
      `UPDATE student_sessions 
       SET logout_time = ?, cooldown_until = ? 
       WHERE id = ?`,
      [logoutTime.toISOString(), cooldownUntil.toISOString(), sessionId]
    );
  } catch (error) {
    console.error('Error logging out student session:', error);
    throw error;
  }
};

export const checkCooldownStatus = async (studentId: string, sectionId: string, date: string) => {
  try {
    const database = await getDatabase();
    if (!database) {
      return null;
    }
    const result = await database.getFirstAsync(
      `SELECT cooldown_until FROM student_sessions 
       WHERE student_id = ? AND section_id = ? AND date = ? 
       AND logout_time IS NOT NULL
       ORDER BY logout_time DESC LIMIT 1`,
      [studentId, sectionId, date]
    );
    return result as any | null;
  } catch (error) {
    console.error('Error checking cooldown status:', error);
    return null;
  }
};

export const getStudentActiveSessions = async (studentId: string, date: string) => {
  try {
    const database = await getDatabase();
    if (!database) {
      return [];
    }
    const result = await database.getAllAsync(
      `SELECT * FROM student_sessions 
       WHERE student_id = ? AND date = ? AND logout_time IS NULL`,
      [studentId, date]
    );
    return result as any[];
  } catch (error) {
    console.error('Error getting student active sessions:', error);
    return [];
  }
};

export const clearAllData = async () => {
  try {
    const database = await getDatabase();
    if (!database) {
      throw new Error('Database not available');
    }
    await database.execAsync(`
      DELETE FROM student_sessions;
      DELETE FROM attendance_records;
      DELETE FROM students;
      DELETE FROM sections;
      DELETE FROM users;
    `);
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
};
