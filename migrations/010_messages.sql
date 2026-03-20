CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read booking messages" ON messages FOR SELECT
  USING (sender_id = auth.uid() OR booking_id IN (
    SELECT id FROM bookings WHERE booker_id = auth.uid() OR worker_id = auth.uid()
  ));

CREATE POLICY "Send booking messages" ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid() AND booking_id IN (
    SELECT id FROM bookings WHERE booker_id = auth.uid() OR worker_id = auth.uid()
  ));
