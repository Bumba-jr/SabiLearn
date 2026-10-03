-- Run this in the Supabase SQL editor (Dashboard -> SQL -> New query).
-- Adds support tooling: admin↔user chat categories, admin document/info
-- requests, and user reports about tutors.

-- ============================================================================
-- 1. Conversations: support categories + open/closed status
-- ============================================================================
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'chat';   -- chat | support | report
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';     -- open | closed
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS subject TEXT;

-- ============================================================================
-- 2. Admin requests ("please submit this document" / "we need more info")
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,                 -- auth.users id of the user who must respond
  type TEXT NOT NULL DEFAULT 'document_request',  -- document_request | info_request
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',         -- pending | resolved
  created_by UUID,                       -- admin auth.users id
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS admin_requests_user_idx ON admin_requests (user_id, status);

-- ============================================================================
-- 3. Reports (students/parents report a tutor)
-- ============================================================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL,             -- auth.users id of the reporter
  reporter_role TEXT,
  tutor_id UUID REFERENCES tutors(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open',   -- open | reviewing | resolved
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reports_status_idx ON reports (status, created_at);
