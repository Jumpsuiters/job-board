-- ============================================
-- JOB Board: PRD Realignment
-- Supply-led, fixed pricing, simplified flow
-- ============================================

-- 1. Add new fields to jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'asap'
  CHECK (availability IN ('asap', 'scheduled'));
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS scheduled_time TIMESTAMPTZ;

-- 2. Add new fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS available_for TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS available_type TEXT DEFAULT 'both'
  CHECK (available_type IN ('virtual', 'irl', 'both'));

-- 3. Update status enum: open / in_progress / completed
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
UPDATE jobs SET status = 'open' WHERE status IN ('dreaming', 'funding', 'active');
ALTER TABLE jobs ADD CONSTRAINT jobs_status_check
  CHECK (status IN ('open', 'in_progress', 'completed'));

-- 4. Replace seed data with PRD-aligned jobs
DELETE FROM jobs WHERE user_id IS NULL;

INSERT INTO jobs (title, description, category, job_type, location, price, status, availability) VALUES
(
  'I''ll sit with you while you cry',
  'No advice. No fixing. I''ll just be there. You cry, I hold space. That''s the whole job. Sometimes you just need a human who won''t try to make it better — just someone who stays.',
  'Support',
  'virtual',
  'Remote',
  25,
  'open',
  'asap'
),
(
  'I''ll be your hype person for 10 minutes',
  'Big meeting? First date? Hard conversation? I''ll gas you up. Ten minutes of pure, unfiltered belief in you. I''ll remind you what you bring to the table until you believe it yourself.',
  'Presence',
  'virtual',
  'Remote',
  15,
  'open',
  'asap'
),
(
  'I''ll sing you something live',
  'Tell me the mood you''re in and I''ll pick a song just for you. Or I''ll surprise you. Not a recording — live, real, imperfect. That''s what makes it beautiful. Just a human voice, for you.',
  'Creativity',
  'virtual',
  'Remote',
  30,
  'open',
  'asap'
),
(
  'I''ll draw you while we talk',
  'We hop on a call and talk about whatever — life, dreams, the weird thing that happened today. While we talk, I draw you. At the end, you get a portrait made by someone who actually listened.',
  'Creativity',
  'virtual',
  'Remote',
  50,
  'open',
  'scheduled'
),
(
  'I''ll walk your dog and narrate the whole thing',
  'I take your dog on a walk and send you a voice memo narrating the whole adventure. What is he sniffing? Did he make a friend? Is he being dramatic? You get the full story.',
  'Presence',
  'local',
  'Nashville, TN',
  20,
  'open',
  'scheduled'
);
