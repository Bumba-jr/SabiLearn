-- Run this in the Supabase SQL editor (Dashboard -> SQL -> New query).
-- Adds the live class system: tutors start a class from an accepted booking,
-- students/parents attend on-site, attendance is tracked for parents.

-- ============================================================================
-- 1. Classes — one live/ended class per accepted booking
-- ============================================================================
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'live',          -- live | ended
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (session_id)
);

CREATE INDEX IF NOT EXISTS classes_status_idx ON classes (status);

-- ============================================================================
-- 2. Attendance — presence of each student (child) in a class
-- ============================================================================
CREATE TABLE IF NOT EXISTS class_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  first_joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (class_id, student_id)
);

CREATE INDEX IF NOT EXISTS class_attendance_class_idx ON class_attendance (class_id);
