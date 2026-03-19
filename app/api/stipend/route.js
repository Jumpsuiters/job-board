import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase-server';

// POST /api/stipend — send a stipend to support someone
export async function POST(request) {
  const { recipientId, amount, message } = await request.json();
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (!recipientId || !amount || amount <= 0) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const platformFee = +(amount * 0.20).toFixed(2);
  const recipientAmount = +(amount - platformFee).toFixed(2);

  const { error } = await supabase.from('stipends').insert({
    recipient_id: recipientId,
    sender_id: user.id,
    amount,
    message: message || null,
    platform_fee: platformFee,
    recipient_amount: recipientAmount,
    status: 'completed',
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ url: '/success?action=stipend' });
}
