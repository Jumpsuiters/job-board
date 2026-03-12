-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  pay TEXT,
  location TEXT,
  posted_by TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  reason TEXT,
  availability TEXT,
  contact_info TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Permissive policies (no auth required)
CREATE POLICY "Anyone can read jobs" ON jobs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert jobs" ON jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read applications" ON applications FOR SELECT USING (true);
CREATE POLICY "Anyone can insert applications" ON applications FOR INSERT WITH CHECK (true);

-- Seed: one sample dream job
INSERT INTO jobs (title, description, pay, location, posted_by, category)
VALUES (
  'Community Garden Coordinator',
  'Help us design and maintain a neighborhood garden that feeds 50 families. You''ll plan seasonal crops, organize volunteer days, and teach kids where food comes from.',
  'Sliding scale $25-40/hr',
  'Austin, TX (on-site)',
  'Nicole',
  'Community'
);
