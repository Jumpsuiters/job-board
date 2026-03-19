-- ============================================
-- Rate fields: per hour, half day, day, week
-- ============================================

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS price_half_day NUMERIC;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS price_day NUMERIC;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS price_week NUMERIC;

-- Rename existing price to price_hour for clarity
-- (keeping 'price' as-is for backwards compat, it becomes the hourly rate)
