import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

// Keep the SQLite file outside of Next's build output.
const dbDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "job-cache.sqlite");

const globalForDb = globalThis as unknown as { sqliteDb?: Database.Database };
const db = globalForDb.sqliteDb ?? new Database(dbPath);

if (!globalForDb.sqliteDb) {
  db.pragma("journal_mode = WAL");
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
