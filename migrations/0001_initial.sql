CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT DEFAULT (datetime('now')),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  postcode TEXT NOT NULL,
  details TEXT NOT NULL,
  source TEXT,
  source_other TEXT
);
