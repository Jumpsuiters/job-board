-- Add job_type column (already applied via CLI, keeping for reference)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_type TEXT DEFAULT 'local';

-- Update seed job
UPDATE jobs SET job_type = 'local' WHERE job_type IS NULL;
