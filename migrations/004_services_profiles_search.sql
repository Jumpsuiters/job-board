-- ============================================
-- JOB Board: Services, Profiles & Search
-- ============================================

-- ============================================
-- 1. Add slug to profiles
-- ============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Backfill existing profiles with slug from UUID
UPDATE profiles SET slug = REPLACE(id::text, '-', '') WHERE slug IS NULL;

-- Update trigger to auto-generate slug for new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, slug)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    REPLACE(NEW.id::text, '-', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. Add worker_id and hire_count to jobs
-- ============================================
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS worker_id UUID REFERENCES profiles(id);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS hire_count INTEGER DEFAULT 0;

-- ============================================
-- 3. Update status enum: replace hiring/in_progress with active
-- ============================================
-- Drop old constraint FIRST, then migrate rows
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
UPDATE jobs SET status = 'active' WHERE status IN ('hiring', 'in_progress');
ALTER TABLE jobs ADD CONSTRAINT jobs_status_check
  CHECK (status IN ('dreaming', 'funding', 'active', 'completed'));

-- ============================================
-- 4. Create bookings table
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  worker_id UUID REFERENCES profiles(id) NOT NULL,
  booker_id UUID REFERENCES profiles(id) NOT NULL,
  amount NUMERIC NOT NULL,
  platform_fee NUMERIC NOT NULL,
  worker_amount NUMERIC NOT NULL,
  stripe_session_id TEXT,
  status TEXT DEFAULT 'completed'
    CHECK (status IN ('pending', 'completed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 5. Create stipends table
-- ============================================
CREATE TABLE IF NOT EXISTS stipends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID REFERENCES profiles(id) NOT NULL,
  sender_id UUID REFERENCES profiles(id) NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  platform_fee NUMERIC NOT NULL,
  recipient_amount NUMERIC NOT NULL,
  stripe_session_id TEXT,
  status TEXT DEFAULT 'completed'
    CHECK (status IN ('pending', 'completed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 6. RLS for new tables
-- ============================================
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE stipends ENABLE ROW LEVEL SECURITY;

-- Bookings: public read, auth insert (booker must be current user)
CREATE POLICY "Public bookings" ON bookings FOR SELECT USING (true);
CREATE POLICY "Auth users create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = booker_id);

-- Stipends: public read, auth insert (sender must be current user)
CREATE POLICY "Public stipends" ON stipends FOR SELECT USING (true);
CREATE POLICY "Auth users create stipends" ON stipends
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

