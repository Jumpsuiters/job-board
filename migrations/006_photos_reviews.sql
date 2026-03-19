-- ============================================
-- Photos, Ratings & Reviews
-- ============================================

-- 1. Photo URL on jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 2. Avatar URL on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 3. Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES profiles(id) NOT NULL,
  reviewed_id UUID REFERENCES profiles(id) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Prevent duplicate reviews per booking
CREATE UNIQUE INDEX IF NOT EXISTS reviews_booking_reviewer_idx
  ON reviews(booking_id, reviewer_id);

-- RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews"
  ON reviews FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- 4. Storage bucket for uploads (run in Supabase SQL Editor)
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'uploads' AND auth.role() = 'authenticated');

-- Allow public reads
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'uploads');
