import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase-server';

// POST /api/checkout — create a Stripe Checkout session for hiring
// When Stripe keys are configured, this will redirect to real Stripe Checkout.
// For now, it simulates the payment and returns a success URL.
export async function POST(request) {
  const { jobId, applicationId } = await request.json();
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Fetch job and application
  const { data: job } = await supabase.from('jobs').select('*').eq('id', jobId).single();
  const { data: application } = await supabase.from('applications').select('*').eq('id', applicationId).single();

  if (!job || !application) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (job.user_id !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const amount = job.price || 0;
  const platformFee = +(amount * 0.15).toFixed(2);
  const workerAmount = +(amount - platformFee).toFixed(2);

  // TODO: When Stripe keys are configured, create a real Checkout session:
  // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  // const session = await stripe.checkout.sessions.create({
  //   payment_method_types: ['card'],
  //   line_items: [{ price_data: { currency: 'usd', unit_amount: Math.round(amount * 100), product_data: { name: job.title } }, quantity: 1 }],
  //   mode: 'payment',
  //   success_url: `${request.headers.get('origin')}/success?action=hired`,
  //   cancel_url: `${request.headers.get('origin')}/jobs/${jobId}`,
  //   payment_intent_data: { application_fee_amount: Math.round(platformFee * 100) },
  // });

  // Simulate payment
  await supabase.from('payments').insert({
    job_id: jobId,
    application_id: applicationId,
    payer_id: user.id,
    payee_id: application.user_id,
    amount,
    platform_fee: platformFee,
    worker_amount: workerAmount,
    status: 'completed',
  });

  await supabase.from('applications').update({ status: 'accepted' }).eq('id', applicationId);
  await supabase.from('jobs').update({ status: 'in_progress' }).eq('id', jobId);

  return NextResponse.json({ url: '/success?action=hired' });
}
