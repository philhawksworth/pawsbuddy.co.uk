CREATE TABLE IF NOT EXISTS onboarding_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT DEFAULT (datetime('now')),
  ip TEXT,
  user_agent TEXT,
  referrer TEXT
);

CREATE TABLE IF NOT EXISTS onboarding_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id INTEGER NOT NULL REFERENCES onboarding_submissions(id),
  question_key TEXT NOT NULL,
  answer_value TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_onboarding_answers_submission ON onboarding_answers(submission_id);
