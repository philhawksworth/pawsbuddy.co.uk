-- Add optional request metadata columns preserved from the legacy Netlify form system.
-- These are NULL for submissions made via the new Pages Function handler.
ALTER TABLE submissions ADD COLUMN ip TEXT;
ALTER TABLE submissions ADD COLUMN user_agent TEXT;
ALTER TABLE submissions ADD COLUMN referrer TEXT;
