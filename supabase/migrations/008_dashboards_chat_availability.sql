-- Run this in the Supabase SQL editor (Dashboard -> SQL -> New query).
-- Adds everything the new dashboards, chat, availability and parent flow need.

-- ============================================================================
-- 1. Chat: conversations + messages (between auth users, optionally about a tutor)
-- ============================================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_a UUID NOT NULL, -- auth.users id
  participant_b UUID NOT NULL, -- auth.users id
  tutor_id UUID REFERENCES tutors(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- one conversation per pair (per tutor context)
CREATE UNIQUE INDEX IF NOT EXISTS conversations_pair_unique
  ON conversations (
    LEAST(participant_a, participant_b),
    GREATEST(participant_a, participant_b),
    COALESCE(tutor_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

-- An old Clerk-era `messages` table (sender_id/receiver_id/content) may already
-- exist from 001_initial_schema.sql. Preserve it as a backup and replace it.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'messages' AND column_name = 'receiver_id') THEN
    DROP TABLE IF EXISTS messages_old_clerk;
    ALTER TABLE messages RENAME TO messages_old_clerk;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL, -- auth.users id of the sender
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS messages_conversation_idx
  ON messages (conversation_id, created_at);

-- ============================================================================
-- 2. Tutor weekly availability
--    Format: {"mon": [{"from": "16:00", "to": "19:00"}], "tue": [], ...}
--    Empty array = not available that day. Missing day = not available.
-- ============================================================================
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS availability JSONB DEFAULT '{}'::jsonb;

-- ============================================================================
-- 3. Parent <-> child link (parent is a profiles row with role='parent')
-- ============================================================================
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS students_parent_id_idx ON students (parent_id);
