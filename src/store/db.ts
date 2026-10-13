// Local state: publish log, insights snapshots and account metrics in content/state.sqlite (gitignored).
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { ROOT } from '../render/server.ts';

export function openStore(file = join(ROOT, 'content/state.sqlite')) {
  mkdirSync(join(file, '..'), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      media_type TEXT,
      media_product_type TEXT,
      permalink TEXT,
      caption_chars INTEGER,
      hashtags INTEGER,
      children INTEGER,
      source TEXT NOT NULL DEFAULT 'history',   -- history | pipeline | manual
      draft_id TEXT,
      tags TEXT                                  -- JSON: pillar, series, season, episode, mechanic, template, test arm…
    );
    CREATE TABLE IF NOT EXISTS media_insights (
      media_id TEXT NOT NULL REFERENCES media(id),
      pulled_at TEXT NOT NULL,
      age_hours REAL NOT NULL,
      views INTEGER, reach INTEGER, likes INTEGER, comments INTEGER, shares INTEGER, saved INTEGER,
      total_interactions INTEGER, follows INTEGER, profile_visits INTEGER,
      avg_watch_time_ms INTEGER,
      raw TEXT,
      PRIMARY KEY (media_id, pulled_at)
    );
    CREATE TABLE IF NOT EXISTS account_daily (
      date TEXT NOT NULL, metric TEXT NOT NULL, value INTEGER, pulled_at TEXT NOT NULL,
      PRIMARY KEY (date, metric)
    );
    CREATE TABLE IF NOT EXISTS account_snapshot (
      pulled_at TEXT PRIMARY KEY, followers INTEGER, follows INTEGER, media_count INTEGER
    );
    CREATE TABLE IF NOT EXISTS publish_log (
      draft_id TEXT PRIMARY KEY,
      container_id TEXT,
      media_id TEXT,
      permalink TEXT,
      status TEXT NOT NULL,                       -- creating | created | published | failed
      scheduled_for TEXT,
      published_at TEXT,
      error TEXT,
      updated_at TEXT NOT NULL
    );
  `);
  return db;
}
