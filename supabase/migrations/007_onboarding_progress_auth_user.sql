-- Run this in the Supabase SQL editor (Dashboard -> SQL -> New query).
-- Adds auth_user_id to onboarding_progress so tutor onboarding progress
-- can auto-save per logged-in user (the table previously used clerk_user_id).

ALTER TABLE onboarding_progress
  ADD COLUMN IF NOT EXISTS auth_user_id UUID;

-- The old Clerk-era column is NOT NULL and UNIQUE; relax it so rows keyed by
-- auth_user_id can be inserted. auth_user_id gets its own unique index below.
ALTER TABLE onboarding_progress ALTER COLUMN clerk_user_id DROP NOT NULL;
ALTER TABLE onboarding_progress DROP CONSTRAINT IF EXISTS onboarding_progress_clerk_user_id_key;

-- Allow one progress row per auth user
CREATE UNIQUE INDEX IF NOT EXISTS onboarding_progress_auth_user_id_key
  ON onboarding_progress (auth_user_id);

CREATE INDEX IF NOT EXISTS onboarding_progress_auth_user_id_idx
  ON onboarding_progress (auth_user_id);

-- Old clerk-keyed rows are from the abandoned Clerk era; drop them
DELETE FROM onboarding_progress WHERE auth_user_id IS NULL;
