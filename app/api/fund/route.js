import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase-server';

// POST /api/fund — create a pledge for a job
// When Stripe keys are configured, this will redirect to real Stripe Checkout.
// For now, it records the pledge directly.
export async function POST(request) {
  const { jobId, amount, message } = await request.json();
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: job } = await supabase.from('jobs').select('*').eq('id', jobId).single();
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  // TODO: When Stripe keys are configured, create a real Checkout session for the pledge amount

  // Record pledge
  await supabase.from('pledges').insert({
    job_id: jobId,
    user_id: user.id,
    amount,
    message: message || null,
    status: 'completed',
  });

  // Check if funding goal is now met
  const { data: allPledges } = await supabase
    .from('pledges')
    .select('amount')
    .eq('job_id', jobId)
    .eq('status', 'completed');

  const total = (allPledges || []).reduce((sum, p) => sum + Number(p.amount), 0);

  if (job.funding_goal && total >= job.funding_goal && job.status === 'funding') {
    await supabase.from('jobs').update({ status: 'hiring' }).eq('id', jobId);
  }

  return NextResponse.json({ url: '/success?action=funded' });
}
