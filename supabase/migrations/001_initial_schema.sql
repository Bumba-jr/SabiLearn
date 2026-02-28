-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tutors table
CREATE TABLE tutors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL, -- Clerk user ID
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  subjects JSONB DEFAULT '[]'::jsonb,
  levels JSONB DEFAULT '[]'::jsonb,
  hourly_rate DECIMAL(10, 2),
  rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  location TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create students table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL, -- Clerk user ID
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  grade_level TEXT,
  parent_name TEXT,
  parent_email TEXT,
  parent_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  status TEXT DEFAULT 'scheduled', -- scheduled, completed, cancelled
  location_type TEXT, -- online, home
  location_address TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  payment_status TEXT DEFAULT 'pending', -- pending, held, released, refunded
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id TEXT NOT NULL, -- Clerk user ID
  receiver_id TEXT NOT NULL, -- Clerk user ID
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_tutors_user_id ON tutors(user_id);
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_sessions_tutor_id ON sessions(tutor_id);
CREATE INDEX idx_sessions_student_id ON sessions(student_id);
CREATE INDEX idx_sessions_scheduled_at ON sessions(scheduled_at);
CREATE INDEX idx_reviews_tutor_id ON reviews(tutor_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_tutors_updated_at BEFORE UPDATE ON tutors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tutors
CREATE POLICY "Tutors are viewable by everyone" ON tutors
  FOR SELECT USING (true);

CREATE POLICY "Tutors can update own profile" ON tutors
  FOR UPDATE USING (auth.uid()::text = user_id);

-- RLS Policies for students
CREATE POLICY "Students can view own profile" ON students
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Students can update own profile" ON students
  FOR UPDATE USING (auth.uid()::text = user_id);

-- RLS Policies for sessions
CREATE POLICY "Users can view their own sessions" ON sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tutors WHERE tutors.id = sessions.tutor_id AND tutors.user_id = auth.uid()::text
    ) OR EXISTS (
      SELECT 1 FROM students WHERE students.id = sessions.student_id AND students.user_id = auth.uid()::text
    )
  );

-- RLS Policies for reviews
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

-- RLS Policies for messages
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT USING (sender_id = auth.uid()::text OR receiver_id = auth.uid()::text);

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (sender_id = auth.uid()::text);
