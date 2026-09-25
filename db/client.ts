import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import * as schema from './schema';

let _expoDb: SQLiteDatabase | null = null;
let _db: ReturnType<typeof drizzle> | null = null;
let _initError: Error | null = null;

export function getDbInitError(): Error | null {
  return _initError;
}

try {
  _expoDb = openDatabaseSync('catatan.db', { enableChangeListener: true });
  _expoDb.execSync('PRAGMA foreign_keys = ON;');
  _db = drizzle(_expoDb, { schema });
} catch (err: unknown) {
  _initError = err instanceof Error ? err : new Error(String(err));
  console.warn('SQLite initialization warning:', _initError.message);
}

export const expoDb = _expoDb as SQLiteDatabase;

// Proxy fallback so imports in other files do not crash at module evaluation time
export const db = (_db ||
  new Proxy({} as ReturnType<typeof drizzle>, {
    get(_target, prop) {
      if (_initError) {
        throw _initError;
      }
      throw new Error(`Database not initialized (accessing ${String(prop)})`);
    },
  })) as ReturnType<typeof drizzle>;
