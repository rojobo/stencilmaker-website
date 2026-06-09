-- D1 migration 0001 — newsletter lead storage.
-- Applied with:  npx wrangler d1 migrations apply stencilmaker-leads --remote
-- (use --local first to test against the wrangler dev database).
--
-- This is the schema src/pages/api/lead.ts writes to:
--   INSERT OR IGNORE INTO leads (email, source, referrer, ip, user_agent, created_at)
-- Artist applications are NOT stored here — they go to KV (LEADS_KV); see lead.ts.

CREATE TABLE IF NOT EXISTS leads (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT    NOT NULL UNIQUE,
  source      TEXT,
  referrer    TEXT,
  ip          TEXT,
  user_agent  TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
