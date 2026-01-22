import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

// In production (Vercel), use /tmp directory which is writable
// Vercel sets VERCEL=1 or we can check if we're in a lambda environment
const isProduction = process.env.VERCEL === "1" || process.env.AWS_LAMBDA_FUNCTION_NAME;
const dbDir = isProduction 
  ? "/tmp" 
  : path.join(process.cwd(), "data");

// Only create directory if it doesn't exist and we have write permissions
try {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
} catch (error) {
  // In serverless, we might not have permissions to create dirs outside /tmp
  console.warn(`Could not create db directory at ${dbDir}:`, error);
}

const dbPath = path.join(dbDir, "job-cache.sqlite");

const globalForDb = globalThis as unknown as { sqliteDb?: Database.Database };
const db = globalForDb.sqliteDb ?? new Database(dbPath);

if (!globalForDb.sqliteDb) {
  // Use DELETE mode instead of WAL to avoid locking issues in serverless
  db.pragma("journal_mode = DELETE");
  db.pragma("busy_timeout = 5000"); // Wait up to 5 seconds if database is locked
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      headline TEXT,
      employer_name TEXT,
      location TEXT,
      logo_url TEXT,
      webpage_url TEXT,
      published_at TEXT,
      data_json TEXT NOT NULL,
      fetched_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS swipes (
      job_id TEXT PRIMARY KEY,
      direction TEXT NOT NULL CHECK (direction IN ('left', 'right')),
      swiped_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS search_cache (
      query_hash TEXT PRIMARY KEY,
      query TEXT NOT NULL,
      job_ids TEXT NOT NULL,
      total INTEGER NOT NULL,
      fetched_at INTEGER NOT NULL
    );
  `);

  globalForDb.sqliteDb = db;
}

export default db;
