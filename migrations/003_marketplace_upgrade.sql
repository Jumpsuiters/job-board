-- ============================================
-- JOB Board: Marketplace Upgrade Migration
-- ============================================

-- Drop old prototype tables
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  avatar_url TEXT,
  location TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile when a user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- JOBS
-- ============================================
CREATE TABLE jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  job_type TEXT DEFAULT 'local',
  location TEXT,
  price NUMERIC,
  funding_goal NUMERIC,
  status TEXT DEFAULT 'dreaming'
    CHECK (status IN ('dreaming', 'funding', 'hiring', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- APPLICATIONS
-- ============================================
CREATE TABLE applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT,
  availability TEXT,
  proposed_rate NUMERIC,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- PLEDGES
-- ============================================
CREATE TABLE pledges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  stripe_session_id TEXT,
  status TEXT DEFAULT 'completed'
    CHECK (status IN ('pending', 'completed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- PAYMENTS
-- ============================================
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  application_id UUID REFERENCES applications(id),
  payer_id UUID REFERENCES profiles(id) NOT NULL,
  payee_id UUID REFERENCES profiles(id) NOT NULL,
  amount NUMERIC NOT NULL,
  platform_fee NUMERIC NOT NULL,
  worker_amount NUMERIC NOT NULL,
  stripe_session_id TEXT,
  status TEXT DEFAULT 'completed'
    CHECK (status IN ('pending', 'completed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Public profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Jobs
CREATE POLICY "Public jobs" ON jobs FOR SELECT USING (true);
CREATE POLICY "Auth users create jobs" ON jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Creators update jobs" ON jobs
  FOR UPDATE USING (auth.uid() = user_id);

-- Applications
CREATE POLICY "Applicants and creators read applications" ON applications
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() IN (SELECT user_id FROM jobs WHERE id = applications.job_id)
  );
CREATE POLICY "Auth users create applications" ON applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Pledges
CREATE POLICY "Public pledges" ON pledges FOR SELECT USING (true);
CREATE POLICY "Auth users create pledges" ON pledges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Payments
CREATE POLICY "Payment parties read" ON payments
  FOR SELECT USING (auth.uid() = payer_id OR auth.uid() = payee_id);
CREATE POLICY "System creates payments" ON payments
  FOR INSERT WITH CHECK (true);
CREATE POLICY "System updates payments" ON payments
  FOR UPDATE USING (true);

-- ============================================
-- SEED DATA (dream jobs without owners)
-- ============================================
INSERT INTO jobs (title, description, category, job_type, location, price, funding_goal, status) VALUES
(
  'Human Walker',
  'Be a walking companion for people who want company on their daily walks. Listen, chat, or just be present. Some people need a reason to get outside — you''re it.',
  'Community',
  'local',
  'Any city',
  25,
  500,
  'funding'
),
(
  'Dinner Party Philosopher',
  'Show up to dinner parties and ask the questions nobody else will. "What would you do if money didn''t exist?" "When was the last time you changed your mind about something important?" You set the vibe.',
  'Creative',
  'local',
  'Austin, TX',
  50,
  NULL,
  'hiring'
),
(
  'Neighborhood Historian',
  'Walk through neighborhoods and uncover their stories. Talk to longtime residents, photograph fading murals, map the places that shaped a community. Turn it all into something people can explore.',
  'Community',
  'local',
  'Any city',
  30,
  1000,
  'funding'
),
(
  'Forest Listener',
  'Spend time in forests recording ambient sounds. Create soundscapes for meditation apps, therapy sessions, and people who can''t get to nature. The forest has things to say.',
  'Environment',
  'local',
  'Pacific Northwest',
  35,
  750,
  'dreaming'
),
(
  'Accountability Pirate',
  'A virtual accountability partner with swagger. Check in with people daily, celebrate their wins, call out their excuses (with love), and keep them on course. Arrr you doing the thing you said you''d do?',
  'Creative',
  'virtual',
  'Remote',
  40,
  NULL,
  'hiring'
),
(
  'Road Trip DJ',
  'Curate the perfect playlist for someone''s road trip based on the route, the mood, and the vibe they''re going for. Deliver it with liner notes explaining each song choice.',
  'Creative',
  'virtual',
  'Remote',
  20,
  300,
  'funding'
),
(
  'Grief Companion',
  'Be present with people who are grieving. Not a therapist — a human. Sit with them, walk with them, help them navigate the weird logistics of loss. Hold space without trying to fix anything.',
  'Health',
  'virtual',
  'Remote / In-person',
  45,
  1500,
  'dreaming'
);
