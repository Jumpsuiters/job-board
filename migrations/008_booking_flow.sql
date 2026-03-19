-- 008: Booking & Completion Flow
-- Adds booking_mode to jobs, enriches bookings for request flow,
-- updates status constraints for new lifecycle

-- Add booking_mode to jobs (instant or request)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS booking_mode TEXT NOT NULL DEFAULT 'instant';

-- Add fields to bookings for the request flow
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rate_type TEXT; -- 'hourly', 'half_day', 'day', 'week'
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS requested_time TIMESTAMPTZ;

-- Update booking status constraint to support full lifecycle
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('pending', 'confirmed', 'completed', 'declined', 'cancelled'));

-- Migrate existing bookings from old statuses
UPDATE bookings SET status = 'confirmed' WHERE status NOT IN ('pending', 'confirmed', 'completed', 'declined', 'cancelled');

-- Remove worker_id from jobs (seller IS the provider via user_id)
-- Keep column for now but stop using it — drop in future cleanup

-- Update job status constraint (remove in_progress, jobs stay open)
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_status_check
  CHECK (status IN ('open', 'completed'));
UPDATE jobs SET status = 'open' WHERE status = 'in_progress';
