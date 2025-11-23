import { openDatabaseSync, SQLiteDatabase } from 'expo-sqlite';

export interface SQLiteAsyncDatabase {
  runAsync(sql: string, params?: any[]): Promise<any>;
  getFirstAsync(sql: string, params?: any[]): Promise<any | null>;
  getAllAsync(sql: string, params?: any[]): Promise<any[]>;
  execAsync(sql: string): Promise<void>;
  closeAsync(): Promise<void>;
}

let db: SQLiteDatabase | null = null;

export const openDatabaseAsync = (name: string = 'default.db'): SQLiteAsyncDatabase => {
  if (!db) {
    db = openDatabaseSync(name);
  }

  const runAsync = async (sql: string, params: any[] = []): Promise<any> => {
    if (!db) {
      throw new Error('Database is not initialized');
    }
    try {
      if (params.length > 0) {
        const result = (db as any).runSync(sql, params);
        return result;
      } else {
        const result = (db as any).execSync(sql);
        return result;
      }
    } catch (error) {
      throw error;
    }
  };

  const getFirstAsync = async (sql: string, params: any[] = []): Promise<any | null> => {
    if (!db) {
      throw new Error('Database is not initialized');
    }
    try {
      const result = (db as any).getFirstSync(sql, params);
      return result || null;
    } catch (error) {
      throw error;
    }
  };

  const getAllAsync = async (sql: string, params: any[] = []): Promise<any[]> => {
    if (!db) {
      throw new Error('Database is not initialized');
    }
    try {
      const result = (db as any).getAllSync(sql, params);
      return result || [];
    } catch (error) {
      throw error;
    }
  };

  const execAsync = async (sql: string): Promise<void> => {
    if (!db) {
      throw new Error('Database is not initialized');
    }
    try {
      (db as any).execSync(sql);
    } catch (error) {
      throw error;
    }
  };

  const closeAsync = async (): Promise<void> => {
    if (db) {
      db.closeSync();
      db = null;
    }
  };

  return {
    runAsync,
    getFirstAsync,
    getAllAsync,
    execAsync,
    closeAsync,
  };
};
